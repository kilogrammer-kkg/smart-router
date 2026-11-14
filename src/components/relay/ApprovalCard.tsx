import { Button } from "@/components/ui/button";
import {
  CONFIDENCE_STYLE,
  REPORT_TYPE_LABEL,
  SEVERITY_STYLE,
  timeAgo,
  type Proposal,
  type UpdateItem,
} from "@/lib/relay";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  MapPin,
  MessageSquare,
  Pencil,
  Route as RouteIcon,
  Send,
  ShieldCheck,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

type Props = {
  update: UpdateItem;
  busy: boolean;
  onApprove: (updateId: UpdateItem["id"], includedKeys: string[]) => void;
  onReject: (updateId: UpdateItem["id"], note?: string) => void;
  onResolveConflict: (
    updateId: UpdateItem["id"],
    resolution: "new" | "previous" | "verify",
  ) => void;
};

const TYPE_STYLE: Record<string, string> = {
  route_blocked: "bg-[oklch(0.955_0.03_24)] text-[oklch(0.45_0.12_24)]",
  route_open: "bg-[oklch(0.93_0.05_172)] text-[oklch(0.38_0.075_173)]",
  supply_shortage: "bg-[oklch(0.955_0.04_82)] text-[oklch(0.46_0.09_72)]",
  unclear: "bg-white/70 text-muted-foreground",
};

const PROPOSAL_ICON: Record<Proposal["kind"], typeof RouteIcon> = {
  route_status: RouteIcon,
  truck_reroute: Truck,
  truck_hold: Truck,
  volunteer_alert: MessageSquare,
  priority_flag: CircleAlert,
};

