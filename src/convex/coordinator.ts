import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, type MutationCtx } from "./_generated/server";
import { persistRun } from "./lib/persist";
import { runCoordinator } from "./lib/pipeline";

async function requireUser(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Sign in to act on the plan.");
  const user = await ctx.db.get(userId);
  return {
    userId,
    name: user?.name?.trim() || user?.email || "Organiser",
  };
}

async function loadOperation(ctx: MutationCtx) {
  const [routes, camps, trucks, volunteers, recent] = await Promise.all([
    ctx.db.query("routes").collect(),
    ctx.db.query("camps").collect(),
    ctx.db.query("trucks").collect(),
    ctx.db.query("volunteers").collect(),
    ctx.db.query("updates").order("desc").take(25),
  ]);
  return {
    routes,
    camps,
    trucks,
    volunteers,
    pendingUpdates: recent.filter((update) => update.status !== "resolved"),
  };
}

/** Steps 1–6: one message in, a fully checked draft plan out. Nothing applied. */
export const submitUpdate = mutation({
  args: {
    rawText: v.string(),
    reportedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const rawText = args.rawText.trim();
    if (rawText.length < 4) {
      throw new Error("Write the update before running the coordinator.");
    }
    if (rawText.length > 2000) {
      throw new Error("Keep field updates under 2000 characters.");
    }

    const operation = await loadOperation(ctx);
    const result = runCoordinator({
      rawText,
      suppliedReporter: args.reportedBy,
      ...operation,
    });
    const updateId = await persistRun(ctx, rawText, result);
    return { updateId, status: result.status };
  },
});

