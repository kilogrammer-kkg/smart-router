import type { Doc, Id } from "../_generated/dataModel";
import type { Confidence, ReportType, RouteStatus } from "../schema";

export type Camp = Doc<"camps">;
export type Route = Doc<"routes">;
export type Truck = Doc<"trucks">;
export type Volunteer = Doc<"volunteers">;

export type Impact = {
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
};

export type ProposalDraft = {
  key: string;
  kind:
    | "route_status"
    | "truck_reroute"
    | "truck_hold"
    | "volunteer_alert"
    | "priority_flag";
  title: string;
  detail: string;
  routeId?: Id<"routes">;
  routeStatus?: RouteStatus;
  truckId?: Id<"trucks">;
  etaNote?: string;
  alertBody?: string;
  included: boolean;
};

export type Check = { label: string; passed: boolean; detail: string };

// ── Step 2: Communication Agent ──────────────────────────────────────────────

export type Extraction = {
  type: ReportType;
  confidence: Confidence;
  reporter: string;
  location?: string;
  routeId?: Id<"routes">;
  routeName?: string;
  statusClaim?: "closed" | "open";
  campNames: string[];
  reasoning: string[];
};

const CLOSED_CUES = [
  "flooded",
  "flooding",
  "closed",
  "blocked",
  "blockage",
  "impassable",
  "washed out",
  "washed away",
  "collapsed",
  "submerged",
  "landslide",
  "can't pass",
  "cannot pass",
  "cant pass",
  "not passable",
  "shut",
  "cut off",
  "under water",
  "no way through",
  "bridge is out",
  "road is out",
];

const OPEN_CUES = [
  "is fine",
  "fine now",
  "just crossed",
  "crossed it",
  "reopened",
  "re-opened",
  "is open",
  "now open",
  "open again",
  "passable",
  "can pass",
  "no problem",
  "working again",
  "is clear",
];

const HEDGE_CUES = [
  "maybe",
  "might",
  "not sure",
  "i heard",
  "i think",
  "seems",
  "apparently",
  "rumour",
  "rumor",
  "possibly",
  "i believe",
  "someone said",
  "unconfirmed",
];

const SUPPLY_CUES = [
  "run out",
  "ran out",
  "no water",
  "no food",
  "no medicine",
  "short of",
  "shortage",
  "need water",
  "need food",
  "need medicine",
  "stocks are empty",
];

const ROUTE_STOPWORDS = new Set([
  "the",
  "and",
  "near",
  "access",
  "road",
  "route",
  "camp",
  "link",
  "way",
]);

function hits(text: string, cues: string[]) {
  return cues.filter((cue) => text.includes(cue));
}

function firstReporter(text: string) {
  const signature = text.match(
    /(?:^|\s)[-–—]\s*([\p{Lu}][\p{L}.'-]+(?:\s+[\p{Lu}][\p{L}.'-]+){0,2})\s*$/u,
  );
  if (signature) return signature[1].trim();
  const inline = text.match(
    /\b(?:from|by|reported by)\s+([\p{Lu}][\p{L}.'-]+(?:\s+[\p{Lu}][\p{L}.'-]+)?)/u,
  );
  if (inline) return inline[1].trim();
  return undefined;
}

function matchRoute(text: string, routes: Route[]) {
  const words = new Set(text.split(/[^a-z0-9]+/).filter(Boolean));
  let best: Route | undefined;
  let bestScore = 0;
  for (const route of routes) {
    const tokens = route.name
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 4 && !ROUTE_STOPWORDS.has(token));
    const score = tokens.filter((token) => words.has(token)).length;
    if (score > bestScore) {
      best = route;
      bestScore = score;
    }
  }
  return best;
}

