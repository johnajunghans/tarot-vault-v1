import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";
import { Doc } from "./_generated/dataModel";
import { spreadValidator } from "./schema";

const spreadsCreateArgs = spreadValidator.omit(
  "userId",
  "updatedAt",
  "favorite"
);

const spreadsUpdateArgs = spreadValidator
  .omit("userId", "updatedAt", "favorite")
  .partial()
  .extend({ _id: v.id("spreads") });

/**
 * List the most recent 10 spreads for the current user, ordered by updatedAt desc.
 */
export const list = query({
  args: {},
  returns: v.array(spreadValidator.extend({
    _id: v.id("spreads"),
    _creationTime: v.number(),
  })),
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    return await ctx.db
      .query("spreads")
      .withIndex("by_userId_and_updatedAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);
  },
});

/**
 * Get a specific spread by ID.
 */
export const getById = query({
  args: {
    _id: v.id("spreads"),
  },
  returns: v.union(spreadValidator.extend({
    _id: v.id("spreads"),
    _creationTime: v.number(),
  }), v.null()),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const spread = await ctx.db.get(args._id);
    if (!spread) {
      return null;
    }

    // Verify ownership
    if (spread.userId !== user._id) {
      throw new Error("Not authorized to view this spread");
    }

    return spread;
  },
});

/**
 * Create a new spread for the current user.
 */
export const create = mutation({
  args: spreadsCreateArgs,
  returns: v.id("spreads"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Validate numberOfCards matches positions array length
    if (args.numberOfCards !== args.positions.length) {
      throw new Error(
        `numberOfCards (${args.numberOfCards}) must match the length of positions array (${args.positions.length})`
      );
    }

    // Validate numberOfCards is between 1 and 78
    if (args.numberOfCards < 1 || args.numberOfCards > 78) {
      throw new Error("numberOfCards must be between 1 and 78");
    }

    const spreadId = await ctx.db.insert("spreads", {
      userId: user._id,
      updatedAt: Date.now(),
      name: args.name,
      description: args.description,
      numberOfCards: args.numberOfCards,
      positions: args.positions,
      favorite: false,
    });

    return spreadId;
  },
});

/**
 * Update an existing spread.
 */
export const update = mutation({
  args: spreadsUpdateArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const spread = await ctx.db.get(args._id);
    if (!spread) {
      throw new Error("Spread not found");
    }

    // Verify ownership
    if (spread.userId !== user._id) {
      throw new Error("Not authorized to update this spread");
    }

    // Validate numberOfCards matches positions array length if both are being updated
    const newNumberOfCards = args.numberOfCards ?? spread.numberOfCards;
    const newPositions = args.positions ?? spread.positions;

    if (newNumberOfCards !== newPositions.length) {
      throw new Error(
        `numberOfCards (${newNumberOfCards}) must match the length of positions array (${newPositions.length})`
      );
    }

    // Validate numberOfCards is between 1 and 78
    if (newNumberOfCards < 1 || newNumberOfCards > 78) {
      throw new Error("numberOfCards must be between 1 and 78");
    }

    // Build update object
    const updates: Partial<Doc<"spreads">> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.numberOfCards !== undefined)
      updates.numberOfCards = args.numberOfCards;
    if (args.positions !== undefined) updates.positions = args.positions;

    await ctx.db.patch(args._id, updates);
    return null;
  },
});

/**
 * Toggle the favorite state of a spread.
 */
export const toggleFavorite = mutation({
  args: {
    _id: v.id("spreads"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const spread = await ctx.db.get(args._id);
    if (!spread) {
      throw new Error("Spread not found");
    }

    if (spread.userId !== user._id) {
      throw new Error("Not authorized to update this spread");
    }

    await ctx.db.patch(args._id, { favorite: !spread.favorite });
    return null;
  },
});

/**
 * List all favorited spreads for the current user.
 */
export const listFavorited = query({
  args: {},
  returns: v.array(spreadValidator.extend({
    _id: v.id("spreads"),
    _creationTime: v.number(),
  })),
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    return await ctx.db
      .query("spreads")
      .withIndex("by_userId_and_favorite", (q) =>
        q.eq("userId", user._id).eq("favorite", true)
      )
      .order("desc")
      .collect();
  },
});

/**
 * Delete a spread.
 */
export const remove = mutation({
  args: {
    _id: v.id("spreads"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const spread = await ctx.db.get(args._id);
    if (!spread) {
      throw new Error("Spread not found");
    }

    // Verify ownership
    if (spread.userId !== user._id) {
      throw new Error("Not authorized to delete this spread");
    }

    await ctx.db.delete(args._id);
    return null;
  },
});
