import { cn } from "@/lib/utils";

/** The relay mark: two camps connected through a checkpoint. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "glass-chip relative grid size-9 shrink-0 place-items-center rounded-[11px] text-primary",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[19px]">
        <path
          d="M5 17c0-4.4 3.1-8 7-8s7 3.6 7 8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.45"
        />
        <circle cx="5" cy="17.4" r="2.1" fill="currentColor" />
        <circle cx="19" cy="17.4" r="2.1" fill="currentColor" opacity="0.6" />
        <path
          d="M12 4.6v5.2M9.8 7.2 12 9.4l2.2-2.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark />
      <div className="leading-none">
        <span className="block text-[17px] font-semibold tracking-[-0.02em]">
          SmartRouter
        </span>
        {!compact && (
          <span className="mt-1 block text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Relief operations
          </span>
        )}
      </div>
    </div>
  );
}