/** Messy text in, structured report out. No guessing: an unresolved location stays unresolved. */
export function readReport(
  rawText: string,
  routes: Route[],
  camps: Camp[],
  suppliedReporter?: string,
): Extraction {
  const text = rawText.trim();
  const lower = ` ${text.toLowerCase()} `;
  const reasoning: string[] = [];

  const closedHits = hits(lower, CLOSED_CUES);
  const openHits = hits(lower, OPEN_CUES);
  const hedgeHits = hits(lower, HEDGE_CUES);
  const supplyHits = hits(lower, SUPPLY_CUES);

  let statusClaim: "closed" | "open" | undefined;
  if (closedHits.length > openHits.length) statusClaim = "closed";
  else if (openHits.length > closedHits.length) statusClaim = "open";

  const campNames = camps
    .filter((camp) => lower.includes(camp.name.toLowerCase()))
    .map((camp) => camp.name);
  const route = matchRoute(lower, routes);

  reasoning.push(
    route
      ? `Matched the stored road ${route.name}.`
      : "No stored road name appears in the message.",
  );

  if (statusClaim === "closed")
    reasoning.push(
      `"${closedHits[0]}" reads as a blocked route, so it is treating this as a closure — not a fact yet.`,
    );
  else if (statusClaim === "open")
    reasoning.push(
      `"${openHits[0]}" reads as a route being passable again.`,
    );
  else if (supplyHits.length > 0)
    reasoning.push(
      `"${supplyHits[0]}" describes a supply gap, not a road status.`,
    );
  else reasoning.push("There is no clear open/closed signal in the message.");

  if (hedgeHits.length > 0)
    reasoning.push(
      `Hedged wording ("${hedgeHits[0]}") keeps confidence below high.`,
    );

  const reporter = firstReporter(text) ?? suppliedReporter?.trim() ?? "Desk";
  reasoning.push(
    firstReporter(text)
      ? `Signed by ${reporter}.`
      : suppliedReporter
        ? `Attributed to ${reporter} by the desk.`
        : "No signature, so it is attributed to the desk.",
  );

  let type: ReportType = "unclear";
  if (statusClaim === "closed") type = "route_blocked";
  else if (statusClaim === "open") type = "route_open";
  else if (supplyHits.length > 0 && campNames.length > 0)
    type = "supply_shortage";

  const located = Boolean(route) || campNames.length > 0;
  let confidence: Confidence = "low";
  if (located && (statusClaim || type === "supply_shortage")) {
    confidence = hedgeHits.length > 0 ? "medium" : "high";
  } else if (located) {
    confidence = "low";
  }

  return {
    type,
    confidence,
    reporter,
    location: route?.name ?? (campNames[0] ? `near ${campNames[0]}` : undefined),
    routeId: route?._id,
    routeName: route?.name,
    statusClaim,
    campNames,
    reasoning,
  };
}

// ── Step 3: Knowledge Agent ──────────────────────────────────────────────────

export type Knowledge = {
  route?: Route;
  camps: Camp[];
  trucks: Truck[];
  volunteers: Volunteer[];
  peopleAffected: number;
};

export function connect(
  extraction: Extraction,
  routes: Route[],
  camps: Camp[],
  trucks: Truck[],
  volunteers: Volunteer[],
): Knowledge {
  const route = routes.find((item) => item._id === extraction.routeId);
  const campIds = new Set<Id<"camps">>(route?.campIds ?? []);
  for (const camp of camps) {
    if (extraction.campNames.includes(camp.name)) campIds.add(camp._id);
  }
  const affectedCamps = camps.filter((camp) => campIds.has(camp._id));

  const relevantRoutes = new Set<Id<"routes">>(
    routes
      .filter((item) => item.campIds.some((id) => campIds.has(id)))
      .map((item) => item._id),
  );
  if (route) relevantRoutes.add(route._id);

  const affectedTrucks = trucks.filter((truck) => {
    if (truck.status === "delivered" || truck.routeId === undefined) return false;
    // On a road report, only trucks physically on that road are at risk.
    return route ? truck.routeId === route._id : relevantRoutes.has(truck.routeId);
  });
  const affectedVolunteers = volunteers.filter(
    (volunteer) =>
      volunteer.campId !== undefined && campIds.has(volunteer.campId),
  );

  return {
    route,
    camps: affectedCamps,
    trucks: affectedTrucks,
    volunteers: affectedVolunteers,
    peopleAffected: affectedCamps.reduce((sum, camp) => sum + camp.headcount, 0),
  };
}

