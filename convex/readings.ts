import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";
import { Doc } from "./_generated/dataModel";
import { readingValidator } from "./schema";

const readingsCreateArgs = readingValidator.omit(
  "userId",
  "updatedAt",
  "interpretations"
);

const readingsUpdateArgs = readingValidator
  .omit("userId", "updatedAt")
  .partial()
  .extend({ _id: v.id("readings") });

/**
 * List the most recent 10 readings for the current user, ordered by updatedAt desc.
 */
export const list = query({
  args: {},
  returns: v.array(readingValidator.extend({
    _id: v.id("readings"),
    _creationTime: v.number(),
  })),
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
  returns: v.array(readingValidator.extend({
    _id: v.id("readings"),
    _creationTime: v.number(),
  })),
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
 * Increments the spread's readingCount and server-enforces the current version.
 */
export const create = mutation({
  args: readingsCreateArgs,
  returns: v.id("readings"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate spread exists
    const spread = await ctx.db.get(args.spread.id);
    if (!spread) {
      throw new Error("Spread not found");
    }
    if (spread.userId !== user._id) {
      throw new Error("Not authorized to create reading for this spread");
    }
    if (spread.deleted) {
      throw new Error("Cannot create reading with a deleted spread");
    }

    // Validate parent reading exists if provided
    if (args.parent?.id) {
      const parentReading = await ctx.db.get(args.parent?.id);
      if (!parentReading) {
        throw new Error("Parent reading not found");
      }
      if (parentReading.userId !== user._id) {
        throw new Error("Not authorized to use this parent reading");
      }
    }

    // Increment spread's readingCount
    await ctx.db.patch(args.spread.id, {
      readingCount: spread.readingCount + 1,
    });

    // Archive the spread's current state if no snapshot exists for this version yet.
    // This ensures only versions that readings actually reference get archived —
    // edits between readings don't create orphan snapshots.
    const existingSnapshot = await ctx.db
      .query("spread_versions")
      .withIndex("by_spreadId_and_version", (q) =>
        q.eq("spreadId", args.spread.id).eq("version", spread.version)
      )
      .unique();

    if (!existingSnapshot) {
      await ctx.db.insert("spread_versions", {
        spreadId: args.spread.id,
        version: spread.version,
        name: spread.name,
        description: spread.description,
        numberOfCards: spread.numberOfCards,
        positions: spread.positions,
        archivedAt: Date.now(),
      });
    }

    // Server-enforce the spread's current version
    const readingId = await ctx.db.insert("readings", {
      userId: user._id,
      updatedAt: Date.now(),
      question: args.question,
      date: args.date,
      drawMethod: args.drawMethod,
      digitalDrawRandomness: args.digitalDrawRandomness,
      spread: {
        id: args.spread.id,
        version: spread.version, // Server-enforced: always use current version
      },
      useReverseMeanings: args.useReverseMeanings,
      useSignifierCard: args.useSignifierCard,
      results: args.results,
      title: args.title,
      context: args.context,
      image: args.image,
      parent: args.parent,
      notes: args.notes,
      starred: args.starred,
    });

    return readingId;
  },
});

/**
 * Update an existing reading.
 * The spread reference is immutable after creation so readings remain historical records.
 */
export const update = mutation({
  args: readingsUpdateArgs,
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

    if (args.spread) {
      throw new Error("Reading spread cannot be changed after creation");
    }

    // Validate parent reading exists if being updated
    if (args.parent) {
      const parentReading = await ctx.db.get(args.parent.id);
      if (!parentReading) {
        throw new Error("Parent reading not found");
      }
      if (parentReading.userId !== user._id) {
        throw new Error("Not authorized to use this parent reading");
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
    if (args.useReverseMeanings !== undefined)
      updates.useReverseMeanings = args.useReverseMeanings;
    if (args.useSignifierCard !== undefined)
      updates.useSignifierCard = args.useSignifierCard;
    if (args.results !== undefined) updates.results = args.results;
    if (args.title !== undefined) updates.title = args.title;
    if (args.context !== undefined) updates.context = args.context;
    if (args.image !== undefined) updates.image = args.image;
    if (args.parent !== undefined) updates.parent = args.parent;
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
 * Decrements the spread's readingCount. If the spread was soft-deleted and
 * readingCount hits 0, auto-cleans the spread and its versions.
 */
export const remove = mutation({
  args: {
    _id: v.id("readings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const reading = await ctx.db.get(args._id);
    if (!reading) {
      throw new Error("Reading not found");
    }

    // Verify ownership
    if (reading.userId !== user._id) {
      throw new Error("Not authorized to delete this reading");
    }

    await ctx.db.delete(args._id);

    // Decrement spread's readingCount (if spread still exists)
    const spread = await ctx.db.get(reading.spread.id);
    if (spread) {
      const newCount = Math.max(0, spread.readingCount - 1);
      await ctx.db.patch(spread._id, { readingCount: newCount });

      // Auto-cleanup: if spread was soft-deleted and no readings remain, hard-delete it
      if (spread.deleted && newCount === 0) {
        const versions = await ctx.db
          .query("spread_versions")
          .withIndex("by_spreadId_and_version", (q) =>
            q.eq("spreadId", spread._id)
          )
          .collect();
        for (const v of versions) {
          await ctx.db.delete(v._id);
        }
        await ctx.db.delete(spread._id);
      }
    }

    return null;
  },
});