/** Step 7: a human approves. Only now does the operation map change. */
export const approveUpdate = mutation({
  args: {
    updateId: v.id("updates"),
    includedKeys: v.array(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const update = await ctx.db.get(args.updateId);
    if (!update) throw new Error("That update no longer exists.");
    if (update.status !== "awaiting_approval") {
      throw new Error("This update is not waiting for approval.");
    }

    const selected = new Set(args.includedKeys);
    const applied: string[] = [];

    for (const proposal of update.proposals) {
      if (!selected.has(proposal.key)) continue;

      if (
        proposal.kind === "route_status" &&
        proposal.routeId &&
        proposal.routeStatus
      ) {
        await ctx.db.patch(proposal.routeId, {
          status: proposal.routeStatus,
        });
        applied.push(proposal.title);
      }

      if (proposal.kind === "truck_reroute" && proposal.truckId && proposal.routeId) {
        const truck = await ctx.db.get(proposal.truckId);
        const via = await ctx.db.get(proposal.routeId);
        if (truck && via) {
          await ctx.db.patch(truck._id, {
            routeId: via._id,
            eta: `${truck.eta} · via ${via.name} (${proposal.etaNote ?? "+3 h"})`,
            status: "en_route",
          });
          applied.push(proposal.title);
        }
      }

      if (proposal.kind === "truck_hold" && proposal.truckId) {
        await ctx.db.patch(proposal.truckId, { status: "held" });
        applied.push(proposal.title);
      }

      if (proposal.kind === "priority_flag" && proposal.truckId) {
        await ctx.db.patch(proposal.truckId, { priority: true });
        applied.push(proposal.title);
      }

      if (proposal.kind === "volunteer_alert") {
        await ctx.db.insert("activity", {
          updateId: update._id,
          agent: "Execution Agent",
          message: `Alert queued to ${proposal.title.replace(/^Alert\s/, "")}: “${proposal.alertBody ?? proposal.detail}”`,
          tone: "info",
          createdAt: Date.now(),
        });
        applied.push(proposal.title);
      }
    }

    if (applied.length === 0) {
      throw new Error("Select at least one change to approve, or reject the plan.");
    }

    await ctx.db.patch(update._id, {
      status: "resolved",
      decision: "approved",
      decisionNote: args.note,
      decidedBy: user.name,
      decidedAt: Date.now(),
      updatedAt: Date.now(),
      question: undefined,
      proposals: update.proposals.map((proposal) => ({
        ...proposal,
        included: selected.has(proposal.key),
      })),
    });

    await ctx.db.insert("activity", {
      updateId: update._id,
      agent: "Coordinator",
      message: `${user.name} approved ${applied.length} change${applied.length === 1 ? "" : "s"} and the operation map was updated.`,
      tone: "success",
      createdAt: Date.now(),
    });

    return { applied };
  },
});

/** Step 7, the other branch: nothing changes and the draft is kept for audit. */
export const rejectUpdate = mutation({
  args: {
    updateId: v.id("updates"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const update = await ctx.db.get(args.updateId);
    if (!update) throw new Error("That update no longer exists.");
    if (update.status === "resolved") {
      throw new Error("This update is already closed.");
    }

    await ctx.db.patch(update._id, {
      status: "resolved",
      decision: "rejected",
      decisionNote: args.note ?? "Rejected at the desk. Nothing applied.",
      decidedBy: user.name,
      decidedAt: Date.now(),
      updatedAt: Date.now(),
      question: undefined,
    });

    await ctx.db.insert("activity", {
      updateId: update._id,
      agent: "Coordinator",
      message: `${user.name} rejected the draft. No database change, no message sent.`,
      tone: "warning",
      createdAt: Date.now(),
    });
  },
});

/** The uncertainty case: the organiser decides which report to trust. */
export const resolveConflict = mutation({
  args: {
    updateId: v.id("updates"),
    resolution: v.union(
      v.literal("new"),
      v.literal("previous"),
      v.literal("verify"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const update = await ctx.db.get(args.updateId);
    if (!update) throw new Error("That update no longer exists.");
    const conflict = update.conflict;
    if (!conflict) throw new Error("This update is not a conflict.");

    const other = await ctx.db.get(conflict.withUpdateId);
    const now = Date.now();

    if (args.resolution === "previous") {
      await ctx.db.patch(update._id, {
        status: "resolved",
        decision: "rejected",
        decisionNote: `Kept ${conflict.otherReporter}'s original report.`,
        decidedBy: user.name,
        decidedAt: now,
        updatedAt: now,
        question: undefined,
      });
      await ctx.db.insert("activity", {
        updateId: update._id,
        agent: "Coordinator",
        message: `${user.name} trusted ${conflict.otherReporter}'s earlier report. The newer report was filed without changes.`,
        tone: "warning",
        createdAt: now,
      });
      return { outcome: "kept_previous" as const };
    }

    if (args.resolution === "verify") {
      await ctx.db.patch(update._id, {
        status: "resolved",
        decision: "rejected",
        decisionNote: "Sent for field verification.",
        decidedBy: user.name,
        decidedAt: now,
        updatedAt: now,
        question: undefined,
      });
      if (other) {
        await ctx.db.patch(other._id, {
          status: "resolved",
          decision: "rejected",
          decisionNote: "Superseded by a field verification request.",
          decidedBy: user.name,
          decidedAt: now,
          updatedAt: now,
          question: undefined,
        });
      }
      if (update.structured.routeId) {
        await ctx.db.patch(update.structured.routeId, {
          status: "unknown",
        });
      }
      await ctx.db.insert("activity", {
        updateId: update._id,
        agent: "Coordinator",
        message: `${user.name} asked for field verification. ${update.structured.routeName ?? "The road"} is now marked unknown; no truck was moved.`,
        tone: "warning",
        createdAt: now,
      });
      return { outcome: "verification_requested" as const };
    }

    // Trust the newer report: retire the old one, then rerun the pipeline with
    // that earlier report out of the way.
    if (other) {
      await ctx.db.patch(other._id, {
        status: "resolved",
        decision: "rejected",
        decisionNote: `Overtaken by a newer report from ${update.reportedBy}.`,
        decidedBy: user.name,
        decidedAt: now,
        updatedAt: now,
        question: undefined,
      });
    }
    await ctx.db.patch(update._id, {
      status: "resolved",
      decision: "rejected",
      decisionNote: "Superseded — the plan was rebuilt from this report.",
      decidedBy: user.name,
      decidedAt: now,
      updatedAt: now,
      question: undefined,
    });

    const operation = await loadOperation(ctx);
    const result = runCoordinator({
      rawText: update.rawText,
      suppliedReporter: update.reportedBy,
      ...operation,
      pendingUpdates: operation.pendingUpdates.filter(
        (item) => item._id !== other?._id,
      ),
    });
    const newUpdateId = await persistRun(ctx, update.rawText, result);

    await ctx.db.insert("activity", {
      updateId: newUpdateId,
      agent: "Coordinator",
      message: `${user.name} trusted the newer report from ${update.reportedBy}. The pipeline was rerun and a fresh plan is waiting.`,
      tone: "info",
      createdAt: Date.now(),
    });

    return { outcome: "retrusted_new" as const, updateId: newUpdateId };
  },
});
