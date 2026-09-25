import { chatEndpoint } from "../lib/supabaseClient";
import { ASSISTANT_SUGGESTIONS, answerFromBrief } from "../lib/assistantBrief";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatReply {
  reply: string;
  /** "live" = Gemini via the Netlify function, "local" = built-in brief. */
  source: "live" | "local";
  notice?: string;
}

export const MAX_MESSAGE_LENGTH = 500;
export const MAX_TURNS = 12;

export class ChatError extends Error {}

/**
 * Posts the conversation to the Netlify function at /api/chat, which is the
 * only place the Gemini key exists.
 *
 * If the function is unreachable (running `vite dev` without `netlify dev`, or
 * the key is not configured yet) the assistant answers from Arian's brief
 * instead and says so, rather than showing a dead end.
 */
export async function sendChatMessage(history: ChatTurn[]): Promise<ChatReply> {
  const question = [...history].reverse().find((turn) => turn.role === "user")?.content ?? "";
  const trimmedHistory = history.slice(-MAX_TURNS);

  try {
    const response = await fetch(chatEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: trimmedHistory }),
    });

    if (!response.ok) {
      const detail = await safeErrorMessage(response);
      if (response.status === 400 || response.status === 429) {
        // These are real answers from the function (validation / rate limit),
        // not a connectivity problem, so surface them as-is.
        throw new ChatError(detail);
      }
      return localReply(question);
    }

    const data = (await response.json()) as { reply?: string; notice?: string };
    if (!data.reply) throw new ChatError("The assistant did not return an answer.");
    return { reply: data.reply, source: "live", notice: data.notice };
  } catch (error) {
    if (error instanceof ChatError) throw error;
    return localReply(question);
  }
}

function localReply(question: string): ChatReply {
  return {
    reply: answerFromBrief(question),
    source: "local",
    notice:
      "Arian Assistant is running in offline mode, so this answer comes from Arian's own written notes instead of the AI service.",
  };
}

async function safeErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    /* fall through */
  }
  if (response.status === 429) return "Too many questions at once. Please wait a moment and try again.";
  return "The assistant could not answer that. Please try again.";
}

export { ASSISTANT_SUGGESTIONS };