// ── Step 4: Planning Agent ───────────────────────────────────────────────────

export type Decision =
  | {
      kind: "route_status";
      route: Route;
      status: RouteStatus;
      why: string;
    }
  | { kind: "reroute"; truck: Truck; via: Route; why: string }
  | { kind: "hold"; truck: Truck; why: string }
  | {
      kind: "alert";
      camp: Camp;
      volunteers: Volunteer[];
      reason: "closure" | "reopening" | "shortage";
    }
  | { kind: "priority"; truck: Truck; why: string };

export type Plan = { impacts: Impact[]; decisions: Decision[] };

export function plan(
  extraction: Extraction,
  knowledge: Knowledge,
  routes: Route[],
): Plan {
  const impacts: Impact[] = [];
  const decisions: Decision[] = [];
  const { route, camps, trucks, volunteers, peopleAffected } = knowledge;
  const names = camps.map((camp) => camp.name).join(" + ");

  if (extraction.type === "route_blocked" && route) {
    impacts.push({
      severity: "critical",
      title: camps.length > 0 ? `${names} cut off` : `${route.name} closed`,
      detail:
        camps.length > 0
          ? `${peopleAffected} people across ${camps.length} camp${camps.length === 1 ? "" : "s"} depend on ${route.name}.`
          : `${route.name} is in the network but no camp depends on it yet.`,
    });

    for (const truck of trucks) {
      impacts.push({
        severity: "critical",
        title: `Truck ${truck.code} is behind the closure`,
        detail: `${truck.driver} is carrying ${truck.cargo} (covers ${truck.supplyForPeople} people). ETA ${truck.eta}.`,
      });
    }

    for (const camp of camps.filter((item) => item.medicalNeeds.trim().length > 0)) {
      impacts.push({
        severity: "warning",
        title: `Medical cover at ${camp.name} is exposed`,
        detail: `${camp.medicalNeeds}. Tonight's delivery window is at risk.`,
      });
    }

    if (volunteers.length > 0) {
      impacts.push({
        severity: "info",
        title: `${volunteers.length} volunteer${volunteers.length === 1 ? "" : "s"} on the far side`,
        detail: `${volunteers.map((item) => item.name).join(", ")} will need instructions before dark.`,
      });
    }

    decisions.push({
      kind: "route_status",
      route,
      status: "closed",
      why: `${extraction.reporter} reports ${route.name} is impassable.`,
    });

    const via = route.alternativeRouteId
      ? routes.find((item) => item._id === route.alternativeRouteId)
      : undefined;

    for (const truck of trucks) {
      if (via) {
        decisions.push({
          kind: "reroute",
          truck,
          via,
          why: `${route.name} is closed; ${via.name} reaches the same camps.`,
        });
      } else {
        decisions.push({
          kind: "hold",
          truck,
          why: `No verified alternative to ${route.name}, so the cargo waits at the depot.`,
        });
      }
      if (/medic|insulin|vaccine|oxygen|drug/i.test(truck.cargo)) {
        decisions.push({
          kind: "priority",
          truck,
          why: "Medical cargo on the blocked corridor.",
        });
      }
    }

    for (const camp of camps) {
      decisions.push({
        kind: "alert",
        camp,
        volunteers: volunteers.filter((item) => item.campId === camp._id),
        reason: "closure",
      });
    }
  }

  if (extraction.type === "route_open" && route) {
    impacts.push({
      severity: "info",
      title: camps.length > 0 ? `Access could return to ${names}` : `${route.name} reported passable`,
      detail:
        camps.length > 0
          ? `${peopleAffected} people would regain the road. Nothing has been reopened in the operation map yet.`
          : "A second report of passability is needed before the map changes.",
    });
    decisions.push({
      kind: "route_status",
      route,
      status: "open",
      why: `${extraction.reporter} reports ${route.name} is passable.`,
    });
    for (const camp of camps) {
      decisions.push({
        kind: "alert",
        camp,
        volunteers: volunteers.filter((item) => item.campId === camp._id),
        reason: "reopening",
      });
    }
  }

  if (extraction.type === "supply_shortage") {
    impacts.push({
      severity: "warning",
      title: `${names || "A camp"} is short on supplies`,
      detail: `${peopleAffected} people registered. ${trucks.length} truck${trucks.length === 1 ? "" : "s"} currently routed toward them.`,
    });
    for (const camp of camps) {
      decisions.push({
        kind: "alert",
        camp,
        volunteers: volunteers.filter((item) => item.campId === camp._id),
        reason: "shortage",
      });
    }
    for (const truck of trucks) {
      decisions.push({
        kind: "priority",
        truck,
        why: "Cargo is needed earlier than planned.",
      });
    }
  }

  return { impacts, decisions };
}

