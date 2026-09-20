// Supabase Edge Function: academy-chatbot
// Deploy: supabase functions deploy academy-chatbot
// Optional env: GEMINI_API_KEY (set with: supabase secrets set GEMINI_API_KEY=...)
//
// Answers academy FAQs from the chatbot_faqs table. If GEMINI_API_KEY is
// configured, Gemini grounds its answer on the published FAQs; otherwise a
// keyword-matching fallback answers from the same table. Secrets never reach
// the browser — the widget only ever calls this function.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are the assistant for a defence-exam coaching academy (NDA, CDS, AFCAT, Agniveer preparation).
Answer ONLY using the FAQ context provided. If the answer is not in the context, say you don't know
and suggest contacting the academy office. Never invent fees, addresses, dates, results or claims.
Keep answers under 120 words. Reply in the language of the question (English or Hindi).`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  try {
    const body = await req.json();
    const message = String(body.message ?? "").trim().slice(0, 500);
    if (message.length < 2) return json({ error: "Invalid question" }, 400, cors);

    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch published FAQs (service role so anon visitors get the same public rows)
    const { data: faqs } = await svc
      .from("chatbot_faqs")
      .select("question, answer")
      .eq("status", "published")
      .order("featured", { ascending: false })
      .limit(50);
    const list = (faqs ?? []) as { question: string; answer: string }[];

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    let reply: string | null = null;

    if (geminiKey) {
      reply = await askGemini(geminiKey, message, list);
    }
    if (!reply) {
      reply = keywordFallback(message, list);
    }

    if (!reply) {
      // Log so admins can add the missing FAQ
      await svc.from("chatbot_unanswered_questions").insert({ question: message });
      reply =
        "I don't have that answer yet. Please contact the academy office directly — they'll be happy to help. Your question has been noted so we can add it to the FAQ.";
    }

    return json({ reply }, 200, cors);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500, cors);
  }
});

async function askGemini(key: string, question: string, faqs: { question: string; answer: string }[]): Promise<string | null> {
  try {
    const context = faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: `FAQ context:\n${context}\n\nQuestion: ${question}` }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}

function keywordFallback(question: string, faqs: { question: string; answer: string }[]): string | null {
  const stop = new Set(["the", "is", "a", "an", "of", "for", "to", "and", "in", "do", "you", "what", "how", "i", "my", "are", "can", "kya", "hai", "ka", "ke", "ki"]);
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stop.has(w));
  if (words.length === 0) return null;

  let best: { score: number; answer: string } | null = null;
  for (const f of faqs) {
    const q = f.question.toLowerCase();
    let score = 0;
    for (const w of words) if (q.includes(w)) score++;
    if (score > 0 && (!best || score > best.score)) best = { score, answer: f.answer };
  }
  return best ? best.answer : null;
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
