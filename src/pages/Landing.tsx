import { Wordmark } from "@/components/relay/brand";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  Compass,
  MessageSquare,
  Radio,
  Route as RouteIcon,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Link } from "react-router";

const AGENTS = [
  {
    step: "01",
    title: "Communication",
    icon: MessageSquare,
    body: "Turns a forwarded WhatsApp text into a typed report. Vague messages are marked low confidence instead of guessed at.",
    aside: "“can’t pass” → route_blocked",
  },
  {
    step: "02",
    title: "Knowledge",
    icon: Compass,
    body: "Plain lookups over the stored operation: which camps lean on that bridge, which truck is on it, who is assigned where.",
    aside: "Camp 2 + Camp 5 depend on it",
  },
  {
    step: "03",
    title: "Planning",
    icon: AlertTriangle,
    body: "Works out the consequences in order: camps cut off, cargo stuck, a medicine run that misses tonight’s window.",
    aside: "300 people · 1 truck at risk",
  },
  {
    step: "04",
    title: "Execution",
    icon: RouteIcon,
    body: "Drafts the fixes — a diverted convoy, an alert for camp volunteers, a priority flag on medical cargo. Drafts only.",
    aside: "via Riverside Track, +3 h",
  },
  {
    step: "05",
    title: "Verification",
    icon: ShieldCheck,
    body: "Checks the draft with ordinary code: is the detour itself open, is the convoy slot free, does the cargo cover the headcount?",
    aside: "4 of 4 checks passed",
  },
  {
    step: "06",
    title: "Approval",
    icon: ClipboardCheck,
    body: "The desk shows you the impact, the draft and the checks. Approve, edit or reject. Only then does the map change.",
    aside: "one human decision",
  },
];