// ── Step 5: Execution Agent ──────────────────────────────────────────────────

export function execute(planResult: Plan): ProposalDraft[] {
  return planResult.decisions.map((decision) => {
    if (decision.kind === "route_status") {
      return {
        key: `route-${decision.route._id}`,
        kind: "route_status" as const,
        title: `${decision.status === "closed" ? "Close" : "Reopen"} ${decision.route.name}`,
        detail: `Set the road to ${decision.status} in the operation map. ${decision.why}`,
        routeId: decision.route._id,
        routeStatus: decision.status,
        included: true,
      };
    }
    if (decision.kind === "reroute") {
      return {
        key: `reroute-${decision.truck._id}`,
        kind: "truck_reroute" as const,
        title: `Divert truck ${decision.truck.code} via ${decision.via.name}`,
        detail: `${decision.why} Driver ${decision.truck.driver} gets a new line of travel; allow +3 hours on the current ETA (${decision.truck.eta}).`,
        routeId: decision.via._id,
        truckId: decision.truck._id,
        etaNote: "+3 h",
        included: true,
      };
    }
    if (decision.kind === "hold") {
      return {
        key: `hold-${decision.truck._id}`,
        kind: "truck_hold" as const,
        title: `Hold truck ${decision.truck.code} at the depot`,
        detail: `${decision.why} Cargo stays loaded and the driver waits for a route.`,
        truckId: decision.truck._id,
        included: true,
      };
    }
    if (decision.kind === "alert") {
      const recipients =
        decision.volunteers.length > 0
          ? decision.volunteers.map((item) => item.name).join(", ")
          : "nobody (no volunteer is assigned to this camp)";
      const body =
        decision.reason === "closure"
          ? `${decision.camp.name}: the access road is reported closed. Hold outbound movement and confirm your stock levels. The coordinator will confirm the reopening.`
          : decision.reason === "reopening"
            ? `${decision.camp.name}: the access road is reported passable again. Wait for the organiser's confirmation before release.`
            : `${decision.camp.name}: shortage reported. Confirm what is left on hand and how long it will last.`;
      return {
        key: `alert-${decision.camp._id}`,
        kind: "volunteer_alert" as const,
        title: `Alert ${recipients}`,
        detail: `Draft message to ${decision.camp.name}. It is queued, not sent, until approval.`,
        alertBody: body,
        included: true,
      };
    }
    return {
      key: `priority-${decision.truck._id}`,
      kind: "priority_flag" as const,
      title: `Flag truck ${decision.truck.code} as priority`,
      detail: `${decision.why} Priority cargo is unloaded first at the receiving camp.`,
      truckId: decision.truck._id,
      included: true,
    };
  });
}

// ── Step 6: Verification Agent ───────────────────────────────────────────────

