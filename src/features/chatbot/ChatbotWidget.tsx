import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, SendHorizonal, Bot } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { chatbotQuestionSchema } from "../../validation/schemas";
import { logUnansweredQuestion } from "../../services/publicContent";
import { cn } from "../../lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! Ask me about courses, eligibility, admissions, batch timings or documents. I answer only academy-related questions.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    const parsed = chatbotQuestionSchema.safeParse(text);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your question");
      return;
    }
    setError(null);
    setInput("");
    const nextMessages = [...messages, { role: "user" as const, content: parsed.data }];
    setMessages(nextMessages);
    setBusy(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("academy-chatbot", {
        body: { message: parsed.data },
      });
      if (fnError) throw fnError;
      const reply = (data as { reply?: string })?.reply;
      if (!reply) throw new Error("No reply");
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "Sorry, I could not answer right now. Please try again later, or reach us directly via the Contact page.",
        },
      ]);
      try {
        await logUnansweredQuestion(parsed.data);
      } catch {
        /* non-critical */
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div
          role="dialog"
          aria-label="Academy assistant chat"
          className="flex h-[420px] w-[min(calc(100vw-2rem),360px)] flex-col overflow-hidden rounded-2xl border border-lightgray bg-white shadow-lift"
        >
          <div className="flex items-center justify-between bg-navy px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" aria-hidden />
              <p className="font-display text-sm font-bold">Academy Assistant</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="rounded p-1 hover:bg-white/10">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-offwhite px-3 py-3" aria-live="polite">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "user" ? "ml-auto bg-navy text-white" : "bg-white text-ink shadow-card"
                )}
              >
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="max-w-[85%] rounded-xl bg-white px-3 py-2 text-sm text-muted shadow-card">Thinking…</div>
            )}
            {error && <p className="text-xs text-error" role="alert">{error}</p>}
          </div>
          <div className="border-t border-lightgray bg-white p-2">
            <div className="flex gap-2">
              <label htmlFor="chat-input" className="sr-only">
                Your question
              </label>
              <input
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Ask about admissions, courses…"
                maxLength={500}
                className="h-10 flex-1 rounded-lg border border-lightgray px-3 text-sm focus:border-navy focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={busy}
                aria-label="Send question"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy text-white hover:bg-navy-mid disabled:opacity-50"
              >
                <SendHorizonal className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mt-1.5 text-[11px] leading-tight text-muted">
              For fee, eligibility and schedule decisions, please confirm with the academy office.
            </p>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Open assistant chat"}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white shadow-lift transition-transform hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
