import { ApprovalCard } from "@/components/relay/ApprovalCard";
import { ActivityTimeline } from "@/components/relay/ActivityTimeline";
import { OperationPanel } from "@/components/relay/OperationPanel";
import { Wordmark } from "@/components/relay/brand";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { timeAgo, type UpdateItem } from "@/lib/relay";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  CircleAlert,
  ClipboardCheck,
  Loader2,
  LogOut,
  MessageSquarePlus,
  Route as RouteIcon,
  ShieldCheck,
  TriangleAlert,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const SAMPLES = [
  "Bridge is fine, I just crossed it. - Suresh",
  "Hilltop Ghat Road is closed after a landslide. - Anand",
  "Camp 7 is short of water purification tablets. - Prakash",
  "The road is bad. - volunteer",
];

export default function Dashboard() {
  const overview = useQuery(api.dashboard.overview);
  const submitUpdate = useMutation(api.coordinator.submitUpdate);
  const approveUpdate = useMutation(api.coordinator.approveUpdate);
  const rejectUpdate = useMutation(api.coordinator.rejectUpdate);
  const resolveConflict = useMutation(api.coordinator.resolveConflict);
  const ensureSeeded = useMutation(api.seed.ensureSeeded);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [draft, setDraft] = useState("");
  const [reporter, setReporter] = useState("");
  const [running, setRunning] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    ensureSeeded().catch((error) => {
      console.error("Could not seed the sample operation", error);
    });
  }, [ensureSeeded]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (running || draft.trim().length < 4) return;
    setRunning(true);
    try {
      const result = await submitUpdate({
        rawText: draft,
        reportedBy: reporter.trim() || undefined,
      });
      if (result.status === "needs_clarification") {
        toast.warning("The coordinator stopped and needs your call.", {
          description: "Open the card in the queue to answer the question.",
        });
      } else {
        toast.success("Plan drafted and verified.", {
          description: "It is waiting in the approval queue. Nothing has changed yet.",
        });
      }
      setDraft("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The coordinator could not finish.",
      );
    } finally {
      setRunning(false);
    }
  };

  const handleApprove = async (updateId: UpdateItem["id"], keys: string[]) => {
    setBusyId(String(updateId));
    try {
      const result = await approveUpdate({
        updateId,
        includedKeys: keys,
      });
      toast.success(`${result.applied.length} change applied to the operation.`, {
        description: "Alerts are queued. The timeline has the record.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approval failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (updateId: UpdateItem["id"], note?: string) => {
    setBusyId(String(updateId));
    try {
      await rejectUpdate({ updateId, note });
      toast("Draft rejected.", {
        description: "Nothing was changed and nothing was sent.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reject the draft.");
    } finally {
      setBusyId(null);
    }
  };

  const handleResolve = async (
    updateId: UpdateItem["id"],
    resolution: "new" | "previous" | "verify",
  ) => {
    setBusyId(String(updateId));
    try {
      const result = await resolveConflict({ updateId, resolution });
      if (result.outcome === "retrusted_new") {
        toast.success("Report trusted. A fresh plan is in the queue.", {
          description: "The earlier report is kept on record as overtaken.",
        });
      } else if (result.outcome === "verification_requested") {
        toast("Verification requested.", {
          description: "The road is marked unknown. No truck was moved.",
        });
      } else {
        toast("Earlier report kept.", {
          description: "The newer message is filed without any change.",
        });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not resolve the conflict.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (overview === undefined) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6">
        <div className="glass h-16 animate-pulse rounded-2xl" />
        <div className="glass h-28 animate-pulse rounded-2xl" />
        <div className="glass h-72 animate-pulse rounded-2xl" />
      </main>
    );
  }

  if (overview === null) {
    return (
      <main className="grid min-h-screen place-items-center px-6">
        <div className="glass max-w-sm rounded-2xl p-6 text-center text-sm text-muted-foreground">
          Sign in to open the coordination desk.
        </div>
      </main>
    );
  }

  const waiting = overview.queue.length;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
      <header className="flex items-center justify-between gap-3 py-5">
        <Wordmark />
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-right text-[11px] leading-tight text-muted-foreground sm:block">
            <span className="block font-semibold text-foreground">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
            Organiser desk
          </span>
          <span className="glass-chip grid size-9 place-items-center rounded-full text-[12px] font-semibold text-primary">
            {(user?.name ?? user?.email ?? "O").slice(0, 1).toUpperCase()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <section className="flex flex-wrap items-end justify-between gap-4 pt-2 pb-5">
        <div>
          <p className="flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.18em] text-primary uppercase">
            <span className="size-1.5 rounded-full bg-[oklch(0.58_0.11_176)]" />
            Coordination desk
          </p>
          <h1 className="mt-2 font-display text-[clamp(1.9rem,3.6vw,2.6rem)] leading-none font-medium tracking-[-0.025em]">
            Approval queue
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-6 text-muted-foreground">
            Every field message is parsed, checked against the stored operation and
            drafted. Nothing changes until you approve it.
          </p>
        </div>
        <div className="glass-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-medium text-[oklch(0.4_0.04_238)]">
          <ShieldCheck className="size-3.5 text-primary" />
          {waiting === 0
            ? "Queue clear — nothing waiting"
            : `${waiting} decision${waiting === 1 ? "" : "s"} waiting`}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 pb-5 lg:grid-cols-4">
        <Stat
          label="Waiting for you"
          value={overview.stats.awaiting}
          hint="drafts in the queue"
          icon={ClipboardCheck}
        />
        <Stat
          label="People at risk"
          value={overview.stats.peopleAtRisk}
          hint="across open drafts"
          icon={TriangleAlert}
          tone={overview.stats.peopleAtRisk > 0 ? "warn" : "calm"}
        />
        <Stat
          label="Trucks en route"
          value={overview.stats.trucksEnRoute}
          hint={`${overview.stats.routesOpen} roads open`}
          icon={Truck}
        />
        <Stat
          label="Roads closed"
          value={overview.stats.routesClosed}
          hint={
            overview.stats.routesClosed > 0 ? "check the detours" : "all connections clear"
          }
          icon={RouteIcon}
          tone={overview.stats.routesClosed > 0 ? "warn" : "calm"}
        />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_370px]">
        <div className="space-y-5">
          {/* intake */}
          <section className="glass rounded-[1.35rem] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Step 1 · an update arrives
                </p>
                <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.01em]">
                  Paste the forward exactly as it came
                </h2>
              </div>
              <span className="glass-chip hidden rounded-full px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground sm:inline-flex">
                6 agents run on submit
              </span>
            </div>

            <form onSubmit={handleSubmit} className="mt-4">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="e.g. Bridge near Camp 2 is flooded, trucks can't pass. - Ravi"
                aria-label="Field update message"
                rows={3}
                maxLength={2000}
                className="w-full resize-none rounded-xl border border-white/90 bg-white/60 px-3.5 py-3 text-[13px] leading-6 text-[oklch(0.32_0.035_242)] shadow-[inset_0_1px_2px_rgba(28,62,88,0.06)] outline-none transition placeholder:text-muted-foreground/75 focus:border-[oklch(0.82_0.05_212)] focus:bg-white/80 focus:ring-2 focus:ring-[oklch(0.74_0.06_212)]/25"
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={reporter}
                  onChange={(event) => setReporter(event.target.value)}
                  placeholder="Reported by (optional)"
                  aria-label="Reported by"
                  maxLength={60}
                  className="h-9 w-44 rounded-lg border border-white/90 bg-white/55 px-3 text-[12px] shadow-inner outline-none transition placeholder:text-muted-foreground/75 focus:border-[oklch(0.82_0.05_212)] focus:bg-white/80"
                />
                <p className="hidden text-[11px] text-muted-foreground sm:block">
                  A signature at the end of the message works too.
                </p>
                <Button
                  type="submit"
                  size="sm"
                  className="ml-auto min-w-[168px]"
                  disabled={running || draft.trim().length < 4}
                >
                  {running ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Running the agents…
                    </>
                  ) : (
                    <>
                      <MessageSquarePlus className="size-3.5" />
                      Process update
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[10.5px] font-medium text-muted-foreground">
                  Try:
                </span>
                {SAMPLES.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setDraft(sample)}
                    className="glass-chip max-w-full truncate rounded-full px-2.5 py-1 text-[10.5px] font-medium text-[oklch(0.42_0.04_238)] transition-colors hover:bg-white/85"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </form>
          </section>

          {/* queue */}
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3 px-1">
              <div>
                <p className="text-[10.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Step 7 · human approval
                </p>
                <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.01em]">
                  Waiting for your decision
                </h2>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {waiting === 0 ? "all clear" : `${waiting} open`}
              </span>
            </div>

            {waiting === 0 ? (
              <div className="glass rounded-[1.35rem] px-5 py-10 text-center">
                <span className="mx-auto grid size-11 place-items-center rounded-full bg-[oklch(0.93_0.05_172)] text-[oklch(0.4_0.08_172)]">
                  <ShieldCheck className="size-5" />
                </span>
                <p className="mt-3 text-[14px] font-semibold">Queue clear</p>
                <p className="mx-auto mt-1 max-w-sm text-[12px] leading-6 text-muted-foreground">
                  The last plan was decided and the operation map is current. Paste
                  the next field update above — try the bridge message if you want to
                  see the disagreement handling.
                </p>
              </div>
            ) : (
              overview.queue.map((update) => (
                <ApprovalCard
                  key={update.id}
                  update={update}
                  busy={busyId === String(update.id)}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onResolveConflict={handleResolve}
                />
              ))
            )}
          </section>

          {/* decided */}
          {overview.decided.length > 0 && (
            <section className="glass rounded-[1.35rem] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[10.5px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Decided
                </h2>
                <span className="text-[11px] text-muted-foreground">
                  {overview.decided.length} on record
                </span>
              </div>
              <ul className="mt-3 divide-y divide-white/70">
                {overview.decided.map((update) => (
                  <li key={update.id} className="flex items-start gap-3 py-2.5">
                    <span
                      className={cn(
                        "mt-0.5 rounded-full px-2 py-0.5 text-[9.5px] font-semibold tracking-wide uppercase",
                        update.decision === "approved"
                          ? "bg-[oklch(0.93_0.05_172)] text-[oklch(0.38_0.075_173)]"
                          : "bg-white/70 text-muted-foreground",
                      )}
                    >
                      {update.decision ?? "filed"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-[oklch(0.35_0.03_240)]">
                        {update.structured.routeName ?? REPORT_LABEL(update.type)} ·{" "}
                        {update.reportedBy}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {update.decisionNote ?? update.rawText}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10.5px] text-muted-foreground">
                      {update.decidedAt ? timeAgo(update.decidedAt) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <OperationPanel overview={overview} />
          <ActivityTimeline entries={overview.activity} />
          <div className="glass-soft flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-[11px] leading-5 text-muted-foreground">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>
              Version 1 tracks camps, trucks, roads and volunteers. Field volunteers
              send messages; this desk is the only place a plan is approved.
            </span>
          </div>
        </aside>
      </div>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/70 pt-5 text-[11px] text-muted-foreground">
        <span>Relay · coordination desk</span>
        <a
          href="/"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          About this tool
          <ArrowRight className="size-3" />
        </a>
      </footer>
    </main>
  );
}

function REPORT_LABEL(type: string) {
  if (type === "route_blocked") return "Road blocked";
  if (type === "route_open") return "Road passable";
  if (type === "supply_shortage") return "Supply gap";
  return "Unclear report";
}

function Stat({
  label,
  value,
  hint,
  icon: Icon,
  tone = "calm",
}: {
  label: string;
  value: number;
  hint: string;
  icon: typeof Truck;
  tone?: "calm" | "warn";
}) {
  return (
    <div className="glass rounded-2xl px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold tracking-[0.13em] text-muted-foreground uppercase">
          {label}
        </p>
        <Icon
          className={cn(
            "size-3.5",
            tone === "warn" ? "text-[oklch(0.6_0.12_72)]" : "text-primary",
          )}
        />
      </div>
      <p className="mt-2 font-display text-[28px] leading-none tracking-[-0.02em]">
        {value}
      </p>
      <p className="mt-1 text-[10.5px] text-muted-foreground">{hint}</p>
    </div>
  );
}
