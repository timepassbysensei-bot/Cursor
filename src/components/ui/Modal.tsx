import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-dark/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close dialog" tabIndex={-1} />
      <div
        ref={ref}
        tabIndex={-1}
        className={`relative max-h-[92vh] w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} overflow-y-auto rounded-t-2xl bg-white shadow-lift sm:rounded-2xl`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-lightgray bg-white px-5 py-4">
          <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 hover:bg-navy/[0.06]">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  destructive,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-lightgray px-4 py-2 text-sm font-semibold text-ink hover:bg-offwhite"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${destructive ? "bg-error hover:bg-error/90" : "bg-navy hover:bg-navy-mid"}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
