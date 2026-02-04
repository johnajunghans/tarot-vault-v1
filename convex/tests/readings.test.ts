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

// Helper to create a spread for testing readings
async function createTestSpread(
  t: ReturnType<typeof convexTest>,
  userId: Id<"users">
) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("spreads", {
      userId,
      updatedAt: Date.now(),
      name: "Test Spread",
      description: "A test spread",
      numberOfCards: 3,
      positions: [
        { name: "Past", description: "Past influences", transform: { x: 0, y: 0, r: 0, z: 0 } },
        { name: "Present", description: "Current situation", transform: { x: 100, y: 0, r: 0, z: 1 } },
        { name: "Future", description: "Future outcome", transform: { x: 200, y: 0, r: 0, z: 2 } },
      ],
    });
  });
}

describe("readings", () => {
  describe("list", () => {
    it("throws error when not authenticated", async () => {
      const t = convexTest(schema, modules);

      await expect(t.query(api.tables.readings.list)).rejects.toThrowError(
        "Can't get current user"
      );
    });

    it("returns empty array when no readings exist", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      const readings = await asUser.query(api.tables.readings.list);
      expect(readings).toEqual([]);
    });

    it("returns readings ordered by updatedAt desc", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const spreadId = await createTestSpread(t, userId);

      // Create multiple readings with different updatedAt times
      const now = Date.now();
      await t.run(async (ctx) => {
        await ctx.db.insert("readings", {
          userId,
          updatedAt: now - 2000,
          question: "First question",
          date: now - 2000,
          drawMethod: "digital",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [{ id: 0, reversed: false, notes: "" }] },
          starred: false,
        });
        await ctx.db.insert("readings", {
          userId,
          updatedAt: now,
          question: "Most recent question",
          date: now,
          drawMethod: "manual",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: false,
          useSignifierCard: false,
          results: { cards: [{ id: 1, reversed: true, notes: "" }] },
          starred: false,
        });
        await ctx.db.insert("readings", {
          userId,
          updatedAt: now - 1000,
          question: "Middle question",
          date: now - 1000,
          drawMethod: "digital",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: true,
          results: { cards: [{ id: 2, reversed: false, notes: "" }] },
          starred: false,
        });
      });

      const readings = await asUser.query(api.tables.readings.list);
      expect(readings).toHaveLength(3);
      expect(readings[0].question).toBe("Most recent question");
      expect(readings[1].question).toBe("Middle question");
      expect(readings[2].question).toBe("First question");
    });

    it("only returns readings for the current user", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const spreadId = await createTestSpread(t, userId);

      // Create another user with their own reading
      const otherUserId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
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
      });

      await t.run(async (ctx) => {
        // Current user's reading
        await ctx.db.insert("readings", {
          userId,
          updatedAt: Date.now(),
          question: "My question",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: false,
        });
        // Other user's reading
        await ctx.db.insert("readings", {
          userId: otherUserId,
          updatedAt: Date.now(),
          question: "Other user question",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: false,
        });
      });

      const readings = await asUser.query(api.tables.readings.list);
      expect(readings).toHaveLength(1);
      expect(readings[0].question).toBe("My question");
    });
  });

  describe("listStarred", () => {
    it("returns only starred readings", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const spreadId = await createTestSpread(t, userId);

      await t.run(async (ctx) => {
        await ctx.db.insert("readings", {
          userId,
          updatedAt: Date.now(),
          question: "Starred reading",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: true,
        });
        await ctx.db.insert("readings", {
          userId,
          updatedAt: Date.now(),
          question: "Not starred",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: false,
        });
      });

      const readings = await asUser.query(api.tables.readings.listStarred);
      expect(readings).toHaveLength(1);
      expect(readings[0].question).toBe("Starred reading");
      expect(readings[0].starred).toBe(true);
    });
  });

  describe("create", () => {
    it("creates a new reading successfully", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const spreadId = await createTestSpread(t, userId);

      const readingId = await asUser.mutation(api.tables.readings.create, {
        question: "What does the future hold?",
        date: Date.now(),
        drawMethod: "digital",
        spread: { id: spreadId, version: 1 },
        useReverseMeanings: true,
        useSignifierCard: false,
        results: {
          cards: [
            { id: 0, position: 1, reversed: false, notes: "The Fool" },
            { id: 1, position: 2, reversed: true, notes: "The Magician" },
            { id: 2, position: 3, reversed: false, notes: "The High Priestess" },
          ],
        },
        starred: false,
      });

      expect(readingId).toBeDefined();

      // Verify the reading was created
      const reading = await t.run(async (ctx) => {
        return await ctx.db.get(readingId);
      });

      expect(reading).not.toBeNull();
      expect(reading?.question).toBe("What does the future hold?");
      expect(reading?.userId).toEqual(userId);
      expect(reading?.results.cards).toHaveLength(3);
    });

    it("creates a reading with optional fields", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const spreadId = await createTestSpread(t, userId);

      const readingId = await asUser.mutation(api.tables.readings.create, {
        question: "Question with context",
        date: Date.now(),
        drawMethod: "manual",
        spread: { id: spreadId, version: 1 },
        useReverseMeanings: false,
        useSignifierCard: true,
        results: {
          signifier: { id: 10, reversed: false, notes: "Signifier card" },
          cards: [{ id: 5, position: 1, reversed: false, notes: "" }],
        },
        title: "My Important Reading",
        context: "I am facing a difficult decision",
        notes: "Some notes about this reading",
        starred: true,
      });

      const reading = await t.run(async (ctx) => {
        return await ctx.db.get(readingId);
      });

      expect(reading?.title).toBe("My Important Reading");
      expect(reading?.context).toBe("I am facing a difficult decision");
      expect(reading?.notes).toBe("Some notes about this reading");
      expect(reading?.starred).toBe(true);
      expect(reading?.results.signifier).toBeDefined();
    });

    it("throws error when spread does not exist", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      // Create a fake spread ID
      const fakeSpreadId = await t.run(async (ctx) => {
        const tempId = await ctx.db.insert("spreads", {
          userId: (await ctx.db.query("users").first())!._id,
          updatedAt: Date.now(),
          name: "Temp",
          numberOfCards: 1,
          positions: [{ name: "Temp", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
        await ctx.db.delete(tempId);
        return tempId;
      });

      await expect(
        asUser.mutation(api.tables.readings.create, {
          question: "Test question",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: fakeSpreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: false,
        })
      ).rejects.toThrowError("Spread not found");
    });
  });

  describe("update", () => {
    it("updates a reading successfully", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const spreadId = await createTestSpread(t, userId);

      const readingId = await t.run(async (ctx) => {
        return await ctx.db.insert("readings", {
          userId,
          updatedAt: Date.now() - 1000,
          question: "Original question",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: false,
        });
      });

      await asUser.mutation(api.tables.readings.update, {
        _id: readingId,
        question: "Updated question",
        starred: true,
        notes: "Added some notes",
      });

      const reading = await t.run(async (ctx) => {
        return await ctx.db.get(readingId);
      });

      expect(reading?.question).toBe("Updated question");
      expect(reading?.starred).toBe(true);
      expect(reading?.notes).toBe("Added some notes");
    });

    it("throws error when reading does not exist", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const fakeReadingId = await t.run(async (ctx) => {
        const spreadId = await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Temp",
          numberOfCards: 1,
          positions: [{ name: "Temp", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
        const tempId = await ctx.db.insert("readings", {
          userId,
          updatedAt: Date.now(),
          question: "Temp",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: false,
        });
        await ctx.db.delete(tempId);
        return tempId;
      });

      await expect(
        asUser.mutation(api.tables.readings.update, {
          _id: fakeReadingId,
          question: "Updated",
        })
      ).rejects.toThrowError("Reading not found");
    });

    it("throws error when user does not own the reading", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      // Create another user and their reading
      const { readingId } = await t.run(async (ctx) => {
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
        const spreadId = await ctx.db.insert("spreads", {
          userId: otherUserId,
          updatedAt: Date.now(),
          name: "Other Spread",
          numberOfCards: 1,
          positions: [{ name: "Pos", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
        const readingId = await ctx.db.insert("readings", {
          userId: otherUserId,
          updatedAt: Date.now(),
          question: "Other user question",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: false,
        });
        return { readingId };
      });

      await expect(
        asUser.mutation(api.tables.readings.update, {
          _id: readingId,
          question: "Trying to update",
        })
      ).rejects.toThrowError("Not authorized to update this reading");
    });
  });

  describe("remove", () => {
    it("deletes a reading successfully", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const spreadId = await createTestSpread(t, userId);

      const readingId = await t.run(async (ctx) => {
        return await ctx.db.insert("readings", {
          userId,
          updatedAt: Date.now(),
          question: "To be deleted",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: false,
        });
      });

      await asUser.mutation(api.tables.readings.remove, { _id: readingId });

      const reading = await t.run(async (ctx) => {
        return await ctx.db.get(readingId);
      });

      expect(reading).toBeNull();
    });

    it("throws error when reading does not exist", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const fakeReadingId = await t.run(async (ctx) => {
        const spreadId = await ctx.db.insert("spreads", {
          userId,
          updatedAt: Date.now(),
          name: "Temp",
          numberOfCards: 1,
          positions: [{ name: "Temp", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
        const tempId = await ctx.db.insert("readings", {
          userId,
          updatedAt: Date.now(),
          question: "Temp",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: false,
        });
        await ctx.db.delete(tempId);
        return tempId;
      });

      await expect(
        asUser.mutation(api.tables.readings.remove, { _id: fakeReadingId })
      ).rejects.toThrowError("Reading not found");
    });

    it("throws error when user does not own the reading", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      // Create another user's reading
      const readingId = await t.run(async (ctx) => {
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
        const spreadId = await ctx.db.insert("spreads", {
          userId: otherUserId,
          updatedAt: Date.now(),
          name: "Other Spread",
          numberOfCards: 1,
          positions: [{ name: "Pos", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
        return await ctx.db.insert("readings", {
          userId: otherUserId,
          updatedAt: Date.now(),
          question: "Other user question",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: false,
        });
      });

      await expect(
        asUser.mutation(api.tables.readings.remove, { _id: readingId })
      ).rejects.toThrowError("Not authorized to delete this reading");
    });
  });
});
