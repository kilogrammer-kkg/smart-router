import { KindBadge, StatusPill } from "@/components/relay/catalog-bits";
import { Wordmark } from "@/components/relay/brand";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  Compass,
  MessageSquare,
  Radio,
  Route as RouteIcon,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "react-router";

const AGENTS = [
  {
    step: "01",
    title: "Communication",
    icon: MessageSquare,
    body: "Reads a forwarded message and returns a typed report. Vague wording is marked low confidence, not guessed.",
    aside: "“can’t pass” → road blocked",
  },
  {
    step: "02",
    title: "Knowledge",
    icon: Compass,
    body: "Looks up the stored operation: camps on the road, trucks in transit, volunteers assigned nearby.",
    aside: "Camp 2 + Camp 5 depend on it",
  },
  {
    step: "03",
    title: "Planning",
    icon: AlertTriangle,
    body: "Turns the lookup into consequences: who is cut off, what cargo is stuck, which medical run is at risk.",
    aside: "300 people · 1 truck",
  },
  {
    step: "04",
    title: "Execution",
    icon: RouteIcon,
    body: "Drafts the response: a diverted truck, a note for camp volunteers, a priority flag on medical cargo.",
    aside: "via Riverside Track, +3 h",
  },
  {
    step: "05",
    title: "Verification",
    icon: ShieldCheck,
    body: "Checks the draft with plain code: is the detour open, is the convoy slot free, does the cargo cover the headcount?",
    aside: "4 of 4 checks passed",
  },
  {
    step: "06",
    title: "Approval",
    icon: ClipboardCheck,
    body: "The queue shows the impact, the draft and the checks. Approve, edit or reject. Nothing moves before that.",
    aside: "one human decision",
  },
];

