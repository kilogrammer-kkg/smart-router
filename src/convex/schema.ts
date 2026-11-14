import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

// ── Shared domain validators ─────────────────────────────────────────────────

export const routeStatusValidator = v.union(
  v.literal("open"),
  v.literal("closed"),
  v.literal("unknown"),
);
export type RouteStatus = Infer<typeof routeStatusValidator>;

export const reportTypeValidator = v.union(
  v.literal("route_blocked"),
  v.literal("route_open"),
  v.literal("supply_shortage"),
  v.literal("unclear"),
);
export type ReportType = Infer<typeof reportTypeValidator>;

export const confidenceValidator = v.union(
  v.literal("high"),
  v.literal("medium"),
  v.literal("low"),
);
export type Confidence = Infer<typeof confidenceValidator>;

export const updateStatusValidator = v.union(
  v.literal("awaiting_approval"),
  v.literal("needs_clarification"),
  v.literal("resolved"),
);
export type UpdateStatus = Infer<typeof updateStatusValidator>;

export const impactValidator = v.object({
  severity: v.union(
    v.literal("critical"),
    v.literal("warning"),
    v.literal("info"),
  ),
  title: v.string(),
  detail: v.string(),
});

export const proposalValidator = v.object({
  // stable key so an organiser's edits survive re-renders
  key: v.string(),
  kind: v.union(
    v.literal("route_status"),
    v.literal("truck_reroute"),
    v.literal("truck_hold"),
    v.literal("volunteer_alert"),
    v.literal("priority_flag"),
  ),
  title: v.string(),
  detail: v.string(),
  routeId: v.optional(v.id("routes")),
  routeStatus: v.optional(routeStatusValidator),
  truckId: v.optional(v.id("trucks")),
  etaNote: v.optional(v.string()),
  alertBody: v.optional(v.string()),
  included: v.boolean(),
});

export const checkValidator = v.object({
  label: v.string(),
  passed: v.boolean(),
  detail: v.string(),
});

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ── Step 0: the stored picture of the operation ──────────────────────────

    camps: defineTable({
      name: v.string(),
      location: v.string(),
      headcount: v.number(),
      medicalNeeds: v.string(),
    }).index("by_name", ["name"]),

    routes: defineTable({
      name: v.string(),
      status: routeStatusValidator,
      // camps that lose access if this route closes
      campIds: v.array(v.id("camps")),
      // the road the coordinator can suggest instead
      alternativeRouteId: v.optional(v.id("routes")),
      capacityTrucks: v.number(),
      notes: v.optional(v.string()),
    }).index("by_name", ["name"]),

    trucks: defineTable({
      code: v.string(),
      driver: v.string(),
      routeId: v.optional(v.id("routes")),
      cargo: v.string(),
      // how many people the cargo on board can cover
      supplyForPeople: v.number(),
      eta: v.string(),
      priority: v.boolean(),
      status: v.union(
        v.literal("en_route"),
        v.literal("held"),
        v.literal("delivered"),
      ),
    })
      .index("by_code", ["code"])
      .index("by_route", ["routeId"]),

    volunteers: defineTable({
      name: v.string(),
      campId: v.optional(v.id("camps")),
      contact: v.string(),
    }).index("by_camp", ["campId"]),

    // ── Steps 1–7: one row per incoming update and its full audit trail ──────

    updates: defineTable({
      rawText: v.string(),
      reportedBy: v.string(),
      type: reportTypeValidator,
      confidence: confidenceValidator,
      status: updateStatusValidator,

      // Communication Agent output
      structured: v.object({
        location: v.optional(v.string()),
        routeId: v.optional(v.id("routes")),
        routeName: v.optional(v.string()),
        statusClaim: v.optional(
          v.union(v.literal("closed"), v.literal("open")),
        ),
        campNames: v.array(v.string()),
        reasoning: v.array(v.string()),
      }),

      // Knowledge Agent output
      connected: v.object({
        campNames: v.array(v.string()),
        truckCodes: v.array(v.string()),
        volunteerNames: v.array(v.string()),
        peopleAffected: v.number(),
      }),

      // Planning Agent output
      impacts: v.array(impactValidator),

      // Execution Agent output (draft only — applied on approval)
      proposals: v.array(proposalValidator),

      // Verification Agent output
      checks: v.array(checkValidator),

      // set when verification sent the plan back to execution
      revisionNote: v.optional(v.string()),

      // what the coordinator is waiting on a human to answer
      question: v.optional(v.string()),

      conflict: v.optional(
        v.object({
          withUpdateId: v.id("updates"),
          question: v.string(),
          otherReporter: v.string(),
          otherClaim: v.string(),
          otherRawText: v.string(),
        }),
      ),

      decision: v.optional(
        v.union(v.literal("approved"), v.literal("rejected")),
      ),
      decisionNote: v.optional(v.string()),
      decidedBy: v.optional(v.string()),
      decidedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_status", ["status"])
      .index("by_created", ["createdAt"]),

    activity: defineTable({
      updateId: v.optional(v.id("updates")),
      agent: v.string(),
      message: v.string(),
      tone: v.union(
        v.literal("info"),
        v.literal("success"),
        v.literal("warning"),
        v.literal("critical"),
      ),
      createdAt: v.number(),
    }).index("by_created", ["createdAt"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
