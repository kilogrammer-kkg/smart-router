import type { Doc } from "../_generated/dataModel";
import {
  connect,
  execute,
  plan,
  readReport,
  revise,
  verify,
  type Camp,
  type Check,
  type Extraction,
  type Impact,
  type Knowledge,
  type ProposalDraft,
  type Route,
  type Truck,
  type Volunteer,
} from "./agents";

export type ActivityDraft = {
  agent: string;
  message: string;
  tone: "info" | "success" | "warning" | "critical";
};

export type Conflict = {
  withUpdateId: Doc<"updates">["_id"];
  question: string;
  otherReporter: string;
  otherClaim: string;
  otherRawText: string;
};

export type PipelineResult = {
  extraction: Extraction;
  connected: Knowledge;
  impacts: Impact[];
  proposals: ProposalDraft[];
  checks: Check[];
  revisionNote?: string;
  status: "awaiting_approval" | "needs_clarification";
  question?: string;
  conflict?: Conflict;
  activity: ActivityDraft[];
};

export type PipelineInput = {
  rawText: string;
  suppliedReporter?: string;
  routes: Route[];
  camps: Camp[];
  trucks: Truck[];
  volunteers: Volunteer[];
  pendingUpdates: Doc<"updates">[];
};

/**
 * The Coordinator Agent: decides which agent runs next, passes data along and
 * writes the timeline. It stops the line whenever a human should decide.
 */