export function ApprovalCard({
  update,
  busy,
  onApprove,
  onReject,
  onResolveConflict,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [selected, setSelected] = useState<string[]>(
    update.proposals.filter((proposal) => proposal.included).map((proposal) => proposal.key),
  );

  const failed = update.checks.filter((check) => !check.passed);
  const isConflict = Boolean(update.conflict);
  const needsApproval = update.status === "awaiting_approval";
  const severity = SEVERITY_STYLE;

  const toggle = (key: string) =>
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );

  return (
    <article className="glass edge-top overflow-hidden rounded-[1.35rem]">
      {/* header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/70 px-4 py-3 sm:px-5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            TYPE_STYLE[update.type] ?? TYPE_STYLE.unclear,
          )}
        >
          <CircleAlert className="size-3" />
          {REPORT_TYPE_LABEL[update.type] ?? update.type}
        </span>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
            CONFIDENCE_STYLE[update.confidence],
          )}
        >
          {update.confidence} confidence
        </span>
        {update.status === "awaiting_approval" && (
          <span className="rounded-full border border-white/90 bg-white/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
            draft · not applied
          </span>
        )}
        <span className="ml-auto text-[11.5px] text-muted-foreground">
          {update.reportedBy} · {timeAgo(update.createdAt)}
        </span>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
        {/* raw message */}
        <blockquote className="rounded-xl border border-white/80 bg-white/55 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <p className="font-display text-[16px] leading-6 text-[oklch(0.33_0.035_242)] italic">
            “{update.rawText}”
          </p>
        </blockquote>

        {/* what was read */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="glass-chip inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium">
            <MapPin className="size-3 text-primary" />
            {update.structured.routeName ?? update.structured.location ?? "Location unresolved"}
          </span>
          {update.connected.campNames.map((camp) => (
            <span key={camp} className="glass-chip rounded-full px-2 py-1 font-medium">
              {camp}
            </span>
          ))}
          {update.connected.peopleAffected > 0 && (
            <span className="glass-chip inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium">
              <Users className="size-3 text-primary" />
              {update.connected.peopleAffected} people
            </span>
          )}
          {update.connected.truckCodes.map((code) => (
            <span key={code} className="glass-chip rounded-full px-2 py-1 font-medium">
              Truck {code}
            </span>
          ))}
          {update.connected.volunteerNames.map((name) => (
            <span key={name} className="glass-chip rounded-full px-2 py-1 font-medium">
              {name}
            </span>
          ))}
          {update.structured.reasoning.length > 0 && (
            <button
              type="button"
              onClick={() => setShowReasoning((value) => !value)}
              className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How it read this
              <ChevronDown
                className={cn("size-3 transition-transform", showReasoning && "rotate-180")}
              />
            </button>
          )}
        </div>

        {showReasoning && (
          <ul className="space-y-1.5 rounded-xl border border-white/70 bg-white/40 px-3.5 py-3 text-[11.5px] leading-5 text-muted-foreground">
            {update.structured.reasoning.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/40" />
                {line}
              </li>
            ))}
          </ul>
        )}

        {/* impacts */}
        {update.impacts.length > 0 && (
          <section>
            <h3 className="flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Impact analysis
              <span className="h-px flex-1 bg-white/80" />
            </h3>
            <ul className="mt-2.5 space-y-2">
              {update.impacts.map((impact) => {
                const tone = severity[impact.severity] ?? severity.info;
                return (
                  <li
                    key={`${impact.title}-${impact.severity}`}
                    className={cn(
                      "rounded-xl border px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
                      tone.surface,
                    )}
                  >
                    <p className={cn("flex items-center gap-2 text-[12.5px] font-semibold", tone.text)}>
                      <span className={cn("size-1.5 rounded-full", tone.dot)} />
                      {impact.title}
                    </p>
                    <p className="mt-1 pl-3.5 text-[12px] leading-5 text-[oklch(0.42_0.03_240)]">
                      {impact.detail}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* proposals */}
        {update.proposals.length > 0 && (
          <section>
            <div className="flex items-center gap-2">
              <h3 className="text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Proposed changes
              </h3>
              <span className="h-px flex-1 bg-white/80" />
              {needsApproval && (
                <button
                  type="button"
                  onClick={() => setEditing((value) => !value)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  <Pencil className="size-3" />
                  {editing ? "Done editing" : "Edit selection"}
                </button>
              )}
            </div>

            <ul className="mt-2.5 space-y-2">
              {update.proposals.map((proposal) => {
                const Icon = PROPOSAL_ICON[proposal.kind];
                const isSelected = selected.includes(proposal.key);
                return (
                  <li
                    key={proposal.key}
                    className={cn(
                      "flex gap-3 rounded-xl border border-white/80 bg-white/55 px-3.5 py-3 transition-opacity",
                      editing && !isSelected && "opacity-55",
                    )}
                  >
                    {editing ? (
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={isSelected}
                        aria-label={`Include ${proposal.title}`}
                        onClick={() => toggle(proposal.key)}
                        className={cn(
                          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-[oklch(0.85_0.02_230)] bg-white",
                        )}
                      >
                        {isSelected && <Check className="size-3.5" strokeWidth={3} />}
                      </button>
                    ) : (
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-[oklch(0.94_0.03_216)] text-primary">
                        <Icon className="size-3" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-[oklch(0.32_0.035_242)]">
                        {proposal.title}
                      </p>
                      <p className="mt-0.5 text-[11.5px] leading-5 text-muted-foreground">
                        {proposal.detail}
                      </p>
                      {proposal.alertBody && (
                        <p className="mt-1.5 rounded-lg border border-white/80 bg-white/60 px-2.5 py-2 text-[11px] leading-5 text-[oklch(0.4_0.03_240)]">
                          “{proposal.alertBody}”
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {update.revisionNote && (
              <p className="mt-2.5 flex gap-2 rounded-xl border border-[oklch(0.9_0.045_80)] bg-[oklch(0.975_0.03_82)] px-3 py-2 text-[11.5px] leading-5 text-[oklch(0.46_0.08_72)]">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                {update.revisionNote}
              </p>
            )}
          </section>
        )}

        {/* verification */}
        {update.checks.length > 0 && (
          <section className="rounded-xl border border-white/80 bg-white/45 px-3.5 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Verification · code, not a model
              </h3>
              <span
                className={cn(
                  "ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                  failed.length === 0
                    ? "bg-[oklch(0.93_0.05_172)] text-[oklch(0.38_0.075_173)]"
                    : "bg-[oklch(0.95_0.04_24)] text-[oklch(0.45_0.13_24)]",
                )}
              >
                {update.checks.length - failed.length}/{update.checks.length} passed
              </span>
            </div>
            <ul className="mt-2 grid gap-1.5">
              {update.checks.map((check) => (
                <li key={check.label} className="flex items-start gap-2 text-[11.5px] leading-5">
                  <span
                    className={cn(
                      "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full",
                      check.passed
                        ? "bg-[oklch(0.93_0.05_172)] text-[oklch(0.42_0.08_172)]"
                        : "bg-[oklch(0.94_0.05_24)] text-[oklch(0.5_0.16_24)]",
                    )}
                  >
                    {check.passed ? (
                      <Check className="size-2.5" strokeWidth={3} />
                    ) : (
                      <X className="size-2.5" strokeWidth={3} />
                    )}
                  </span>
                  <span>
                    <span className="font-medium text-[oklch(0.36_0.03_240)]">{check.label}</span>
                    <span className="text-muted-foreground"> — {check.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* a human question */}
        {update.question && (
          <section
            className={cn(
              "rounded-xl border px-4 py-3.5",
              isConflict
                ? "border-[oklch(0.88_0.06_78)] bg-[oklch(0.972_0.033_82)]"
                : "border-[oklch(0.89_0.035_212)] bg-[oklch(0.972_0.02_212)]",
            )}
          >
            <p className="flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.14em] uppercase text-[oklch(0.46_0.07_70)]">
              <MessageSquare className="size-3.5" />
              The coordinator stopped and asked
            </p>
            <p className="mt-1.5 text-[13px] leading-6 text-[oklch(0.39_0.04_60)]">
              {update.question}
            </p>

            {isConflict && update.conflict && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/90 bg-white/80 text-[11.5px]"
                  disabled={busy}
                  onClick={() => onResolveConflict(update.id, "previous")}
                >
                  Trust {update.conflict.otherReporter} ({update.conflict.otherClaim})
                </Button>
                <Button
                  size="sm"
                  className="text-[11.5px]"
                  disabled={busy}
                  onClick={() => onResolveConflict(update.id, "new")}
                >
                  Trust {update.reportedBy} · replan
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[11.5px] text-[oklch(0.45_0.06_70)]"
                  disabled={busy}
                  onClick={() => onResolveConflict(update.id, "verify")}
                >
                  <Send className="size-3.5" />
                  Send someone to verify
                </Button>
              </div>
            )}

            {!isConflict && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 border-white/90 bg-white/80 text-[11.5px]"
                disabled={busy}
                onClick={() =>
                  onReject(update.id, "Sent back to the reporter for more detail.")
                }
              >
                File it and ask the reporter
              </Button>
            )}
          </section>
        )}
      </div>

      {/* approval bar */}
      {needsApproval && (
        <div className="flex flex-wrap items-center gap-2 border-t border-white/70 bg-white/35 px-4 py-3 sm:px-5">
          <p className="mr-auto text-[11px] text-muted-foreground">
            {selected.length} of {update.proposals.length} changes selected · applied only
            after approval
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            disabled={busy}
            onClick={() => onReject(update.id)}
          >
            <X className="size-3.5" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/90 bg-white/70"
            disabled={busy}
            onClick={() => setEditing((value) => !value)}
          >
            <Pencil className="size-3.5" />
            {editing ? "Done" : "Edit"}
          </Button>
          <Button
            size="sm"
            disabled={busy || selected.length === 0}
            onClick={() => onApprove(update.id, selected)}
          >
            <ClipboardCheck className="size-3.5" />
            {busy ? "Applying…" : "Approve plan"}
          </Button>
        </div>
      )}
    </article>
  );
}
