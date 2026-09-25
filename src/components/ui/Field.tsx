import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

/**
 * One labelled field wrapper used by every form in the app, so the error,
 * hint and required-marker behaviour is identical everywhere and always wired
 * to the control with `aria-describedby`.
 */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  optionalLabel,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  optionalLabel?: string;
  children: ReactNode;
}) {
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  // The description and invalid state belong on the control itself, not on a
  // wrapper, so screen readers announce them when the field takes focus.
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required && <span className="ml-1 text-coral" aria-hidden>*</span>}
        {optionalLabel && <span className="ml-1.5 font-normal normal-case text-faint">{optionalLabel}</span>}
      </label>
      {control}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-2xs leading-relaxed text-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-2xs text-coral">
          {error}
        </p>
      )}
    </div>
  );
}
