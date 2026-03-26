import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api } from "../_generated/api";
import { modules, schema } from "./test.setup";
import { Id } from "../_generated/dataModel";

// Helper to create a test user and return authenticated context
async function setupAuthenticatedUser(t: ReturnType<typeof convexTest>) {
  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      authId: "test_user_123",
      tokenIdentifier: "https://clerk.test|test_user_123",
      updatedAt: Date.now(),
      lastSignedIn: Date.now(),
      name: "Test User",
      email: "test@example.com",
      settings: {
        appearance: { theme: "system" },
        preferences: { useReverseMeanings: "auto" },
        notifications: { private: { showToasts: true } },
      },
    });
  });

  const asUser = t.withIdentity({
    subject: "test_user_123",
    issuer: "https://clerk.test",
    tokenIdentifier: "https://clerk.test|test_user_123",
  });

  return { userId, asUser };
}

// Default spread fields for versioning
const SPREAD_DEFAULTS = {
  version: 1,
  readingCount: 0,
  deleted: false,
};

describe("spreads", () => {
  describe("list", () => {
    it("throws error when not authenticated", async () => {
      const t = convexTest(schema, modules);

      await expect(t.query(api.spreads.list)).rejects.toThrowError(
        "Can't get current user"
      );
    });

    it("returns empty array when no spreads exist", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      const spreads = await asUser.query(api.spreads.list);
      expect(spreads).toEqual([]);
    });

    it("returns spreads ordered by updatedAt desc", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const now = Date.now();
      await t.run(async (ctx) => {
        await ctx.db.insert("spreads", {
          userId,
          updatedAt: now - 2000,
          name: "First Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card 1", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
        await ctx.db.insert("spreads", {
          userId,
          updatedAt: now,
          name: "Most Recent Spread",
          numberOfCards: 2,
          positions: [
            { position: 1, name: "Card 1", x: 0, y: 0, r: 0, z: 0 },
            { position: 2, name: "Card 2", x: 100, y: 0, r: 0, z: 1 },
          ],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
        await ctx.db.insert("spreads", {
          userId,
          updatedAt: now - 1000,
          name: "Middle Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card 1", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      const spreads = await asUser.query(api.spreads.list);
      expect(spreads).toHaveLength(3);
      expect(spreads[0].name).toBe("Most Recent Spread");
      expect(spreads[1].name).toBe("Middle Spread");
      expect(spreads[2].name).toBe("First Spread");
    });

    it("only returns spreads for the current user", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      // Create another user with their own spread
      await t.run(async (ctx) => {
        const otherUserId = await ctx.db.insert("users", {
          authId: "other_user",
          tokenIdentifier: "https://clerk.test|other_user",
          updatedAt: Date.now(),
          lastSignedIn: Date.now(),
          name: "Other User",
          email: "other@example.com",
          settings: {
            appearance: { theme: "system" },
            preferences: { useReverseMeanings: "auto" },
            notifications: { private: { showToasts: true } },
          },
        });

        await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "My Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card 1", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
        await ctx.db.insert("spreads", {
          userId: otherUserId,
          updatedAt: Date.now(),
          name: "Other User Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card 1", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      const spreads = await asUser.query(api.spreads.list);
      expect(spreads).toHaveLength(1);
      expect(spreads[0].name).toBe("My Spread");
    });

    it("excludes soft-deleted spreads", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      await t.run(async (ctx) => {
        await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Active Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card 1", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
        await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Deleted Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card 1", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          version: 1,
          readingCount: 1,
          deleted: true,
        });
      });

      const spreads = await asUser.query(api.spreads.list);
      expect(spreads).toHaveLength(1);
      expect(spreads[0].name).toBe("Active Spread");
    });
  });

  describe("getById", () => {
    it("returns a spread by ID", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        return await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Celtic Cross",
          description: "A classic 10-card spread",
          numberOfCards: 3,
          positions: [
            { position: 1, name: "Significator", description: "The querent", x: 0, y: 0, r: 0, z: 0 },
            { position: 2, name: "Crossing", description: "Challenge", x: 50, y: 0, r: 90, z: 1 },
            { position: 3, name: "Foundation", description: "Root cause", x: 0, y: 100, r: 0, z: 2 },
          ],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      const spread = await asUser.query(api.spreads.getById, { _id: spreadId });
      expect(spread).not.toBeNull();
      expect(spread?.name).toBe("Celtic Cross");
      expect(spread?.description).toBe("A classic 10-card spread");
      expect(spread?.positions).toHaveLength(3);
    });

    it("returns null when spread does not exist", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const fakeSpreadId = await t.run(async (ctx) => {
        const tempId = await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Temp",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
        await ctx.db.delete(tempId);
        return tempId;
      });

      const spread = await asUser.query(api.spreads.getById, { _id: fakeSpreadId });
      expect(spread).toBeNull();
    });

    it("throws error when user does not own the spread", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      // Create another user's spread
      const spreadId = await t.run(async (ctx) => {
        const otherUserId = await ctx.db.insert("users", {
          authId: "other_user",
          tokenIdentifier: "https://clerk.test|other_user",
          updatedAt: Date.now(),
          lastSignedIn: Date.now(),
          name: "Other User",
          email: "other@example.com",
          settings: {
            appearance: { theme: "system" },
            preferences: { useReverseMeanings: "auto" },
            notifications: { private: { showToasts: true } },
          },
        });
        return await ctx.db.insert("spreads", {
          userId: otherUserId,
          updatedAt: Date.now(),
          name: "Other Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      await expect(
        asUser.query(api.spreads.getById, { _id: spreadId })
      ).rejects.toThrowError("Not authorized to view this spread");
    });
  });

  describe("create", () => {
    it("creates a new spread with version 1, readingCount 0, deleted false", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await asUser.mutation(api.spreads.create, {
        name: "Three Card Spread",
        description: "Past, Present, Future",
        numberOfCards: 3,
        positions: [
          { position: 1, name: "Past", description: "Past influences", x: 0, y: 0, r: 0, z: 0 },
          { position: 2, name: "Present", description: "Current situation", x: 100, y: 0, r: 0, z: 1 },
          { position: 3, name: "Future", description: "Outcome", x: 200, y: 0, r: 0, z: 2 },
        ],
      });

      expect(spreadId).toBeDefined();

      const spread = await t.run(async (ctx) => {
        return await ctx.db.get(spreadId);
      });

      expect(spread).not.toBeNull();
      expect(spread?.name).toBe("Three Card Spread");
      expect(spread?.description).toBe("Past, Present, Future");
      expect(spread?.numberOfCards).toBe(3);
      expect(spread?.positions).toHaveLength(3);
      expect(spread?.userId).toEqual(userId);
      expect(spread?.version).toBe(1);
      expect(spread?.readingCount).toBe(0);
      expect(spread?.deleted).toBe(false);
    });

    it("creates a spread without optional description", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      const spreadId = await asUser.mutation(api.spreads.create, {
        name: "Simple Spread",
        numberOfCards: 1,
        positions: [
          { position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 },
        ],
      });

      const spread = await t.run(async (ctx) => {
        return await ctx.db.get(spreadId);
      });

      expect(spread?.description).toBeUndefined();
    });

    it("throws error when numberOfCards does not match positions length", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      await expect(
        asUser.mutation(api.spreads.create, {
          name: "Invalid Spread",
          numberOfCards: 5, // Mismatch!
          positions: [
            { position: 1, name: "Card 1", x: 0, y: 0, r: 0, z: 0 },
            { position: 2, name: "Card 2", x: 100, y: 0, r: 0, z: 1 },
          ],
        })
      ).rejects.toThrowError(
        "numberOfCards (5) must match the length of positions array (2)"
      );
    });

    it("throws error when numberOfCards is out of range", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      await expect(
        asUser.mutation(api.spreads.create, {
          name: "Zero Card Spread",
          numberOfCards: 0,
          positions: [],
        })
      ).rejects.toThrowError("numberOfCards must be between 1 and 78");
    });
  });

  describe("update", () => {
    it("updates a spread successfully", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        return await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now() - 1000,
          name: "Original Name",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Original Position", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      await asUser.mutation(api.spreads.update, {
        _id: spreadId,
        name: "Updated Name",
        description: "Added description",
      });

      const spread = await t.run(async (ctx) => {
        return await ctx.db.get(spreadId);
      });

      expect(spread?.name).toBe("Updated Name");
      expect(spread?.description).toBe("Added description");
    });

    it("does not bump version or archive when readingCount is 0", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        return await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "No Readings Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card 1", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      await asUser.mutation(api.spreads.update, {
        _id: spreadId,
        name: "Updated No Readings",
      });

      const spread = await t.run(async (ctx) => {
        return await ctx.db.get(spreadId);
      });

      expect(spread?.name).toBe("Updated No Readings");
      expect(spread?.version).toBe(1); // No version bump

      // Verify no spread_versions rows were created
      const versions = await t.run(async (ctx) => {
        return await ctx.db
          .query("spread_versions")
          .withIndex("by_spreadId_and_version", (q) => q.eq("spreadId", spreadId))
          .collect();
      });
      expect(versions).toHaveLength(0);
    });

    it("bumps version but does not archive when readingCount > 0", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        return await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Original Name",
          description: "Original description",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card 1", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          version: 1,
          readingCount: 2, // Has readings
          deleted: false,
        });
      });

      await asUser.mutation(api.spreads.update, {
        _id: spreadId,
        name: "Updated Name",
      });

      const spread = await t.run(async (ctx) => {
        return await ctx.db.get(spreadId);
      });

      expect(spread?.name).toBe("Updated Name");
      expect(spread?.version).toBe(2); // Version bumped

      // Verify NO archived version was created (archiving happens in readings.create)
      const versions = await t.run(async (ctx) => {
        return await ctx.db
          .query("spread_versions")
          .withIndex("by_spreadId_and_version", (q) => q.eq("spreadId", spreadId))
          .collect();
      });
      expect(versions).toHaveLength(0);
    });

    it("updates numberOfCards and positions together", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        return await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Expandable Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card 1", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      await asUser.mutation(api.spreads.update, {
        _id: spreadId,
        numberOfCards: 2,
        positions: [
          { position: 1, name: "Card 1", x: 0, y: 0, r: 0, z: 0 },
          { position: 2, name: "Card 2", x: 100, y: 0, r: 0, z: 1 },
        ],
      });

      const spread = await t.run(async (ctx) => {
        return await ctx.db.get(spreadId);
      });

      expect(spread?.numberOfCards).toBe(2);
      expect(spread?.positions).toHaveLength(2);
    });

    it("throws error when spread does not exist", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const fakeSpreadId = await t.run(async (ctx) => {
        const tempId = await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Temp",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
        await ctx.db.delete(tempId);
        return tempId;
      });

      await expect(
        asUser.mutation(api.spreads.update, {
          _id: fakeSpreadId,
          name: "Updated",
        })
      ).rejects.toThrowError("Spread not found");
    });

    it("throws error when user does not own the spread", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        const otherUserId = await ctx.db.insert("users", {
          authId: "other_user",
          tokenIdentifier: "https://clerk.test|other_user",
          updatedAt: Date.now(),
          lastSignedIn: Date.now(),
          name: "Other User",
          email: "other@example.com",
          settings: {
            appearance: { theme: "system" },
            preferences: { useReverseMeanings: "auto" },
            notifications: { private: { showToasts: true } },
          },
        });
        return await ctx.db.insert("spreads", {
          userId: otherUserId,
          updatedAt: Date.now(),
          name: "Other Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      await expect(
        asUser.mutation(api.spreads.update, {
          _id: spreadId,
          name: "Trying to update",
        })
      ).rejects.toThrowError("Not authorized to update this spread");
    });

    it("throws error when updating creates numberOfCards/positions mismatch", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        return await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Valid Spread",
          numberOfCards: 2,
          positions: [
            { position: 1, name: "Card 1", x: 0, y: 0, r: 0, z: 0 },
            { position: 2, name: "Card 2", x: 100, y: 0, r: 0, z: 1 },
          ],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      await expect(
        asUser.mutation(api.spreads.update, {
          _id: spreadId,
          numberOfCards: 5, // Mismatch with existing positions
        })
      ).rejects.toThrowError(
        "numberOfCards (5) must match the length of positions array (2)"
      );
    });
  });

  describe("remove", () => {
    it("hard-deletes a spread when readingCount is 0", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        return await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "To be deleted",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      await asUser.mutation(api.spreads.remove, { _id: spreadId });

      const spread = await t.run(async (ctx) => {
        return await ctx.db.get(spreadId);
      });

      expect(spread).toBeNull();
    });

    it("hard-deletes spread_versions rows when readingCount is 0", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        const id = await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Versioned Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
        // Create a version row (from a past edit when it had readings)
        await ctx.db.insert("spread_versions", {
          spreadId: id,
          version: 1,
          name: "Old Name",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          archivedAt: Date.now(),
        });
        return id;
      });

      await asUser.mutation(api.spreads.remove, { _id: spreadId });

      const versions = await t.run(async (ctx) => {
        return await ctx.db
          .query("spread_versions")
          .withIndex("by_spreadId_and_version", (q) => q.eq("spreadId", spreadId))
          .collect();
      });
      expect(versions).toHaveLength(0);
    });

    it("soft-deletes when readingCount > 0 and cascade is false", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        return await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Spread with readings",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          version: 1,
          readingCount: 2,
          deleted: false,
        });
      });

      await asUser.mutation(api.spreads.remove, { _id: spreadId, cascade: false });

      const spread = await t.run(async (ctx) => {
        return await ctx.db.get(spreadId);
      });

      // Spread still exists but is marked as deleted
      expect(spread).not.toBeNull();
      expect(spread?.deleted).toBe(true);
    });

    it("cascade-deletes all readings, versions, and spread when cascade is true", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const { spreadId, readingId1, readingId2 } = await t.run(async (ctx) => {
        const spreadId = await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Spread to cascade",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          version: 2,
          readingCount: 2,
          deleted: false,
        });
        // Create an archived version
        await ctx.db.insert("spread_versions", {
          spreadId,
          version: 1,
          name: "Old Name",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          archivedAt: Date.now(),
        });
        // Create readings referencing this spread
        const readingId1 = await ctx.db.insert("readings", {
          userId,
          updatedAt: Date.now(),
          question: "Reading 1",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: false,
        });
        const readingId2 = await ctx.db.insert("readings", {
          userId,
          updatedAt: Date.now(),
          question: "Reading 2",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: spreadId, version: 2 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: false,
        });
        return { spreadId, readingId1, readingId2 };
      });

      await asUser.mutation(api.spreads.remove, { _id: spreadId, cascade: true });

      // Verify everything is deleted
      const [spread, reading1, reading2, versions] = await t.run(async (ctx) => {
        return [
          await ctx.db.get(spreadId),
          await ctx.db.get(readingId1),
          await ctx.db.get(readingId2),
          await ctx.db
            .query("spread_versions")
            .withIndex("by_spreadId_and_version", (q) => q.eq("spreadId", spreadId))
            .collect(),
        ] as const;
      });

      expect(spread).toBeNull();
      expect(reading1).toBeNull();
      expect(reading2).toBeNull();
      expect(versions).toHaveLength(0);
    });

    it("throws error when spread does not exist", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const fakeSpreadId = await t.run(async (ctx) => {
        const tempId = await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Temp",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
        await ctx.db.delete(tempId);
        return tempId;
      });

      await expect(
        asUser.mutation(api.spreads.remove, { _id: fakeSpreadId })
      ).rejects.toThrowError("Spread not found");
    });

    it("throws error when user does not own the spread", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        const otherUserId = await ctx.db.insert("users", {
          authId: "other_user",
          tokenIdentifier: "https://clerk.test|other_user",
          updatedAt: Date.now(),
          lastSignedIn: Date.now(),
          name: "Other User",
          email: "other@example.com",
          settings: {
            appearance: { theme: "system" },
            preferences: { useReverseMeanings: "auto" },
            notifications: { private: { showToasts: true } },
          },
        });
        return await ctx.db.insert("spreads", {
          userId: otherUserId,
          updatedAt: Date.now(),
          name: "Other Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      await expect(
        asUser.mutation(api.spreads.remove, { _id: spreadId })
      ).rejects.toThrowError("Not authorized to delete this spread");
    });
  });

  describe("getByVersion", () => {
    it("returns current spread for latest version", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        return await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Current Spread",
          description: "Current description",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card 1", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          version: 3,
          readingCount: 1,
          deleted: false,
        });
      });

      const result = await asUser.query(api.spreads.getByVersion, {
        spreadId,
        version: 3,
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Current Spread");
      expect(result?.version).toBe(3);
      expect(result?.isCurrent).toBe(true);
    });

    it("returns archived snapshot for older version", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        const id = await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Updated Spread",
          numberOfCards: 2,
          positions: [
            { position: 1, name: "New Card 1", x: 0, y: 0, r: 0, z: 0 },
            { position: 2, name: "New Card 2", x: 100, y: 0, r: 0, z: 1 },
          ],
          favorite: false,
          version: 2,
          readingCount: 1,
          deleted: false,
        });
        // Create the v1 archived snapshot
        await ctx.db.insert("spread_versions", {
          spreadId: id,
          version: 1,
          name: "Original Spread",
          description: "Original description",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Old Card 1", x: 0, y: 0, r: 0, z: 0 }],
          archivedAt: Date.now(),
        });
        return id;
      });

      const result = await asUser.query(api.spreads.getByVersion, {
        spreadId,
        version: 1,
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Original Spread");
      expect(result?.description).toBe("Original description");
      expect(result?.numberOfCards).toBe(1);
      expect(result?.version).toBe(1);
      expect(result?.isCurrent).toBe(false);
    });

    it("returns null for non-existent version", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        return await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      const result = await asUser.query(api.spreads.getByVersion, {
        spreadId,
        version: 99,
      });

      expect(result).toBeNull();
    });

    it("works for soft-deleted spreads (readings still need layout)", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        return await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Deleted Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          version: 1,
          readingCount: 1,
          deleted: true, // Soft-deleted
        });
      });

      const result = await asUser.query(api.spreads.getByVersion, {
        spreadId,
        version: 1,
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Deleted Spread");
      expect(result?.isCurrent).toBe(true);
    });

    it("throws error when user does not own the spread", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        const otherUserId = await ctx.db.insert("users", {
          authId: "other_user",
          tokenIdentifier: "https://clerk.test|other_user",
          updatedAt: Date.now(),
          lastSignedIn: Date.now(),
          name: "Other User",
          email: "other@example.com",
          settings: {
            appearance: { theme: "system" },
            preferences: { useReverseMeanings: "auto" },
            notifications: { private: { showToasts: true } },
          },
        });

        return await ctx.db.insert("spreads", {
          userId: otherUserId,
          updatedAt: Date.now(),
          name: "Other Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          version: 1,
          readingCount: 0,
          deleted: false,
        });
      });

      await expect(
        asUser.query(api.spreads.getByVersion, {
          spreadId,
          version: 1,
        })
      ).rejects.toThrowError("Not authorized to view this spread");
    });
  });

  describe("toggleFavorite", () => {
    it("toggles favorite from false to true", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        return await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "My Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      await asUser.mutation(api.spreads.toggleFavorite, { _id: spreadId });

      const spread = await t.run(async (ctx) => ctx.db.get(spreadId));
      expect(spread?.favorite).toBe(true);
    });

    it("toggles favorite from true back to false", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        return await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Favorited Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: true,
          ...SPREAD_DEFAULTS,
        });
      });

      await asUser.mutation(api.spreads.toggleFavorite, { _id: spreadId });

      const spread = await t.run(async (ctx) => ctx.db.get(spreadId));
      expect(spread?.favorite).toBe(false);
    });

    it("throws error when spread does not exist", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const fakeSpreadId = await t.run(async (ctx) => {
        const tempId = await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Temp",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
        await ctx.db.delete(tempId);
        return tempId;
      });

      await expect(
        asUser.mutation(api.spreads.toggleFavorite, { _id: fakeSpreadId })
      ).rejects.toThrowError("Spread not found");
    });

    it("throws error when user does not own the spread", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        const otherUserId = await ctx.db.insert("users", {
          authId: "other_user",
          tokenIdentifier: "https://clerk.test|other_user",
          updatedAt: Date.now(),
          lastSignedIn: Date.now(),
          name: "Other User",
          email: "other@example.com",
          settings: {
            appearance: { theme: "system" },
            preferences: { useReverseMeanings: "auto" },
            notifications: { private: { showToasts: true } },
          },
        });
        return await ctx.db.insert("spreads", {
          userId: otherUserId,
          updatedAt: Date.now(),
          name: "Other Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      await expect(
        asUser.mutation(api.spreads.toggleFavorite, { _id: spreadId })
      ).rejects.toThrowError("Not authorized to update this spread");
    });
  });

  describe("listFavorited", () => {
    it("throws error when not authenticated", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.query(api.spreads.listFavorited)
      ).rejects.toThrowError("Can't get current user");
    });

    it("returns empty array when no spreads are favorited", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      await t.run(async (ctx) => {
        await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Not Favorited",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      const favorited = await asUser.query(api.spreads.listFavorited);
      expect(favorited).toEqual([]);
    });

    it("returns only favorited spreads for the current user", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      await t.run(async (ctx) => {
        await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Favorited Spread",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: true,
          ...SPREAD_DEFAULTS,
        });
        await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Not Favorited",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: false,
          ...SPREAD_DEFAULTS,
        });
      });

      const favorited = await asUser.query(api.spreads.listFavorited);
      expect(favorited).toHaveLength(1);
      expect(favorited[0].name).toBe("Favorited Spread");
    });

    it("excludes soft-deleted favorited spreads", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      await t.run(async (ctx) => {
        await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Active Fav",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: true,
          ...SPREAD_DEFAULTS,
        });
        await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Deleted Fav",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: true,
          version: 1,
          readingCount: 1,
          deleted: true,
        });
      });

      const favorited = await asUser.query(api.spreads.listFavorited);
      expect(favorited).toHaveLength(1);
      expect(favorited[0].name).toBe("Active Fav");
    });

    it("does not return another user's favorited spreads", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      await t.run(async (ctx) => {
        const otherUserId = await ctx.db.insert("users", {
          authId: "other_user",
          tokenIdentifier: "https://clerk.test|other_user",
          updatedAt: Date.now(),
          lastSignedIn: Date.now(),
          name: "Other User",
          email: "other@example.com",
          settings: {
            appearance: { theme: "system" },
            preferences: { useReverseMeanings: "auto" },
            notifications: { private: { showToasts: true } },
          },
        });
        await ctx.db.insert("spreads", {
          userId: otherUserId,
          updatedAt: Date.now(),
          name: "Other User Favorited",
          numberOfCards: 1,
          positions: [{ position: 1, name: "Card", x: 0, y: 0, r: 0, z: 0 }],
          favorite: true,
          ...SPREAD_DEFAULTS,
        });
      });

      const favorited = await asUser.query(api.spreads.listFavorited);
      expect(favorited).toEqual([]);
    });
  });
});