const PIPELINE = [
  "Every message is classified before it is trusted.",
  "Lookups are plain database reads, never a model’s memory.",
  "Drafts sit in a queue until a person approves them.",
  "Conflicts stop the line and ask the organiser who to believe.",
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] hero-halo" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] grid-lines" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        {/* nav */}
        <header className="sticky top-4 z-30 mt-4">
          <div className="glass flex items-center justify-between gap-4 rounded-2xl px-4 py-3 sm:px-5">
            <Link to="/" aria-label="Relay home">
              <Wordmark />
            </Link>
            <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
              <a href="#pipeline" className="transition-colors hover:text-foreground">
                The agent chain
              </a>
              <a href="#disagreement" className="transition-colors hover:text-foreground">
                Disagreement
              </a>
              <a href="#desk" className="transition-colors hover:text-foreground">
                The desk
              </a>
            </nav>
            <Link
              to="/auth?returnTo=%2Fdashboard"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[0_12px_26px_-14px_rgba(17,74,92,0.75)] transition-transform hover:-translate-y-0.5"
            >
              Open the desk
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </header>

        {/* hero */}
        <section className="grid items-center gap-12 pt-14 pb-10 lg:grid-cols-[1.04fr_0.96fr] lg:pt-24 lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="glass-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-[oklch(0.42_0.06_212)] uppercase">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[oklch(0.62_0.11_176)] opacity-70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[oklch(0.58_0.11_176)]" />
              </span>
              Version 1 · approval queue
            </span>

            <h1 className="mt-6 font-display text-[clamp(2.5rem,5.4vw,4.15rem)] leading-[1.02] font-medium tracking-[-0.03em] text-[oklch(0.29_0.035_244)]">
              The coordinator that
              <br />
              never forgets,
              <br />
              <span className="italic text-primary">and never acts alone.</span>
            </h1>

            <p className="mt-6 max-w-xl text-[15.5px] leading-7 text-muted-foreground">
              Relay keeps your camps, trucks, roads and volunteers in one stored
              picture. A field message arrives, six agents turn it into a checked
              plan, and then the desk stops — until a person says yes.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/auth?returnTo=%2Fdashboard"
                className="group inline-flex items-center gap-2.5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_34px_-18px_rgba(17,74,92,0.85)] transition-all hover:-translate-y-0.5 hover:bg-[oklch(0.43_0.08_216)]"
              >
                Open the approval queue
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#pipeline"
                className="inline-flex items-center gap-2 rounded-xl border border-white/90 bg-white/55 px-5 py-3 text-sm font-semibold text-[oklch(0.36_0.04_238)] shadow-sm backdrop-blur transition-colors hover:bg-white/80"
              >
                <Sparkles className="size-4 text-primary" />
                See how a report travels
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="size-3.5 text-primary" /> Four stored tables
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" /> Verified before you see it
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5 text-primary" /> Nothing changes silently
              </span>
            </div>
          </motion.div>

          {/* product preview */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_60%_30%,rgba(180,225,242,0.55),transparent_70%)] blur-2xl" />
            <div className="glass edge-top rounded-[1.6rem] p-3 sm:p-4">
              <div className="flex items-center justify-between px-2 pt-1 pb-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  <span className="size-1.5 rounded-full bg-[oklch(0.7_0.12_80)]" />
                  Approval queue
                </div>
                <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-[oklch(0.42_0.06_218)] shadow-inner">
                  1 waiting
                </span>
              </div>

              <div className="glass-soft rounded-2xl p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
                  <span className="rounded-full bg-[oklch(0.955_0.03_24)] px-2.5 py-1 text-[oklch(0.45_0.13_24)]">
                    Road blocked
                  </span>
                  <span className="rounded-full bg-[oklch(0.945_0.045_172)] px-2.5 py-1 text-[oklch(0.38_0.07_173)]">
                    high confidence
                  </span>
                  <span className="ml-auto text-muted-foreground">Ravi · 10:42</span>
                </div>

                <p className="mt-3 border-l-2 border-primary/25 pl-3 font-display text-[17px] leading-6 text-[oklch(0.32_0.035_242)] italic">
                  “Bridge near Camp 2 is flooded, trucks can’t pass.”
                </p>

                <div className="mt-4 rounded-xl border border-white/80 bg-white/55 p-3">
                  <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    Impact
                  </p>
                  <ul className="mt-2 space-y-2 text-[12.5px] leading-5">
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
                        <strong className="font-semibold">T3 delayed behind the bridge</strong>
                        <span className="text-muted-foreground"> — food &amp; water</span>
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
                </div>

                <div className="mt-3 space-y-1.5 rounded-xl border border-white/80 bg-white/45 p-3 text-[12px]">
                  {[
                    "Riverside Track is open",
                    "2 of 2 convoy slots used",
                    "320 supply places for 300 people",
                  ].map((check) => (
                    <div key={check} className="flex items-center gap-2">
                      <span className="grid size-4 place-items-center rounded-full bg-[oklch(0.93_0.05_172)] text-[oklch(0.42_0.08_172)]">
                        <svg viewBox="0 0 12 12" className="size-2.5" fill="none">
                          <path
                            d="M2.5 6.2 5 8.5 9.5 3.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span className="text-[oklch(0.42_0.03_238)]">{check}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground">
                    <CheckIcon /> Approve plan
                  </span>
                  <span className="rounded-lg border border-white/90 bg-white/65 px-3 py-2 text-[12px] font-semibold text-[oklch(0.4_0.04_238)]">
                    Edit
                  </span>
                  <span className="rounded-lg px-2.5 py-2 text-[12px] font-medium text-muted-foreground">
                    Reject
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-soft absolute -bottom-5 -left-2 hidden items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[11.5px] sm:flex">
              <Radio className="size-3.5 text-primary" />
              <span className="font-medium">Pipeline logged</span>
              <span className="text-muted-foreground">6 agents · 1.2 s</span>
            </div>
          </motion.div>
        </section>

        {/* pipeline */}
        <section id="pipeline" className="scroll-mt-24 pt-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                One message, six agents
              </p>
              <h2 className="mt-3 max-w-xl font-display text-[clamp(1.9rem,3.4vw,2.75rem)] leading-[1.08] font-medium tracking-[-0.02em]">
                The chain runs in order. The desk stops it when a person is needed.
              </h2>
            </div>
            <p className="max-w-sm text-[13.5px] leading-6 text-muted-foreground">
              A coordinator agent decides which step runs next, hands over the data,
              and writes every action to the timeline with a timestamp.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AGENTS.map((agent, index) => (
              <motion.article
                key={agent.step}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="glass group rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <span className="grid size-9 place-items-center rounded-xl bg-white/70 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                    <agent.icon className="size-[17px]" strokeWidth={1.8} />
                  </span>
                  <span className="font-display text-[26px] leading-none text-[oklch(0.62_0.03_232)] italic opacity-70">
                    {agent.step}
                  </span>
                </div>
                <h3 className="mt-4 text-[15.5px] font-semibold tracking-[-0.01em]">
                  {agent.title} Agent
                </h3>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                  {agent.body}
                </p>
                <p className="mt-4 border-t border-white/70 pt-3 text-[11.5px] font-medium text-[oklch(0.46_0.06_214)]">
                  {agent.aside}
                </p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* disagreement */}
        <section id="disagreement" className="scroll-mt-24 pt-20">
          <div className="glass rounded-[1.6rem] p-6 sm:p-9">
            <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
              <div className="relative space-y-3">
                <div className="glass-soft rounded-2xl p-4">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-semibold text-[oklch(0.42_0.04_238)]">Ravi · field volunteer</span>
                    <span>10:42</span>
                  </div>
                  <p className="mt-2 font-display text-[16px] leading-6 italic">
                    “Bridge near Camp 2 is flooded, trucks can’t pass.”
                  </p>
                  <p className="mt-2 text-[11px] font-semibold tracking-wide text-[oklch(0.48_0.13_24)]">
                    Read as: closed
                  </p>
                </div>

                <div className="glass-soft rounded-2xl p-4">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-semibold text-[oklch(0.42_0.04_238)]">Suresh · truck driver</span>
                    <span>10:47</span>
                  </div>
                  <p className="mt-2 font-display text-[16px] leading-6 italic">
                    “Bridge is fine, I just crossed it.”
                  </p>
                  <p className="mt-2 text-[11px] font-semibold tracking-wide text-[oklch(0.42_0.08_172)]">
                    Read as: open
                  </p>
                </div>

                <div className="rounded-2xl border border-[oklch(0.88_0.06_78)] bg-[oklch(0.97_0.035_82)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] text-[oklch(0.47_0.09_70)] uppercase">
                    <AlertTriangle className="size-3.5" />
                    Pipeline paused
                  </p>
                  <p className="mt-2 text-[13px] leading-6 text-[oklch(0.42_0.05_64)]">
                    Two reports disagree. Who do you trust — or should someone go and
                    verify? No truck is moved while the question is open.
                  </p>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                  The uncertainty case
                </p>
                <h2 className="mt-3 font-display text-[clamp(1.75rem,3.1vw,2.5rem)] leading-[1.1] font-medium tracking-[-0.02em]">
                  It does not choose between two people. It asks you.
                </h2>
                <p className="mt-4 max-w-lg text-[14px] leading-7 text-muted-foreground">
                  The second report is marked as a conflict with the first. The
                  coordinator stops before planning, keeps both reports on the record,
                  and puts the decision on the same screen — trust Ravi, trust Suresh,
                  or send someone to look.
                </p>
                <ul className="mt-6 space-y-3">
                  {PIPELINE.map((line) => (
                    <li key={line} className="flex items-start gap-3 text-[13.5px] leading-6">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-white/75 text-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9)]">
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

        {/* the desk */}
        <section id="desk" className="scroll-mt-24 pt-20">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="glass rounded-2xl p-6 lg:col-span-2">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                Built for the desk
              </p>
              <h2 className="mt-3 max-w-xl font-display text-[clamp(1.7rem,3vw,2.35rem)] leading-[1.12] font-medium tracking-[-0.02em]">
                One screen the organiser lives in. Field volunteers keep sending
                messages.
              </h2>
              <p className="mt-4 max-w-2xl text-[13.5px] leading-7 text-muted-foreground">
                Version 1 tracks four things — camps, trucks, roads and volunteers —
                and is judged on one screen: the approval queue. No volunteer app, no
                route optimiser, no messaging platform. Paste the forward, read the
                impact, approve or reject.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Camps", "headcount, location, medical needs"],
                  ["Trucks & roads", "cargo, ETA, status, dependencies"],
                  ["Volunteers", "who is where, and how to reach them"],
                ].map(([title, detail]) => (
                  <div key={title} className="glass-inset rounded-xl px-3.5 py-3">
                    <p className="text-[12.5px] font-semibold">{title}</p>
                    <p className="mt-1 text-[11.5px] leading-5 text-muted-foreground">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass flex flex-col justify-between rounded-2xl p-6">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                  Sample operation
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    ["4", "camps"],
                    ["735", "people"],
                    ["3", "trucks"],
                    ["4", "roads"],
                  ].map(([value, label]) => (
                    <div key={label} className="glass-inset rounded-xl px-3.5 py-3">
                      <p className="font-display text-2xl leading-none">{value}</p>
                      <p className="mt-1 text-[11px] tracking-wide text-muted-foreground uppercase">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[11.5px] leading-5 text-muted-foreground">
                  A real working dataset is seeded on first sign-in — including a
                  bridge closure already waiting in the queue.
                </p>
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/80 bg-white/55 px-3 py-2.5 text-[11.5px] font-medium text-[oklch(0.4_0.04_238)]">
                <ShieldCheck className="size-4 text-primary" />
                High-consequence actions need a human
              </div>
            </div>
          </div>
        </section>

        {/* final CTA */}
        <section className="pt-16">
          <div className="glass edge-top relative overflow-hidden rounded-[1.6rem] px-6 py-10 text-center sm:px-10 sm:py-14">
            <div className="pointer-events-none absolute inset-x-0 -top-24 h-56 bg-[radial-gradient(ellipse_at_center,rgba(187,229,244,0.55),transparent_70%)]" />
            <p className="relative text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
              Ready for the next forward
            </p>
            <h2 className="relative mx-auto mt-3 max-w-2xl font-display text-[clamp(1.9rem,3.8vw,2.9rem)] leading-[1.08] font-medium tracking-[-0.02em]">
              Keep the operation in one place.
              <br />
              <span className="italic text-primary">Keep the decision with you.</span>
            </h2>
            <div className="relative mt-7 flex justify-center">
              <Link
                to="/auth?returnTo=%2Fdashboard"
                className="group inline-flex items-center gap-2.5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_18px_34px_-18px_rgba(17,74,92,0.85)] transition-all hover:-translate-y-0.5"
              >
                Enter the coordination desk
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <p className="relative mt-4 text-[11.5px] text-muted-foreground">
              Guest sign-in is available. The demo operation seeds itself.
            </p>
          </div>
        </section>

        <footer className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/70 pt-6 text-[11.5px] text-muted-foreground sm:flex-row sm:items-center">
          <Wordmark compact />
          <p>Version 1 — camps, trucks, routes, approval queue.</p>
          <p>Nothing changes without a person.</p>
        </footer>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden="true">
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