const SAFEGUARDS = [
  "A person approves every change to the operation.",
  "Lookups come from the catalog, not a model’s memory.",
  "Conflicting reports stop the line and ask the team.",
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[680px] hero-halo" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
        <header className="sticky top-4 z-30 mt-4">
          <div className="glass flex items-center justify-between gap-4 rounded-2xl px-4 py-3 sm:px-5">
            <Link to="/" aria-label="SmartRouter home">
              <Wordmark />
            </Link>
            <nav className="hidden items-center gap-6 text-[12.5px] text-muted-foreground md:flex">
              <a href="#pipeline" className="transition-colors hover:text-foreground">
                How it works
              </a>
              <a href="#catalog" className="transition-colors hover:text-foreground">
                Catalog
              </a>
              <a href="#disagreement" className="transition-colors hover:text-foreground">
                Disagreement
              </a>
            </nav>
            <Link
              to="/auth?returnTo=%2Fdashboard"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[12.5px] font-semibold text-primary-foreground shadow-[0_12px_26px_-14px_rgba(17,74,92,0.75)] transition-transform hover:-translate-y-0.5"
            >
              Open the desk
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </header>

        {/* hero */}
        <section className="grid items-center gap-12 pt-14 pb-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20 lg:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="glass-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10.5px] font-semibold tracking-[0.13em] text-[oklch(0.42_0.06_212)] uppercase">
              <span className="size-1.5 rounded-full bg-[oklch(0.58_0.11_176)]" />
              Internal · relief operations
            </span>

            <h1 className="mt-6 font-display text-[clamp(2.4rem,5vw,3.9rem)] leading-[1.03] font-medium tracking-[-0.03em]">
              Field reports in.
              <br />
              Verified plans out.
              <br />
              <span className="italic text-primary">Your team decides.</span>
            </h1>

            <p className="mt-6 max-w-lg text-[14.5px] leading-7 text-muted-foreground">
              SmartRouter is our internal approval simulator for relief camps in
              disaster-hit areas. It reads a forwarded message, checks the camps,
              trucks and roads around it, drafts the response, and waits for a
              person to approve it.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <Link
                to="/auth?returnTo=%2Fdashboard"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground shadow-[0_18px_34px_-18px_rgba(17,74,92,0.85)] transition-all hover:-translate-y-0.5"
              >
                Open the approval queue
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/auth?returnTo=%2Fcatalog"
                className="inline-flex items-center gap-2 rounded-xl border border-white/90 bg-white/55 px-4 py-2.5 text-[13px] font-semibold text-[oklch(0.36_0.04_238)] backdrop-blur transition-colors hover:bg-white/80"
              >
                Browse the catalog
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" /> Six agents, one approval
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5 text-primary" /> Built for the response team
              </span>
            </div>
          </motion.div>

          {/* approval preview */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_60%_30%,rgba(180,225,242,0.5),transparent_70%)] blur-2xl" />
            <div className="glass edge-top rounded-[1.5rem] p-3 sm:p-4">
              <div className="flex items-center justify-between px-2 pt-1 pb-3">
                <span className="text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  Approval queue
                </span>
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10.5px] font-semibold text-[oklch(0.42_0.06_218)]">
                  1 waiting
                </span>
              </div>

              <div className="glass-soft rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-medium">
                  <span className="rounded-full bg-[oklch(0.955_0.03_24)] px-2.5 py-1 text-[oklch(0.45_0.13_24)]">
                    Road blocked
                  </span>
                  <span className="rounded-full bg-[oklch(0.945_0.045_172)] px-2.5 py-1 text-[oklch(0.38_0.07_173)]">
                    high confidence
                  </span>
                  <span className="ml-auto text-muted-foreground">Ravi · 10:42</span>
                </div>

                <p className="mt-3 border-l-2 border-primary/25 pl-3 font-display text-[16px] leading-6 text-[oklch(0.32_0.035_242)] italic">
                  “Bridge near Camp 2 is flooded, trucks can’t pass.”
                </p>

                <ul className="mt-3 space-y-1.5 rounded-xl border border-white/80 bg-white/55 p-3 text-[11.5px] leading-5">
                  <li className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[oklch(0.6_0.17_24)]" />
                    <span>
                      <strong className="font-semibold">Camp 2 + Camp 5 cut off</strong>
                      <span className="text-muted-foreground"> — 300 people</span>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[oklch(0.72_0.13_72)]" />
                    <span>
                      <strong className="font-semibold">Truck T3 stuck behind the bridge</strong>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[oklch(0.72_0.13_72)]" />
                    <span>
                      <strong className="font-semibold">Camp 2 medicine run</strong>
                      <span className="text-muted-foreground"> misses tonight</span>
                    </span>
                  </li>
                </ul>

                <div className="mt-2.5 space-y-1.5 rounded-xl border border-white/80 bg-white/45 p-3 text-[11px]">
                  {[
                    "Riverside Track is open",
                    "2 of 2 convoy slots used",
                    "320 supply places for 300 people",
                  ].map((check) => (
                    <div key={check} className="flex items-center gap-2">
                      <span className="grid size-4 place-items-center rounded-full bg-[oklch(0.93_0.05_172)] text-[oklch(0.42_0.08_172)]">
                        <CheckIcon />
                      </span>
                      <span className="text-[oklch(0.42_0.03_238)]">{check}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary px-3 py-2 text-[11.5px] font-semibold text-primary-foreground">
                    Approve plan
                  </span>
                  <span className="rounded-lg border border-white/90 bg-white/65 px-3 py-2 text-[11.5px] font-semibold text-[oklch(0.4_0.04_238)]">
                    Edit
                  </span>
                  <span className="px-2 py-2 text-[11.5px] text-muted-foreground">
                    Reject
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-soft absolute -bottom-5 -left-2 hidden items-center gap-2 rounded-xl px-3 py-2 text-[10.5px] sm:flex">
              <Radio className="size-3.5 text-primary" />
              <span className="font-medium">Timeline logged</span>
              <span className="text-muted-foreground">6 agents</span>
            </div>
          </motion.div>
        </section>

        {/* pipeline */}
        <section id="pipeline" className="scroll-mt-24 pt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10.5px] font-semibold tracking-[0.18em] text-primary uppercase">
                How a report is routed
              </p>
              <h2 className="mt-2 max-w-xl font-display text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.1] font-medium tracking-[-0.02em]">
                Six agents in order. A person at the end.
              </h2>
            </div>
            <p className="max-w-sm text-[12.5px] leading-6 text-muted-foreground">
              A coordinator decides which step runs next, passes the data along and
              writes every action to the timeline.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AGENTS.map((agent, index) => (
              <motion.article
                key={agent.step}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="glass rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-8 place-items-center rounded-lg bg-white/70 text-primary">
                    <agent.icon className="size-4" strokeWidth={1.8} />
                  </span>
                  <span className="font-display text-[20px] leading-none text-[oklch(0.62_0.03_232)] italic opacity-70">
                    {agent.step}
                  </span>
                </div>
                <h3 className="mt-3.5 text-[14px] font-semibold tracking-[-0.01em]">
                  {agent.title} Agent
                </h3>
                <p className="mt-1.5 text-[12px] leading-5 text-muted-foreground">
                  {agent.body}
                </p>
                <p className="mt-3 border-t border-white/70 pt-2.5 text-[10.5px] font-medium text-[oklch(0.46_0.06_214)]">
                  {agent.aside}
                </p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* catalog */}
        <section id="catalog" className="scroll-mt-24 pt-16">
          <div className="glass rounded-[1.5rem] p-5 sm:p-7">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <p className="text-[10.5px] font-semibold tracking-[0.18em] text-primary uppercase">
                  Catalog
                </p>
                <h2 className="mt-2 max-w-md font-display text-[clamp(1.7rem,3vw,2.35rem)] leading-[1.12] font-medium tracking-[-0.02em]">
                  Every record the coordinator reasons about.
                </h2>
                <p className="mt-3 max-w-md text-[13px] leading-6 text-muted-foreground">
                  Search camps, trucks, roads and volunteers. Open a record to see
                  what depends on it, follow the connections, and leave a note for
                  the rest of the team.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    to="/auth?returnTo=%2Fcatalog"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-[12px] font-semibold text-primary-foreground"
                  >
                    Browse the catalog
                    <ArrowRight className="size-3.5" />
                  </Link>
                  <Link
                    to="/auth?returnTo=%2Fdashboard"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/90 bg-white/60 px-4 py-2.5 text-[12px] font-semibold hover:bg-white/85"
                  >
                    Open the queue
                  </Link>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { kind: "route" as const, title: "Camp 2 Access Bridge", note: "Detour on file: Riverside Track", status: "closed" },
                  { kind: "camp" as const, title: "Camp 2", note: "180 people · Bela village ground", status: undefined },
                  { kind: "truck" as const, title: "Truck T3", note: "Food & water · Imran Qureshi", status: "en_route" },
                  { kind: "volunteer" as const, title: "Meena Raghavan", note: "Camp 2 · field contact", status: undefined },
                ].map((row) => (
                  <div
                    key={row.title}
                    className="glass-soft flex items-center gap-3 rounded-xl px-3.5 py-2.5"
                  >
                    <KindBadge kind={row.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold">{row.title}</p>
                      <p className="truncate text-[10.5px] text-muted-foreground">
                        {row.note}
                      </p>
                    </div>
                    <StatusPill status={row.status} />
                  </div>
                ))}
                <p className="px-1 pt-1 text-[10.5px] text-muted-foreground">
                  Sample records from the seeded operation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* disagreement */}
        <section id="disagreement" className="scroll-mt-24 pt-16">
          <div className="glass rounded-[1.5rem] p-5 sm:p-8">
            <div className="grid gap-9 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="space-y-2.5">
                <div className="glass-soft rounded-xl p-3.5">
                  <p className="text-[10.5px] font-semibold text-[oklch(0.42_0.04_238)]">
                    Ravi · field volunteer · 10:42
                  </p>
                  <p className="mt-1 font-display text-[14.5px] leading-6 italic">
                    “Bridge near Camp 2 is flooded, trucks can’t pass.”
                  </p>
                </div>
                <div className="glass-soft rounded-xl p-3.5">
                  <p className="text-[10.5px] font-semibold text-[oklch(0.42_0.04_238)]">
                    Suresh · truck driver · 10:47
                  </p>
                  <p className="mt-1 font-display text-[14.5px] leading-6 italic">
                    “Bridge is fine, I just crossed it.”
                  </p>
                </div>
                <div className="rounded-xl border border-[oklch(0.88_0.06_78)] bg-[oklch(0.972_0.033_82)] p-3.5">
                  <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-[oklch(0.47_0.09_70)] uppercase">
                    <AlertTriangle className="size-3" />
                    Pipeline paused
                  </p>
                  <p className="mt-1.5 text-[11.5px] leading-5 text-[oklch(0.42_0.05_64)]">
                    Two reports disagree. Who does the team trust — or should someone
                    go and verify? No truck moves while the question is open.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10.5px] font-semibold tracking-[0.18em] text-primary uppercase">
                  Uncertainty handling
                </p>
                <h2 className="mt-2 font-display text-[clamp(1.65rem,3vw,2.3rem)] leading-[1.12] font-medium tracking-[-0.02em]">
                  It does not choose between two people. It asks us.
                </h2>
                <p className="mt-3 max-w-lg text-[13px] leading-6 text-muted-foreground">
                  The second report is flagged against the first. The coordinator
                  stops before planning, keeps both messages on record, and puts the
                  decision on the same screen: trust one reporter, trust the other,
                  or send someone to look.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {SAFEGUARDS.map((line) => (
                    <li key={line} className="flex items-start gap-2.5 text-[12.5px] leading-5">
                      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-white/75 text-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9)]">
                        <CheckIcon />
                      </span>
                      <span className="text-[oklch(0.38_0.035_240)]">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-14">
          <div className="glass edge-top relative overflow-hidden rounded-[1.5rem] px-6 py-10 text-center sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute inset-x-0 -top-24 h-56 bg-[radial-gradient(ellipse_at_center,rgba(187,229,244,0.5),transparent_70%)]" />
            <h2 className="relative mx-auto max-w-xl font-display text-[clamp(1.8rem,3.5vw,2.7rem)] leading-[1.1] font-medium tracking-[-0.02em]">
              Keep the operation in one place.
              <br />
              <span className="italic text-primary">Keep the decision with the team.</span>
            </h2>
            <div className="relative mt-6 flex justify-center">
              <Link
                to="/auth?returnTo=%2Fdashboard"
                className="group inline-flex items-center gap-2.5 rounded-xl bg-primary px-5 py-3 text-[13px] font-semibold text-primary-foreground shadow-[0_18px_34px_-18px_rgba(17,74,92,0.85)] transition-all hover:-translate-y-0.5"
              >
                Enter the approval queue
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <p className="relative mt-3 text-[11px] text-muted-foreground">
              Internal sign-in. The sample operation seeds itself.
            </p>
          </div>
        </section>

        <footer className="mt-9 flex flex-col items-start justify-between gap-3 border-t border-white/70 pt-5 text-[11px] text-muted-foreground sm:flex-row sm:items-center">
          <Wordmark compact />
          <p>SmartRouter · relief approval simulator · version 1</p>
          <p>Nothing changes without a person.</p>
        </footer>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-2.5" fill="none" aria-hidden="true">
      <path
        d="M2.3 6.1 4.9 8.6 9.7 3.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
