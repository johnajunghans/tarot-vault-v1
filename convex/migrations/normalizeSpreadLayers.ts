import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import {
  normalizePositionLayers,
  positionsHaveCanonicalLayers,
} from "../layers";

export const normalizeSpreads = internalMutation({
  args: {
    dryRun: v.boolean(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.query("spreads").paginate(args.paginationOpts);
    let changed = 0;

    for (const spread of page.page) {
      if (positionsHaveCanonicalLayers(spread.positions)) continue;

      changed++;
      if (!args.dryRun) {
        await ctx.db.patch(spread._id, {
          positions: normalizePositionLayers(spread.positions),
        });
      }
    }

    return {
      table: "spreads",
      scanned: page.page.length,
      changed,
      dryRun: args.dryRun,
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  },
});

export const normalizeSpreadVersions = internalMutation({
  args: {
    dryRun: v.boolean(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.query("spread_versions").paginate(args.paginationOpts);
    let changed = 0;

    for (const version of page.page) {
      if (positionsHaveCanonicalLayers(version.positions)) continue;

      changed++;
      if (!args.dryRun) {
        await ctx.db.patch(version._id, {
          positions: normalizePositionLayers(version.positions),
        });
      }
    }

    return {
      table: "spread_versions",
      scanned: page.page.length,
      changed,
      dryRun: args.dryRun,
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  },
});
