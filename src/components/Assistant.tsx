import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bot, MessageCircleMore, RotateCcw, SendHorizonal, Sparkles, X } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/utils";
import { ChatError, MAX_MESSAGE_LENGTH, sendChatMessage, type ChatTurn } from "../services/chat";
import { chatbotQuestionSchema } from "../validation/schemas";
import { ASSISTANT_SUGGESTIONS } from "../lib/assistantBrief";

const SESSION_KEY = "arian.assistant.session.v1";

interface ConversationProps {
  intro: string;
  suggestions: string[];
  disclaimer: string;
  className?: string;
  onClose?: () => void;
  title?: string;
}

/**
 * The assistant conversation, shared by the /chat page and the floating
 * widget so both behave identically. History lives in sessionStorage: it
 * survives navigation within the visit and disappears when the tab closes.
 */
export function AssistantConversation({
  intro,
  suggestions,
  disclaimer,
  className,
  onClose,
  title = "Arian Assistant",
}: ConversationProps) {
  const [turns, setTurns] = useState<ChatTurn[]>(() => readSession());
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    writeSession(turns);
  }, [turns]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  const send = useCallback(
    async (question: string) => {
      const parsed = chatbotQuestionSchema.safeParse(question);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Please check your question.");
        return;
      }

      setError(null);
      setNotice(null);
      setInput("");
      const nextTurns: ChatTurn[] = [...turns, { role: "user", content: parsed.data }];
      setTurns(nextTurns);
      setBusy(true);

      try {
        const reply = await sendChatMessage(nextTurns);
        if (reply.notice) setNotice(reply.notice);
        setTurns((current) => [...current, { role: "assistant", content: reply.reply }]);
      } catch (caught) {
        setError(
          caught instanceof ChatError
            ? caught.message
            : "I could not answer that right now. Please try again, or use the contact page."
        );
      } finally {
        setBusy(false);
      }
    },
    [turns]
  );

  const reset = useCallback(() => {
    setTurns([]);
    setError(null);
    setNotice(null);
  }, []);

  const visibleSuggestions = suggestions.length > 0 ? suggestions : ASSISTANT_SUGGESTIONS;

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex items-center gap-3 border-b border-hairline px-4 py-3.5 sm:px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-hairline bg-gradient-to-br from-blue/25 to-violet/25">
          <Bot className="h-4 w-4 text-cyan" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold text-ink">{title}</p>
          <p className="truncate text-2xs text-faint">Trained on Arian's own notes</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg p-2 text-faint transition-colors hover:bg-white/5 hover:text-ink"
          aria-label="Start a new conversation"
          title="Reset conversation"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-faint transition-colors hover:bg-white/5 hover:text-ink"
            aria-label="Close assistant"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="scroll-thin flex-1 space-y-3.5 overflow-y-auto px-4 py-4 sm:px-5"
        aria-live="polite"
        aria-label="Conversation"
      >
        <Bubble role="assistant">{intro}</Bubble>

        {turns.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {visibleSuggestions.slice(0, 4).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void send(suggestion)}
                className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-cyan/40 hover:text-ink"
              >
                <Sparkles className="h-3 w-3 text-cyan" aria-hidden />
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {turns.map((turn, index) => (
          <Bubble key={index} role={turn.role}>
            {turn.content}
          </Bubble>
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="flex gap-1" aria-hidden>
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="h-1.5 w-1.5 animate-sheen rounded-full bg-cyan"
                  style={{ animationDelay: `${dot * 140}ms` }}
                />
              ))}
            </span>
            Arian Assistant is typing…
          </div>
        )}

        {notice && (
          <p className="rounded-xl border border-violet/25 bg-violet/[0.07] px-3 py-2 text-2xs leading-relaxed text-violet">
            {notice}
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-coral/25 bg-coral/[0.07] px-3 py-2 text-2xs leading-relaxed text-coral">
            {error}
          </p>
        )}
      </div>

      <div className="border-t border-hairline px-4 py-3 sm:px-5">
        <form
          className="flex items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <label htmlFor="assistant-input" className="sr-only">
            Ask Arian Assistant a question
          </label>
          <textarea
            id="assistant-input"
            value={input}
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            placeholder="Ask about the channel, the games, or sponsorship…"
            className="input max-h-28 min-h-[44px] flex-1 resize-none py-3"
          />
          <button
            type="submit"
            disabled={busy || input.trim().length === 0}
            aria-label="Send question"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue to-cyan text-base transition-transform active:scale-95 disabled:opacity-40"
          >
            <SendHorizonal className="h-4 w-4" aria-hidden />
          </button>
        </form>
        <p className="mt-2 text-2xs leading-relaxed text-faint">
          {disclaimer}{" "}
          <Link to="/contact" className="font-semibold text-cyan underline-offset-2 hover:underline">
            Contact Arian
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <p
        className={cn(
          "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed sm:text-sm",
          isUser
            ? "rounded-br-md bg-gradient-to-br from-blue/90 to-cyan/80 text-base"
            : "rounded-bl-md border border-hairline bg-white/[0.04] text-ink"
        )}
      >
        {children}
      </p>
    </div>
  );
}

function readSession(): ChatTurn[] {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatTurn[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((turn) => turn && (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string")
      .slice(-24);
  } catch {
    return [];
  }
}

function writeSession(turns: ChatTurn[]): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(turns.slice(-24)));
  } catch {
    /* private mode — history simply does not persist */
  }
}

/** Floating launcher used on every public page. */
export function AssistantWidget({
  intro,
  suggestions,
  disclaimer,
}: {
  intro: string;
  suggestions: string[];
  disclaimer: string;
}) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 print:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="panel flex h-[min(76vh,34rem)] w-[min(calc(100vw-2rem),25rem)] flex-col overflow-hidden bg-elevated/95 shadow-lift"
            role="dialog"
            aria-label="Arian Assistant"
          >
            <AssistantConversation
              intro={intro}
              suggestions={suggestions}
              disclaimer={disclaimer}
              onClose={() => setOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        whileTap={{ scale: 0.95 }}
        aria-expanded={open}
        aria-label={open ? "Close Arian Assistant" : "Open Arian Assistant"}
        className="flex items-center gap-2.5 rounded-full border border-hairline bg-gradient-to-r from-blue/20 to-violet/20 px-4 py-3 text-sm font-semibold text-ink shadow-lift backdrop-blur-xl transition-colors hover:border-cyan/40"
      >
        {open ? <X className="h-4 w-4" aria-hidden /> : <MessageCircleMore className="h-4 w-4 text-cyan" aria-hidden />}
        <span className="hidden sm:inline">{open ? "Close" : "Arian Assistant"}</span>
      </motion.button>
    </div>
  );
}
