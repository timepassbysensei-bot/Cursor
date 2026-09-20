import { cn } from "../lib/utils";

export function AcademyLogo({ logoUrl, className }: { logoUrl: string | null; className?: string }) {
  if (logoUrl) {
    return <img src={logoUrl} alt="Academy logo" className={cn("object-contain", className)} />;
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex items-center justify-center rounded-lg bg-navy text-white shadow-card",
        className
      )}
    >
      <svg viewBox="0 0 48 48" fill="none" className="h-[62%] w-[62%]">
        <path
          d="M24 4l15 6v10c0 10.5-6.4 18.2-15 24-8.6-5.8-15-13.5-15-24V10l15-6z"
          stroke="#D97706"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M24 14v14M17 21h14" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
