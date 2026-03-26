import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";
import { Doc } from "./_generated/dataModel";
import { spreadValidator, spreadVersionValidator } from "./schema";

const spreadsCreateArgs = spreadValidator.omit(
  "userId",
  "updatedAt",
  "favorite",
  "version",
  "readingCount",
  "deleted"
);

const spreadsUpdateArgs = spreadValidator
  .omit("userId", "updatedAt", "favorite", "version", "readingCount", "deleted")
  .partial()
  .extend({ _id: v.id("spreads") });

/**
 * List the most recent 10 spreads for the current user, ordered by updatedAt desc.
 * Excludes soft-deleted spreads.
 */
export const list = query({
  args: {},
  returns: v.array(spreadValidator.extend({
    _id: v.id("spreads"),
    _creationTime: v.number(),
  })),
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const spreads = await ctx.db
      .query("spreads")
      .withIndex("by_userId_and_updatedAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
    return spreads.filter((s) => !s.deleted).slice(0, 10);
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
 * Get a spread snapshot by version.
 * Returns the live spread if version matches current, otherwise fetches from spread_versions.
 */
export const getByVersion = query({
  args: {
    spreadId: v.id("spreads"),
    version: v.number(),
  },
  returns: v.union(
    v.object({
      name: v.string(),
      description: v.optional(v.string()),
      numberOfCards: v.number(),
      positions: spreadValidator.fields.positions,
      version: v.number(),
      isCurrent: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const spread = await ctx.db.get(args.spreadId);
    if (!spread) return null;

    // If version matches current, return live spread data
    if (args.version === spread.version) {
      return {
        name: spread.name,
        description: spread.description,
        numberOfCards: spread.numberOfCards,
        positions: spread.positions,
        version: spread.version,
        isCurrent: true,
      };
    }

    // Otherwise, look up the archived version
    const archived = await ctx.db
      .query("spread_versions")
      .withIndex("by_spreadId_and_version", (q) =>
        q.eq("spreadId", args.spreadId).eq("version", args.version)
      )
      .unique();

    if (!archived) return null;

    return {
      name: archived.name,
      description: archived.description,
      numberOfCards: archived.numberOfCards,
      positions: archived.positions,
      version: archived.version,
      isCurrent: false,
    };
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
      version: 1,
      readingCount: 0,
      deleted: false,
    });

    return spreadId;
  },
});

/**
 * Update an existing spread.
 * Always bumps version when readingCount > 0 so readings can distinguish
 * which layout they were created with. The actual snapshot is created lazily
 * in readings.create (only when a reading pins a version).
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

    // Bump version when readings exist so future readings get a new version number
    if (spread.readingCount > 0) {
      updates.version = spread.version + 1;
    }

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
 * Excludes soft-deleted spreads.
 */
export const listFavorited = query({
  args: {},
  returns: v.array(spreadValidator.extend({
    _id: v.id("spreads"),
    _creationTime: v.number(),
  })),
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const spreads = await ctx.db
      .query("spreads")
      .withIndex("by_userId_and_favorite", (q) =>
        q.eq("userId", user._id).eq("favorite", true)
      )
      .order("desc")
      .collect();
    return spreads.filter((s) => !s.deleted);
  },
});

/**
 * Delete a spread.
 * - If readingCount === 0: hard-delete the spread + all its spread_versions rows
 * - If readingCount > 0 and cascade === true: delete all readings, then hard-delete spread + versions
 * - If readingCount > 0 and cascade === false (default): soft-delete (set deleted: true)
 */
export const remove = mutation({
  args: {
    _id: v.id("spreads"),
    cascade: v.optional(v.boolean()),
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

    const cascade = args.cascade ?? false;

    if (spread.readingCount === 0) {
      // Hard-delete: remove all spread_versions rows, then the spread itself
      const versions = await ctx.db
        .query("spread_versions")
        .withIndex("by_spreadId_and_version", (q) =>
          q.eq("spreadId", spread._id)
        )
        .collect();
      for (const version of versions) {
        await ctx.db.delete(version._id);
      }
      await ctx.db.delete(args._id);
    } else if (cascade) {
      // Cascade delete: delete all readings referencing this spread
      const readings = await ctx.db
        .query("readings")
        .withIndex("by_spreadId", (q) => q.eq("spread.id", spread._id))
        .collect();
      for (const reading of readings) {
        await ctx.db.delete(reading._id);
      }
      // Then delete all spread_versions rows
      const versions = await ctx.db
        .query("spread_versions")
        .withIndex("by_spreadId_and_version", (q) =>
          q.eq("spreadId", spread._id)
        )
        .collect();
      for (const version of versions) {
        await ctx.db.delete(version._id);
      }
      // Then hard-delete the spread
      await ctx.db.delete(args._id);
    } else {
      // Soft-delete: hide from user but keep in DB for reading references
      await ctx.db.patch(args._id, { deleted: true });
    }

    return null;
  },
});
