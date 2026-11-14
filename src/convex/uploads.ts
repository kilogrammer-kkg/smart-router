import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";

/** One-time upload URL for a photo or document attached to a field report. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Sign in to attach a file.");
    return await ctx.storage.generateUploadUrl();
  },
});
