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

describe("spreads", () => {
  describe("list", () => {
    it("throws error when not authenticated", async () => {
      const t = convexTest(schema, modules);

      await expect(t.query(api.tables.spreads.list)).rejects.toThrowError(
        "Can't get current user"
      );
    });

    it("returns empty array when no spreads exist", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      const spreads = await asUser.query(api.tables.spreads.list);
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
          positions: [{ name: "Card 1", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
        await ctx.db.insert("spreads", {
          userId,
          updatedAt: now,
          name: "Most Recent Spread",
          numberOfCards: 2,
          positions: [
            { name: "Card 1", transform: { x: 0, y: 0, r: 0, z: 0 } },
            { name: "Card 2", transform: { x: 100, y: 0, r: 0, z: 1 } },
          ],
        });
        await ctx.db.insert("spreads", {
          userId,
          updatedAt: now - 1000,
          name: "Middle Spread",
          numberOfCards: 1,
          positions: [{ name: "Card 1", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
      });

      const spreads = await asUser.query(api.tables.spreads.list);
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
          positions: [{ name: "Card 1", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
        await ctx.db.insert("spreads", {
          userId: otherUserId,
          updatedAt: Date.now(),
          name: "Other User Spread",
          numberOfCards: 1,
          positions: [{ name: "Card 1", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
      });

      const spreads = await asUser.query(api.tables.spreads.list);
      expect(spreads).toHaveLength(1);
      expect(spreads[0].name).toBe("My Spread");
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
            { name: "Significator", description: "The querent", transform: { x: 0, y: 0, r: 0, z: 0 } },
            { name: "Crossing", description: "Challenge", transform: { x: 50, y: 0, r: 90, z: 1 } },
            { name: "Foundation", description: "Root cause", transform: { x: 0, y: 100, r: 0, z: 2 } },
          ],
        });
      });

      const spread = await asUser.query(api.tables.spreads.getById, { _id: spreadId });
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
          positions: [{ name: "Card", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
        await ctx.db.delete(tempId);
        return tempId;
      });

      const spread = await asUser.query(api.tables.spreads.getById, { _id: fakeSpreadId });
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
          positions: [{ name: "Card", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
      });

      await expect(
        asUser.query(api.tables.spreads.getById, { _id: spreadId })
      ).rejects.toThrowError("Not authorized to view this spread");
    });
  });

  describe("create", () => {
    it("creates a new spread successfully", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await asUser.mutation(api.tables.spreads.create, {
        name: "Three Card Spread",
        description: "Past, Present, Future",
        numberOfCards: 3,
        positions: [
          { name: "Past", description: "Past influences", transform: { x: 0, y: 0, r: 0, z: 0 } },
          { name: "Present", description: "Current situation", transform: { x: 100, y: 0, r: 0, z: 1 } },
          { name: "Future", description: "Outcome", transform: { x: 200, y: 0, r: 0, z: 2 } },
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
    });

    it("creates a spread without optional description", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      const spreadId = await asUser.mutation(api.tables.spreads.create, {
        name: "Simple Spread",
        numberOfCards: 1,
        positions: [
          { name: "Card", transform: { x: 0, y: 0, r: 0, z: 0 } },
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
        asUser.mutation(api.tables.spreads.create, {
          name: "Invalid Spread",
          numberOfCards: 5, // Mismatch!
          positions: [
            { name: "Card 1", transform: { x: 0, y: 0, r: 0, z: 0 } },
            { name: "Card 2", transform: { x: 100, y: 0, r: 0, z: 1 } },
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
        asUser.mutation(api.tables.spreads.create, {
          name: "Zero Card Spread",
          numberOfCards: 0,
          positions: [],
        })
      ).rejects.toThrowError("numberOfCards must be between 1 and 78");

      // Note: Testing 79 cards would require creating 79 position objects
      // which is impractical, so we skip that edge case
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
          positions: [{ name: "Original Position", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
      });

      await asUser.mutation(api.tables.spreads.update, {
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

    it("updates numberOfCards and positions together", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        return await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Expandable Spread",
          numberOfCards: 1,
          positions: [{ name: "Card 1", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
      });

      await asUser.mutation(api.tables.spreads.update, {
        _id: spreadId,
        numberOfCards: 2,
        positions: [
          { name: "Card 1", transform: { x: 0, y: 0, r: 0, z: 0 } },
          { name: "Card 2", transform: { x: 100, y: 0, r: 0, z: 1 } },
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
          positions: [{ name: "Card", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
        await ctx.db.delete(tempId);
        return tempId;
      });

      await expect(
        asUser.mutation(api.tables.spreads.update, {
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
          positions: [{ name: "Card", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
      });

      await expect(
        asUser.mutation(api.tables.spreads.update, {
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
            { name: "Card 1", transform: { x: 0, y: 0, r: 0, z: 0 } },
            { name: "Card 2", transform: { x: 100, y: 0, r: 0, z: 1 } },
          ],
        });
      });

      await expect(
        asUser.mutation(api.tables.spreads.update, {
          _id: spreadId,
          numberOfCards: 5, // Mismatch with existing positions
        })
      ).rejects.toThrowError(
        "numberOfCards (5) must match the length of positions array (2)"
      );
    });
  });

  describe("remove", () => {
    it("deletes a spread successfully", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const spreadId = await t.run(async (ctx) => {
        return await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "To be deleted",
          numberOfCards: 1,
          positions: [{ name: "Card", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
      });

      await asUser.mutation(api.tables.spreads.remove, { _id: spreadId });

      const spread = await t.run(async (ctx) => {
        return await ctx.db.get(spreadId);
      });

      expect(spread).toBeNull();
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
          positions: [{ name: "Card", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
        await ctx.db.delete(tempId);
        return tempId;
      });

      await expect(
        asUser.mutation(api.tables.spreads.remove, { _id: fakeSpreadId })
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
          positions: [{ name: "Card", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
      });

      await expect(
        asUser.mutation(api.tables.spreads.remove, { _id: spreadId })
      ).rejects.toThrowError("Not authorized to delete this spread");
    });
  });
});
