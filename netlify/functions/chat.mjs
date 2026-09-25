/**
 * Arian Assistant — POST /api/chat
 *
 * This is the only place the Gemini API key exists. The browser never sees it.
 *
 * What it does:
 *   1. validates the request body (shape, roles, length, turn count);
 *   2. rate limits per client IP (in memory, per warm instance);
 *   3. loads Arian's approved knowledge base from Supabase with the
 *      service-role key — those rows are never readable from a browser;
 *   4. asks Gemini with a strict system prompt that scopes the assistant to
 *      Arian and this website;
 *   5. returns a single reply, or a clear error the UI can show.
 *
 * The offline equivalent of the brief lives in src/lib/assistantBrief.ts, which
 * is what the front end falls back to when this function is unreachable.
 */

const MAX_MESSAGE_CHARS = 500;
const MAX_TURNS = 12;
const MAX_KNOWLEDGE_ENTRIES = 40;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const RATE_LIMIT_PER_MINUTE = Number(process.env.CHAT_RATE_LIMIT_PER_MINUTE || 12);
const RATE_WINDOW_MS = 60_000;

/** ip -> array of request timestamps within the window. */
const rateBuckets = new Map();

const SYSTEM_PROMPT = `You are Arian Assistant, a website assistant created by Arian.

You may answer only questions about Arian, Arian's YouTube channel, Arian's content, the games Arian covers, this website, sponsorships, gallery access, and how to contact Arian.

If a user asks about unrelated topics, politely say that you can only answer questions about Arian and this website.

Do not invent Arian's personal information, achievements, partnerships, statistics, or private details.

When appropriate, explain that you were created by Arian for this website.

Use the website's approved content and the knowledge base below as your primary source. If the knowledge base does not cover something, say you do not have that detail and point the user to the contact page. Keep answers short, warm and concrete — two to four sentences unless asked for more. Never claim to have sent an email or completed an action.`;

const SITE_CONTENT_KEYS = [
  "brand.name",
  "about.intro",
  "about.identity",
  "about.games",
  "about.categories",
  "sponsor.headline",
  "sponsor.intro",
  "contact.email",
  "social.youtube",
];

export default async (request) => {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return json(503, {
      error: "Arian Assistant is not configured yet. Add GEMINI_API_KEY in the site's environment variables.",
    });
  }

  const limit = checkRateLimit(clientIp(request));
  if (!limit.allowed) {
    return json(429, {
      error: `Too many questions in a row. Please wait about ${limit.retryAfterSeconds} seconds and try again.`,
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Send a JSON body with a messages array." });
  }

  const parsed = validateMessages(body?.messages);
  if (!parsed.ok) return json(400, { error: parsed.error });

  try {
    const knowledge = await loadKnowledge();
    const reply = await askGemini(apiKey, parsed.messages, knowledge);
    return json(200, { reply, source: "live" });
  } catch (error) {
    console.error("Arian Assistant failed:", error);
    const message =
      error instanceof UpstreamError
        ? error.message
        : "The assistant could not answer that right now. Please try again, or use the contact page.";
    return json(502, { error: message });
  }
};

class UpstreamError extends Error {}

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function clientIp(request) {
  return (
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function checkRateLimit(ip) {
  const now = Date.now();
  const stamps = (rateBuckets.get(ip) ?? []).filter((stamp) => now - stamp < RATE_WINDOW_MS);

  if (stamps.length >= RATE_LIMIT_PER_MINUTE) {
    const retryAfterSeconds = Math.max(1, Math.ceil((RATE_WINDOW_MS - (now - stamps[0])) / 1000));
    rateBuckets.set(ip, stamps);
    return { allowed: false, retryAfterSeconds };
  }

  stamps.push(now);
  rateBuckets.set(ip, stamps);

  // Keep the map from growing without bound on a long-lived instance.
  if (rateBuckets.size > 5000) {
    for (const [key, value] of rateBuckets) {
      if (value.every((stamp) => now - stamp > RATE_WINDOW_MS)) rateBuckets.delete(key);
    }
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

function validateMessages(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: "The messages array is empty." };
  }
  if (raw.length > MAX_TURNS * 2) {
    return { ok: false, error: "That conversation is too long. Please start a new one." };
  }

  const messages = [];
  for (const entry of raw) {
    const role = entry?.role === "assistant" ? "model" : entry?.role === "user" ? "user" : null;
    const content = typeof entry?.content === "string" ? entry.content.trim() : "";
    if (!role) return { ok: false, error: "Each message needs a role of user or assistant." };
    if (!content) return { ok: false, error: "Messages cannot be empty." };
    if (content.length > MAX_MESSAGE_CHARS) {
      return { ok: false, error: `Please keep each message under ${MAX_MESSAGE_CHARS} characters.` };
    }
    messages.push({ role, text: content });
  }

  if (messages[messages.length - 1].role !== "user") {
    return { ok: false, error: "The last message must come from the user." };
  }
  return { ok: true, messages: messages.slice(-MAX_TURNS) };
}

async function loadKnowledge() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return "";

  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  const [knowledgeResponse, contentResponse] = await Promise.all([
    fetch(
      `${url}/rest/v1/chat_knowledge?is_active=eq.true&select=title,content&limit=${MAX_KNOWLEDGE_ENTRIES}`,
      { headers }
    ),
    fetch(
      `${url}/rest/v1/site_content?select=content_key,content_value&content_key=in.(${SITE_CONTENT_KEYS.join(",")})`,
      { headers }
    ),
  ]);

  const sections = [];

  if (knowledgeResponse.ok) {
    const rows = await knowledgeResponse.json();
    if (Array.isArray(rows) && rows.length > 0) {
      sections.push(
        "APPROVED KNOWLEDGE BASE\n" +
          rows
            .map((row) => `- ${row.title}: ${row.content}`)
            .join("\n")
      );
    }
  }

  if (contentResponse.ok) {
    const rows = await contentResponse.json();
    if (Array.isArray(rows) && rows.length > 0) {
      sections.push(
        "WEBSITE CONTENT\n" +
          rows.map((row) => `- ${row.content_key}: ${row.content_value}`).join("\n")
      );
    }
  }

  return sections.join("\n\n");
}

async function askGemini(apiKey, messages, knowledge) {
  const systemInstruction = knowledge
    ? `${SYSTEM_PROMPT}\n\n${knowledge}`
    : SYSTEM_PROMPT;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: messages.map((message) => ({
          role: message.role,
          parts: [{ text: message.text }],
        })),
        generationConfig: {
          temperature: 0.6,
          topP: 0.9,
          maxOutputTokens: 512,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    }
  );

  if (response.status === 429) {
    throw new UpstreamError("The assistant is handling a lot of questions right now. Please try again shortly.");
  }
  if (!response.ok) {
    const detail = await response.text();
    console.error("Gemini error", response.status, detail.slice(0, 400));
    if (response.status === 400 || response.status === 403) {
      throw new UpstreamError("The assistant's API key was rejected. Check GEMINI_API_KEY.");
    }
    throw new UpstreamError("The assistant could not answer that right now. Please try again.");
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("").trim();

  if (!text) {
    if (candidate?.finishReason === "SAFETY") {
      return "I can't answer that one. Ask me something about Arian, the channel, or how to get in touch.";
    }
    throw new UpstreamError("The assistant returned an empty answer. Please try asking again.");
  }
  return text;
}
