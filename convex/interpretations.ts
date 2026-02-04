import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";
import { Doc } from "./_generated/dataModel";
import { interpretationValidator } from "./schema";

/**
 * List the most recent 10 interpretations for the current user, ordered by updatedAt desc.
 */
export const list = query({
  args: {},
  returns: v.array(interpretationValidator),
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    
    // Get all interpretations for the user and sort by updatedAt
    const interpretations = await ctx.db
      .query("interpretations")
      .withIndex("by_userId_and_source")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .collect();

    // Sort by updatedAt desc and take 10
    return interpretations
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 10);
  },
});

/**
 * List interpretations for a specific reading.
 */
export const listByReading = query({
  args: {
    readingId: v.id("readings"),
  },
  returns: v.array(interpretationValidator),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Verify reading exists and belongs to user
    const reading = await ctx.db.get(args.readingId);
    if (!reading) {
      throw new Error("Reading not found");
    }
    if (reading.userId !== user._id) {
      throw new Error("Not authorized to view interpretations for this reading");
    }

    return await ctx.db
      .query("interpretations")
      .withIndex("by_readingId", (q) => q.eq("readingId", args.readingId))
      .collect();
  },
});

/**
 * List interpretations by source (self or ai).
 */
export const listBySource = query({
  args: {
    source: v.union(v.literal("self"), v.literal("ai")),
  },
  returns: v.array(interpretationValidator),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    return await ctx.db
      .query("interpretations")
      .withIndex("by_userId_and_source", (q) =>
        q.eq("userId", user._id).eq("source", args.source)
      )
      .take(10);
  },
});

/**
 * Create a new interpretation for a reading.
 */
export const create = mutation({
  args: {
    readingId: v.id("readings"),
    content: v.string(),
    source: v.union(v.literal("self"), v.literal("ai")),
    focus: v.optional(v.string()),
    aiMetadata: v.optional(
      v.object({
        tier: v.union(v.literal("free"), v.literal("premium")),
        model: v.object({
          name: v.string(),
          version: v.string(),
        }),
        requestTime: v.number(),
        totalCost: v.number(),
        tokensUsed: v.number(),
        systemPrompt: v.optional(v.string()),
      })
    ),
  },
  returns: v.id("interpretations"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate reading exists and belongs to user
    const reading = await ctx.db.get(args.readingId);
    if (!reading) {
      throw new Error("Reading not found");
    }
    if (reading.userId !== user._id) {
      throw new Error("Not authorized to create interpretation for this reading");
    }

    const interpretationId = await ctx.db.insert("interpretations", {
      userId: user._id,
      readingId: args.readingId,
      updatedAt: Date.now(),
      content: args.content,
      source: args.source,
      focus: args.focus,
      aiMetadata: args.aiMetadata,
    });

    return interpretationId;
  },
});

/**
 * Update an existing interpretation.
 */
export const update = mutation({
  args: {
    id: v.id("interpretations"),
    content: v.optional(v.string()),
    focus: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const interpretation = await ctx.db.get(args.id);
    if (!interpretation) {
      throw new Error("Interpretation not found");
    }

    // Verify ownership
    if (interpretation.userId !== user._id) {
      throw new Error("Not authorized to update this interpretation");
    }

    // Build update object
    const updates: Partial<Doc<"interpretations">> = {
      updatedAt: Date.now(),
    };

    if (args.content !== undefined) updates.content = args.content;
    if (args.focus !== undefined) updates.focus = args.focus;

    await ctx.db.patch(args.id, updates);
    return null;
  },
});

/**
 * Delete an interpretation.
 */
export const remove = mutation({
  args: {
    id: v.id("interpretations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const interpretation = await ctx.db.get(args.id);
    if (!interpretation) {
      throw new Error("Interpretation not found");
    }

    // Verify ownership
    if (interpretation.userId !== user._id) {
      throw new Error("Not authorized to delete this interpretation");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});
