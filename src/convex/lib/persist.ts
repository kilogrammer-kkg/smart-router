import type { MutationCtx } from "../_generated/server";
import type { PipelineResult } from "./pipeline";

/**
 * Stores one coordinator run: the structured report, the drafted plan, the
 * verification results and every timeline entry, in one transaction.
 */
export async function persistRun(
  ctx: MutationCtx,
  rawText: string,
  result: PipelineResult,
  now = Date.now(),
) {
  const updateId = await ctx.db.insert("updates", {
    rawText,
    reportedBy: result.extraction.reporter,
    type: result.extraction.type,
    confidence: result.extraction.confidence,
    status: result.status,
    structured: {
      location: result.extraction.location,
      routeId: result.extraction.routeId,
      routeName: result.extraction.routeName,
      statusClaim: result.extraction.statusClaim,
      campNames: result.extraction.campNames,
      reasoning: result.extraction.reasoning,
    },
    connected: {
      campNames: result.connected.camps.map((camp) => camp.name),
      truckCodes: result.connected.trucks.map((truck) => truck.code),
      volunteerNames: result.connected.volunteers.map(
        (volunteer) => volunteer.name,
      ),
      peopleAffected: result.connected.peopleAffected,
    },
    impacts: result.impacts,
    proposals: result.proposals,
    checks: result.checks,
    revisionNote: result.revisionNote,
    question: result.question,
    conflict: result.conflict,
    createdAt: now,
    updatedAt: now,
  });

  for (const [index, entry] of result.activity.entries()) {
    await ctx.db.insert("activity", {
      updateId,
      agent: entry.agent,
      message: entry.message,
      tone: entry.tone,
      createdAt: now + index,
    });
  }

  return updateId;
}
