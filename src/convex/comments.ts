import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const commentTargetValidator = v.union(
  v.literal("update"),
  v.literal("camp"),
  v.literal("truck"),
  v.literal("route"),
  v.literal("volunteer"),
);

export const list = query({
  args: {
    targetType: commentTargetValidator,
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId),
      )
      .order("asc")
      .take(100);

    return comments.map((comment) => ({ ...comment, id: comment._id }));
  },
});

export const add = mutation({
  args: {
    targetType: commentTargetValidator,
    targetId: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to join the discussion.");

    const body = args.body.trim();
    if (body.length < 1) throw new Error("Write a note before posting it.");
    if (body.length > 600) throw new Error("Keep notes under 600 characters.");

    const user = await ctx.db.get(userId);
    const authorName =
      user?.name?.trim() || user?.email || "Team member";

    return await ctx.db.insert("comments", {
      targetType: args.targetType,
      targetId: args.targetId,
      authorId: userId,
      authorName,
      body,
      createdAt: Date.now(),
    });
  },
});
