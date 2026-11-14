import { clockTime, type ActivityEntry } from "@/lib/relay";
import { cn } from "@/lib/utils";

const AGENT_STYLE: Record<string, { dot: string; chip: string }> = {
  Coordinator: {
    dot: "bg-[oklch(0.5_0.08_218)]",
    chip: "bg-[oklch(0.94_0.03_216)] text-[oklch(0.4_0.06_216)]",
  },
  "Communication Agent": {
    dot: "bg-[oklch(0.58_0.08_248)]",
    chip: "bg-[oklch(0.945_0.03_250)] text-[oklch(0.43_0.07_250)]",
  },
  "Knowledge Agent": {
    dot: "bg-[oklch(0.58_0.09_186)]",
    chip: "bg-[oklch(0.94_0.04_186)] text-[oklch(0.4_0.07_186)]",
  },
  "Planning Agent": {
    dot: "bg-[oklch(0.68_0.12_78)]",
    chip: "bg-[oklch(0.955_0.04_82)] text-[oklch(0.46_0.09_72)]",
  },
  "Execution Agent": {
    dot: "bg-[oklch(0.58_0.07_300)]",
    chip: "bg-[oklch(0.95_0.025_300)] text-[oklch(0.44_0.06_300)]",
  },
  "Verification Agent": {
    dot: "bg-[oklch(0.58_0.1_165)]",
    chip: "bg-[oklch(0.93_0.05_165)] text-[oklch(0.38_0.08_168)]",
  },
};

const TONE_RING: Record<string, string> = {
  info: "ring-white",
  success: "ring-[oklch(0.88_0.07_165)]",
  warning: "ring-[oklch(0.9_0.07_75)]",
  critical: "ring-[oklch(0.89_0.07_25)]",
};

export function ActivityTimeline({
  entries,
  className,
}: {
  entries: ActivityEntry[];
  className?: string;
}) {
  return (
    <section className={cn("glass flex flex-col rounded-[1.35rem] p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Activity timeline
          </p>
          <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.01em]">
            Every agent action, written down
          </h2>
        </div>
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[oklch(0.62_0.11_176)] opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-[oklch(0.58_0.11_176)]" />
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 text-[12px] leading-6 text-muted-foreground">
          The timeline fills as soon as an update is processed.
        </p>
      ) : (
        <ol className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {entries.map((entry) => {
            const style = AGENT_STYLE[entry.agent] ?? AGENT_STYLE.Coordinator;
            return (
              <li key={entry._id} className="relative pl-5">
                <span
                  className={cn(
                    "absolute top-1 left-0 size-2 rounded-full ring-2",
                    style.dot,
                    TONE_RING[entry.tone] ?? TONE_RING.info,
                  )}
                />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold tracking-[0.02em]",
                      style.chip,
                    )}
                  >
                    {entry.agent}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {clockTime(entry.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] leading-5 text-[oklch(0.4_0.03_240)]">
                  {entry.message}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
