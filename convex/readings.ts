import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";
import { Doc } from "./_generated/dataModel";
import { readingValidator, readingsFields } from "./schema";

/**
 * List the most recent 10 readings for the current user, ordered by updatedAt desc.
 */
export const list = query({
  args: {},
  returns: v.array(readingValidator),
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    return await ctx.db
      .query("readings")
      .withIndex("by_userId_and_updatedAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);
  },
});

/**
 * List starred readings for the current user.
 */
export const listStarred = query({
  args: {},
  returns: v.array(readingValidator),
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    return await ctx.db
      .query("readings")
      .withIndex("by_userId_and_starred", (q) =>
        q.eq("userId", user._id).eq("starred", true)
      )
      .order("desc")
      .take(10);
  },
});

/**
 * Create a new reading for the current user.
 */
export const create = mutation({
  args: readingsFields,
  returns: v.id("readings"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate spread exists
    const spread = await ctx.db.get(args.spread.id);
    if (!spread) {
      throw new Error("Spread not found");
    }

    // Validate parent reading exists if provided
    if (args.parent?.id) {
      const parentReading = await ctx.db.get(args.parent?.id);
      if (!parentReading) {
        throw new Error("Parent reading not found");
      }
    }

    const readingId = await ctx.db.insert("readings", {
      userId: user._id,
      updatedAt: Date.now(),
      question: args.question,
      date: args.date,
      drawMethod: args.drawMethod,
      digitalDrawRandomness: args.digitalDrawRandomness,
      spread: args.spread,
      useReverseMeanings: args.useReverseMeanings,
      useSignifierCard: args.useSignifierCard,
      results: args.results,
      title: args.title,
      context: args.context,
      image: args.image,
      parent: args.parent,
      notes: args.notes,
      starred: false,
    });

    return readingId;
  },
});

/**
 * Update an existing reading.
 */
export const update = mutation({
  args: readingValidator,
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const reading = await ctx.db.get(args._id);
    if (!reading) {
      throw new Error("Reading not found");
    }

    // Verify ownership
    if (reading.userId !== user._id) {
      throw new Error("Not authorized to update this reading");
    }

    // Validate spread exists if being updated
    if (args.spread.id) {
      const spread = await ctx.db.get(args.spread.id);
      if (!spread) {
        throw new Error("Spread not found");
      }
    }

    // Validate parent reading exists if being updated
    if (args.parent?.id) {
      const parentReading = await ctx.db.get(args.parent.id);
      if (!parentReading) {
        throw new Error("Parent reading not found");
      }
    }

    // Build update object
    const updates: Partial<Doc<"readings">> = {
      updatedAt: Date.now(),
    };

    if (args.question !== undefined) updates.question = args.question;
    if (args.date !== undefined) updates.date = args.date;
    if (args.drawMethod !== undefined) updates.drawMethod = args.drawMethod;
    if (args.digitalDrawRandomness !== undefined)
      updates.digitalDrawRandomness = args.digitalDrawRandomness;
    if (args.spread.id !== undefined && args.spread.version !== undefined) {
      updates.spread = args.spread;
    }
    if (args.useReverseMeanings !== undefined)
      updates.useReverseMeanings = args.useReverseMeanings;
    if (args.useSignifierCard !== undefined)
      updates.useSignifierCard = args.useSignifierCard;
    if (args.results !== undefined) updates.results = args.results;
    if (args.title !== undefined) updates.title = args.title;
    if (args.context !== undefined) updates.context = args.context;
    if (args.image !== undefined) updates.image = args.image;
    if (args.parent?.id !== undefined) {
      updates.parent = { type: "reading" as const, id: args.parent.id };
    }
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.interpretations !== undefined)
      updates.interpretations = args.interpretations;
    if (args.starred !== undefined) updates.starred = args.starred;

    await ctx.db.patch(args._id, updates);
    return null;
  },
});

/**
 * Delete a reading.
 */
export const remove = mutation({
  args: {
    id: v.id("readings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const reading = await ctx.db.get(args.id);
    if (!reading) {
      throw new Error("Reading not found");
    }

    // Verify ownership
    if (reading.userId !== user._id) {
      throw new Error("Not authorized to delete this reading");
    }

    await ctx.db.delete(args.id);
    return null;
  },
});