export function verify(
  proposals: ProposalDraft[],
  extraction: Extraction,
  knowledge: Knowledge,
  routes: Route[],
  trucks: Truck[],
  volunteers: Volunteer[],
): Check[] {
  const checks: Check[] = [];
  const reroutes = proposals.filter((item) => item.kind === "truck_reroute");
  const holds = proposals.filter((item) => item.kind === "truck_hold");
  const alerts = proposals.filter((item) => item.kind === "volunteer_alert");

  for (const reroute of reroutes) {
    const via = routes.find((route) => route._id === reroute.routeId);
    checks.push({
      label: "Diverted road is not itself closed",
      passed: via?.status === "open",
      detail: via
        ? `${via.name} is marked ${via.status}.`
        : "The diverted road is missing from the map.",
    });
  }

  const byVia = new Map<Id<"routes">, number>();
  for (const reroute of reroutes) {
    if (!reroute.routeId) continue;
    byVia.set(reroute.routeId, (byVia.get(reroute.routeId) ?? 0) + 1);
  }
  for (const [viaId, diverted] of byVia) {
    const via = routes.find((route) => route._id === viaId);
    if (!via) continue;
    const alreadyThere = trucks.filter(
      (truck) => truck.routeId === viaId && truck.status !== "delivered",
    ).length;
    const total = alreadyThere + diverted;
    checks.push({
      label: "No truck double-booked on the diverted road",
      passed: total <= via.capacityTrucks,
      detail: `${total} of ${via.capacityTrucks} convoy slots used on ${via.name}.`,
    });
  }

  if (reroutes.length > 0) {
    const supply = reroutes.reduce((sum, proposal) => {
      const truck = trucks.find((item) => item._id === proposal.truckId);
      return sum + (truck?.supplyForPeople ?? 0);
    }, 0);
    checks.push({
      label: "Cargo covers the affected headcount",
      passed: supply >= knowledge.peopleAffected,
      detail: `${supply} supply places for ${knowledge.peopleAffected} people.`,
    });
  }

  if (holds.length > 0) {
    checks.push({
      label: "Held cargo stays off the blocked road",
      passed: true,
      detail: `${holds.length} truck${holds.length === 1 ? "" : "s"} kept at the depot instead of sent into the closure.`,
    });
  }

  if (alerts.length > 0) {
    const missing = alerts.filter((alert) => {
      const camp = knowledge.camps.find((item) =>
        alert.key.endsWith(item._id),
      );
      return (
        !camp ||
        !volunteers.some((volunteer) => volunteer.campId === camp._id)
      );
    });
    checks.push({
      label: "Every alert has a named recipient",
      passed: missing.length === 0,
      detail:
        missing.length === 0
          ? `${alerts.length} alert draft${alerts.length === 1 ? "" : "s"} addressed to assigned volunteers.`
          : `${missing.length} camp${missing.length === 1 ? "" : "s"} have no volunteer contact to receive the alert.`,
    });
  }

  if (extraction.type === "route_blocked" && knowledge.route) {
    const coveredTruckIds = new Set(
      [...reroutes, ...holds].map((item) => item.truckId),
    );
    const stranded = knowledge.trucks.filter(
      (truck) => !coveredTruckIds.has(truck._id),
    );
    checks.push({
      label: "Every truck on the road has an instruction",
      passed: stranded.length === 0,
      detail:
        stranded.length === 0
          ? `${knowledge.trucks.length} truck${knowledge.trucks.length === 1 ? "" : "s"} diverted or held.`
          : `${stranded.map((truck) => truck.code).join(", ")} would still be sent into the closure.`,
    });
  }

  checks.push({
    label: "Status change rests on a first-hand report",
    passed: extraction.confidence !== "low",
    detail: `${extraction.reporter} reports it directly; confidence ${extraction.confidence}.`,
  });

  return checks;
}

/** Verification failed: execution replaces diversions with a safer hold. */
export function revise(planResult: Plan, failed: Check[]): Plan {
  const decisions: Decision[] = planResult.decisions.map((decision) => {
    if (decision.kind !== "reroute") return decision;
    return {
      kind: "hold",
      truck: decision.truck,
      why: `Verification blocked the diversion (${failed
        .filter((check) => !check.passed)
        .map((check) => check.label.toLowerCase())
        .join("; ")}).`,
    };
  });
  return { impacts: planResult.impacts, decisions };
}