export function runCoordinator(input: PipelineInput): PipelineResult {
  const { rawText, suppliedReporter, routes, camps, trucks, volunteers } = input;
  const activity: ActivityDraft[] = [];

  activity.push({
    agent: "Coordinator",
    message: `Update received (${rawText.trim().length} chars). Starting the pipeline.`,
    tone: "info",
  });

  // Step 2 — understand the message
  const extraction = readReport(rawText, routes, camps, suppliedReporter);
  activity.push({
    agent: "Communication Agent",
    message: extraction.routeName
      ? `Read as ${extraction.type.replace("_", " ")} on ${extraction.routeName} · confidence ${extraction.confidence}.`
      : `Read as ${extraction.type.replace("_", " ")} · confidence ${extraction.confidence}.`,
    tone:
      extraction.confidence === "low"
        ? "warning"
        : extraction.type === "unclear"
          ? "warning"
          : "info",
  });

  const emptyKnowledge: Knowledge = {
    camps: [],
    trucks: [],
    volunteers: [],
    peopleAffected: 0,
  };

  if (extraction.type === "unclear" || extraction.confidence === "low") {
    const question =
      "This message does not name a road or camp clearly enough to plan against. Which road or camp is it about, and is it open or blocked? Nothing has been changed.";
    activity.push({
      agent: "Coordinator",
      message:
        "Confidence too low to plan. Pipeline paused and the organiser was asked for specifics.",
      tone: "warning",
    });
    return {
      extraction,
      connected: emptyKnowledge,
      impacts: [],
      proposals: [],
      checks: [],
      status: "needs_clarification",
      question,
      activity,
    };
  }

  // Step 3 — look up what is connected
  const connected = connect(extraction, routes, camps, trucks, volunteers);
  const campLabel =
    connected.camps.length > 0
      ? `${connected.camps.map((camp) => camp.name).join(" + ")} (${connected.peopleAffected} people)`
      : "no camps";
  activity.push({
    agent: "Knowledge Agent",
    message: connected.route
      ? `${campLabel} depend on ${connected.route.name}; ${connected.trucks.length} truck(s) on it; ${connected.volunteers.length} volunteer(s) assigned.`
      : `${campLabel} matched in the operation map; ${connected.trucks.length} truck(s) nearby.`,
    tone: "info",
  });

  // The uncertainty case: two first-hand reports that disagree.
  const opposite =
    extraction.statusClaim === "closed" ? "open" : "closed";
  const conflictWith = extraction.routeId
    ? input.pendingUpdates.find(
        (update) =>
          update.structured.routeId === extraction.routeId &&
          update.structured.statusClaim === opposite &&
          update.status !== "resolved",
      )
    : undefined;

  if (conflictWith) {
    const otherClaim =
      conflictWith.structured.statusClaim === "closed" ? "closed" : "open";
    const mine = extraction.statusClaim === "closed" ? "closed" : "open";
    const question = `Two reports disagree. ${conflictWith.reportedBy} says ${conflictWith.structured.routeName ?? "the road"} is ${otherClaim}; ${extraction.reporter} says it is ${mine}. Who do you trust — or should someone go and verify?`;
    activity.push({
      agent: "Communication Agent",
      message: `Conflict: ${conflictWith.reportedBy} reported "${otherClaim}" and ${extraction.reporter} reports "${mine}" for the same road.`,
      tone: "critical",
    });
    activity.push({
      agent: "Coordinator",
      message:
        "Pipeline stopped before planning. The organiser has to resolve which report to trust.",
      tone: "critical",
    });
    return {
      extraction,
      connected,
      impacts: [],
      proposals: [],
      checks: [],
      status: "needs_clarification",
      question,
      conflict: {
        withUpdateId: conflictWith._id,
        question,
        otherReporter: conflictWith.reportedBy,
        otherClaim,
        otherRawText: conflictWith.rawText,
      },
      activity,
    };
  }

  // Step 4 — work out the consequences
  const firstPlan = plan(extraction, connected, routes);
  activity.push({
    agent: "Planning Agent",
    message: `Found ${firstPlan.impacts.length} impact${firstPlan.impacts.length === 1 ? "" : "s"}: ${connected.peopleAffected} people affected, ${connected.trucks.length} truck(s) at risk.`,
    tone: firstPlan.impacts.some((item) => item.severity === "critical")
      ? "warning"
      : "info",
  });

  // Step 5 — draft the fixes
  let proposals = execute(firstPlan);
  activity.push({
    agent: "Execution Agent",
    message: `Drafted ${proposals.length} change${proposals.length === 1 ? "" : "s"}. Nothing is applied until the organiser approves.`,
    tone: "info",
  });

  // Step 6 — check the draft with ordinary code
  let checks = verify(
    proposals,
    extraction,
    connected,
    routes,
    trucks,
    volunteers,
  );
  const failed = checks.filter((check) => !check.passed);
  let revisionNote: string | undefined;

  if (failed.length > 0) {
    activity.push({
      agent: "Verification Agent",
      message: `Plan sent back: ${failed.map((check) => check.label).join("; ")}.`,
      tone: "critical",
    });
    const hasReroute = proposals.some((item) => item.kind === "truck_reroute");
    if (hasReroute) {
      const retryPlan = revise(firstPlan, failed);
      const retryProposals = execute(retryPlan);
      const retryChecks = verify(
        retryProposals,
        extraction,
        connected,
        routes,
        trucks,
        volunteers,
      );
      const retryFailed = retryChecks.filter((check) => !check.passed);
      if (retryFailed.length === 0) {
        proposals = retryProposals;
        checks = retryChecks;
        revisionNote = `Execution revised the plan after verification: ${failed
          .map((check) => check.label.toLowerCase())
          .join(", ")}. Trucks are held at the depot instead of diverted.`;
        activity.push({
          agent: "Execution Agent",
          message:
            "Revised plan: diversions replaced with a depot hold; cargo stays put.",
          tone: "warning",
        });
        activity.push({
          agent: "Verification Agent",
          message: `Revised plan passed ${retryChecks.length} checks. Waiting for the organiser.`,
          tone: "success",
        });
      } else {
        const question = `Verification cannot clear this plan: ${retryFailed
          .map((check) => check.label.toLowerCase())
          .join("; ")}. How should the desk handle it?`;
        activity.push({
          agent: "Coordinator",
          message:
            "Verification could not clear the revised plan. Paused for the organiser.",
          tone: "critical",
        });
        return {
          extraction,
          connected,
          impacts: firstPlan.impacts,
          proposals: retryProposals,
          checks: retryChecks,
          revisionNote:
            "Execution revised the plan, but verification still failed.",
          status: "needs_clarification",
          question,
          activity,
        };
      }
    } else {
      const question = `Verification cannot clear this plan: ${failed
        .map((check) => check.label.toLowerCase())
        .join("; ")}. How should the desk handle it?`;
      activity.push({
        agent: "Coordinator",
        message:
          "Verification could not clear the plan. Paused for the organiser.",
        tone: "critical",
      });
      return {
        extraction,
        connected,
        impacts: firstPlan.impacts,
        proposals,
        checks,
        status: "needs_clarification",
        question,
        activity,
      };
    }
  } else {
    activity.push({
      agent: "Verification Agent",
      message: `All ${checks.length} checks passed. Handing to the organiser for approval.`,
      tone: "success",
    });
  }

  return {
    extraction,
    connected,
    impacts: firstPlan.impacts,
    proposals,
    checks,
    revisionNote,
    status: "awaiting_approval",
    activity,
  };
}
