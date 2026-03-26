import { internalMutation } from "../_generated/server";

/**
 * Backfill migration: patches existing spreads with version, readingCount, and deleted fields.
 * Run once from the Convex dashboard after deploying the schema changes.
 *
 * Usage: Run via dashboard → Functions → migrations/backfillSpreadVersions:default
 */
export default internalMutation({
  args: {},
  handler: async (ctx) => {
    const spreads = await ctx.db.query("spreads").collect();
    let patched = 0;

    for (const spread of spreads) {
      // Skip spreads that already have the version field
      if ((spread as Record<string, unknown>).version !== undefined) continue;

      // Count existing readings referencing this spread
      const readings = await ctx.db
        .query("readings")
        .withIndex("by_spreadId", (q) => q.eq("spread.id", spread._id))
        .collect();

      await ctx.db.patch(spread._id, {
        version: 1,
        readingCount: readings.length,
        deleted: false,
      });
      patched++;
    }

    console.log(`Backfill complete: patched ${patched} spreads`);
  },
});
