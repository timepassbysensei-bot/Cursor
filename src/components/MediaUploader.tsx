import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, CloudUpload, FileAudio, ImageIcon, Loader2 } from "lucide-react";
import { cn, formatBytes } from "../lib/utils";
import { ProgressBar } from "./ui/States";

type Status = "queued" | "uploading" | "done" | "error";

interface QueueEntry {
  id: string;
  name: string;
  size: number;
  percent: number;
  status: Status;
  error?: string;
}

interface MediaUploaderProps {
  accept: string;
  multiple?: boolean;
  kind: "image" | "audio";
  title: string;
  hint: string;
  disabled?: boolean;
  /** Resolves when one file is stored; reject with a message to show an error. */
  onUpload: (file: File, onProgress: (percent: number) => void) => Promise<void>;
  onFinished?: () => void;
}

/**
 * Drag-and-drop upload surface used by the gallery and audio sections.
 *
 * Files are uploaded one at a time so progress is meaningful and a slow
 * connection is not saturated by parallel requests. Keyboard users get a real
 * focusable button, and every row reports its own progress, size and error.
 */
export function MediaUploader({
  accept,
  multiple = false,
  kind,
  title,
  hint,
  disabled,
  onUpload,
  onFinished,
}: MediaUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const update = useCallback((id: string, patch: Partial<QueueEntry>) => {
    setQueue((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }, []);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList).slice(0, multiple ? 12 : 1);

      const entries: QueueEntry[] = files.map((file) => ({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        percent: 0,
        status: "queued",
      }));
      setQueue((current) => [...entries, ...current].slice(0, 24));

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const entry = entries[index];
        update(entry.id, { status: "uploading", percent: 2 });
        try {
          await onUpload(file, (percent) => update(entry.id, { percent, status: "uploading" }));
          update(entry.id, { status: "done", percent: 100 });
        } catch (error) {
          update(entry.id, {
            status: "error",
            percent: 0,
            error: error instanceof Error ? error.message : "Upload failed.",
          });
        }
      }

      if (inputRef.current) inputRef.current.value = "";
      onFinished?.();
    },
    [multiple, onUpload, onFinished, update]
  );

  const busy = queue.some((entry) => entry.status === "uploading" || entry.status === "queued");

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (disabled) return;
          void handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "relative rounded-2xl border border-dashed p-6 text-center transition-colors duration-300",
          dragging ? "border-cyan/70 bg-cyan/[0.08]" : "border-white/15 bg-surface/40",
          disabled && "opacity-60"
        )}
      >
        <motion.span
          aria-hidden
          animate={dragging ? { scale: 1.08, y: -3 } : { scale: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-hairline bg-white/[0.04]"
        >
          {kind === "image" ? (
            <ImageIcon className="h-5 w-5 text-cyan" aria-hidden />
          ) : (
            <FileAudio className="h-5 w-5 text-violet" aria-hidden />
          )}
        </motion.span>

        <p className="font-display text-sm font-semibold text-ink">{title}</p>
        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted">{hint}</p>

        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-hairline bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:border-cyan/40 hover:bg-cyan/[0.06] disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <CloudUpload className="h-3.5 w-3.5" aria-hidden />
          )}
          {busy ? "Uploading…" : multiple ? "Choose files" : "Choose a file"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(event) => void handleFiles(event.target.files)}
          disabled={disabled}
          tabIndex={-1}
        />
      </div>

      <AnimatePresence initial={false}>
        {queue.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 overflow-hidden"
            aria-live="polite"
          >
            {queue.map((entry) => (
              <li key={entry.id} className="rounded-xl border border-hairline bg-surface/50 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="shrink-0">
                    {entry.status === "done" && <CheckCircle2 className="h-4 w-4 text-jade" aria-hidden />}
                    {entry.status === "error" && <AlertTriangle className="h-4 w-4 text-coral" aria-hidden />}
                    {(entry.status === "uploading" || entry.status === "queued") && (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-ink">{entry.name}</span>
                    <span className="block text-2xs text-faint">
                      {formatBytes(entry.size)}
                      {entry.status === "done" && " · uploaded"}
                      {entry.status === "uploading" && ` · ${entry.percent}%`}
                    </span>
                  </span>
                </div>
                {entry.status === "uploading" && (
                  <ProgressBar value={entry.percent} className="mt-2" label="Uploading" />
                )}
                {entry.status === "error" && (
                  <p role="alert" className="mt-1.5 text-2xs leading-relaxed text-coral">
                    {entry.error}
                  </p>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
