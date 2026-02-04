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

// Helper to create a reading for testing interpretations
async function createTestReading(
  t: ReturnType<typeof convexTest>,
  userId: Id<"users">
) {
  return await t.run(async (ctx) => {
    const spreadId = await ctx.db.insert("spreads", {
      userId,
      updatedAt: Date.now(),
      name: "Test Spread",
      numberOfCards: 1,
      positions: [{ name: "Card 1", transform: { x: 0, y: 0, r: 0, z: 0 } }],
    });

    return await ctx.db.insert("readings", {
      userId,
      updatedAt: Date.now(),
      question: "Test question",
      date: Date.now(),
      drawMethod: "digital",
      spread: { id: spreadId, version: 1 },
      useReverseMeanings: true,
      useSignifierCard: false,
      results: { cards: [{ id: 0, reversed: false, notes: "" }] },
      starred: false,
    });
  });
}

describe("interpretations", () => {
  describe("list", () => {
    it("throws error when not authenticated", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.query(api.tables.interpretations.list)
      ).rejects.toThrowError("Can't get current user");
    });

    it("returns empty array when no interpretations exist", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      const interpretations = await asUser.query(
        api.tables.interpretations.list
      );
      expect(interpretations).toEqual([]);
    });

    it("returns interpretations ordered by updatedAt desc", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const readingId = await createTestReading(t, userId);

      const now = Date.now();
      await t.run(async (ctx) => {
        await ctx.db.insert("interpretations", {
          userId,
          readingId,
          updatedAt: now - 2000,
          content: "First interpretation",
          source: "self",
        });
        await ctx.db.insert("interpretations", {
          userId,
          readingId,
          updatedAt: now,
          content: "Most recent interpretation",
          source: "ai",
          aiMetadata: {
            tier: "free",
            model: { name: "gpt-4", version: "1.0" },
            requestTime: now,
            totalCost: 0.01,
            tokensUsed: 100,
          },
        });
        await ctx.db.insert("interpretations", {
          userId,
          readingId,
          updatedAt: now - 1000,
          content: "Middle interpretation",
          source: "self",
        });
      });

      const interpretations = await asUser.query(
        api.tables.interpretations.list
      );
      expect(interpretations).toHaveLength(3);
      expect(interpretations[0].content).toBe("Most recent interpretation");
      expect(interpretations[1].content).toBe("Middle interpretation");
      expect(interpretations[2].content).toBe("First interpretation");
    });

    it("only returns interpretations for the current user", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const readingId = await createTestReading(t, userId);

      await t.run(async (ctx) => {
        // Create another user with their own interpretation
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
        const otherSpreadId = await ctx.db.insert("spreads", {
          userId: otherUserId,
          updatedAt: Date.now(),
          name: "Other Spread",
          numberOfCards: 1,
          positions: [{ name: "Card", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
        const otherReadingId = await ctx.db.insert("readings", {
          userId: otherUserId,
          updatedAt: Date.now(),
          question: "Other question",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: otherSpreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: false,
        });

        // Current user's interpretation
        await ctx.db.insert("interpretations", {
          userId,
          readingId,
          updatedAt: Date.now(),
          content: "My interpretation",
          source: "self",
        });
        // Other user's interpretation
        await ctx.db.insert("interpretations", {
          userId: otherUserId,
          readingId: otherReadingId,
          updatedAt: Date.now(),
          content: "Other user interpretation",
          source: "self",
        });
      });

      const interpretations = await asUser.query(
        api.tables.interpretations.list
      );
      expect(interpretations).toHaveLength(1);
      expect(interpretations[0].content).toBe("My interpretation");
    });
  });

  describe("listByReading", () => {
    it("returns interpretations for a specific reading", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const readingId1 = await createTestReading(t, userId);
      const readingId2 = await createTestReading(t, userId);

      await t.run(async (ctx) => {
        await ctx.db.insert("interpretations", {
          userId,
          readingId: readingId1,
          updatedAt: Date.now(),
          content: "Interpretation for reading 1",
          source: "self",
        });
        await ctx.db.insert("interpretations", {
          userId,
          readingId: readingId2,
          updatedAt: Date.now(),
          content: "Interpretation for reading 2",
          source: "ai",
          aiMetadata: {
            tier: "premium",
            model: { name: "gpt-4", version: "1.0" },
            requestTime: Date.now(),
            totalCost: 0.05,
            tokensUsed: 500,
          },
        });
      });

      const interpretations = await asUser.query(
        api.tables.interpretations.listByReading,
        { readingId: readingId1 }
      );
      expect(interpretations).toHaveLength(1);
      expect(interpretations[0].content).toBe("Interpretation for reading 1");
    });

    it("throws error when reading does not exist", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const fakeReadingId = await t.run(async (ctx) => {
        const readingId = await createTestReading(
          { run: async (fn) => fn(ctx) } as ReturnType<typeof convexTest>,
          userId
        );
        await ctx.db.delete(readingId);
        return readingId;
      });

      await expect(
        asUser.query(api.tables.interpretations.listByReading, {
          readingId: fakeReadingId,
        })
      ).rejects.toThrowError("Reading not found");
    });

    it("throws error when user does not own the reading", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      const otherReadingId = await t.run(async (ctx) => {
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
          positions: [{ name: "Card", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
        return await ctx.db.insert("readings", {
          userId: otherUserId,
          updatedAt: Date.now(),
          question: "Other question",
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
        asUser.query(api.tables.interpretations.listByReading, {
          readingId: otherReadingId,
        })
      ).rejects.toThrowError(
        "Not authorized to view interpretations for this reading"
      );
    });
  });

  describe("listBySource", () => {
    it("returns only self interpretations when source is self", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const readingId = await createTestReading(t, userId);

      await t.run(async (ctx) => {
        await ctx.db.insert("interpretations", {
          userId,
          readingId,
          updatedAt: Date.now(),
          content: "Self interpretation",
          source: "self",
        });
        await ctx.db.insert("interpretations", {
          userId,
          readingId,
          updatedAt: Date.now(),
          content: "AI interpretation",
          source: "ai",
          aiMetadata: {
            tier: "free",
            model: { name: "gpt-4", version: "1.0" },
            requestTime: Date.now(),
            totalCost: 0.01,
            tokensUsed: 100,
          },
        });
      });

      const selfInterpretations = await asUser.query(
        api.tables.interpretations.listBySource,
        { source: "self" }
      );
      expect(selfInterpretations).toHaveLength(1);
      expect(selfInterpretations[0].source).toBe("self");
      expect(selfInterpretations[0].content).toBe("Self interpretation");
    });

    it("returns only ai interpretations when source is ai", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const readingId = await createTestReading(t, userId);

      await t.run(async (ctx) => {
        await ctx.db.insert("interpretations", {
          userId,
          readingId,
          updatedAt: Date.now(),
          content: "Self interpretation",
          source: "self",
        });
        await ctx.db.insert("interpretations", {
          userId,
          readingId,
          updatedAt: Date.now(),
          content: "AI interpretation",
          source: "ai",
          aiMetadata: {
            tier: "premium",
            model: { name: "gpt-4", version: "1.0" },
            requestTime: Date.now(),
            totalCost: 0.05,
            tokensUsed: 500,
          },
        });
      });

      const aiInterpretations = await asUser.query(
        api.tables.interpretations.listBySource,
        { source: "ai" }
      );
      expect(aiInterpretations).toHaveLength(1);
      expect(aiInterpretations[0].source).toBe("ai");
      expect(aiInterpretations[0].content).toBe("AI interpretation");
    });
  });

  describe("create", () => {
    it("creates a self interpretation successfully", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const readingId = await createTestReading(t, userId);

      const interpretationId = await asUser.mutation(
        api.tables.interpretations.create,
        {
          readingId,
          content: "This reading suggests new beginnings...",
          source: "self",
          focus: "career",
        }
      );

      expect(interpretationId).toBeDefined();

      const interpretation = await t.run(async (ctx) => {
        return await ctx.db.get(interpretationId);
      });

      expect(interpretation).not.toBeNull();
      expect(interpretation?.content).toBe(
        "This reading suggests new beginnings..."
      );
      expect(interpretation?.source).toBe("self");
      expect(interpretation?.focus).toBe("career");
      expect(interpretation?.userId).toEqual(userId);
      expect(interpretation?.readingId).toEqual(readingId);
    });

    it("creates an ai interpretation with metadata", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const readingId = await createTestReading(t, userId);

      const now = Date.now();
      const interpretationId = await asUser.mutation(
        api.tables.interpretations.create,
        {
          readingId,
          content: "AI generated interpretation...",
          source: "ai",
          aiMetadata: {
            tier: "premium",
            model: { name: "gpt-4o", version: "2024-01" },
            requestTime: now,
            totalCost: 0.025,
            tokensUsed: 250,
            systemPrompt: "You are a tarot expert...",
          },
        }
      );

      const interpretation = await t.run(async (ctx) => {
        return await ctx.db.get(interpretationId);
      });

      expect(interpretation?.source).toBe("ai");
      expect(interpretation?.aiMetadata).toMatchObject({
        tier: "premium",
        model: { name: "gpt-4o", version: "2024-01" },
        totalCost: 0.025,
        tokensUsed: 250,
      });
    });

    it("throws error when reading does not exist", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);

      const fakeReadingId = await t.run(async (ctx) => {
        const readingId = await createTestReading(
          { run: async (fn) => fn(ctx) } as ReturnType<typeof convexTest>,
          userId
        );
        await ctx.db.delete(readingId);
        return readingId;
      });

      await expect(
        asUser.mutation(api.tables.interpretations.create, {
          readingId: fakeReadingId,
          content: "Test content",
          source: "self",
        })
      ).rejects.toThrowError("Reading not found");
    });

    it("throws error when user does not own the reading", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      const otherReadingId = await t.run(async (ctx) => {
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
          positions: [{ name: "Card", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
        return await ctx.db.insert("readings", {
          userId: otherUserId,
          updatedAt: Date.now(),
          question: "Other question",
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
        asUser.mutation(api.tables.interpretations.create, {
          readingId: otherReadingId,
          content: "Trying to create",
          source: "self",
        })
      ).rejects.toThrowError(
        "Not authorized to create interpretation for this reading"
      );
    });
  });

  describe("update", () => {
    it("updates an interpretation successfully", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const readingId = await createTestReading(t, userId);

      const interpretationId = await t.run(async (ctx) => {
        return await ctx.db.insert("interpretations", {
          userId,
          readingId,
          updatedAt: Date.now() - 1000,
          content: "Original content",
          source: "self",
        });
      });

      await asUser.mutation(api.tables.interpretations.update, {
        _id: interpretationId,
        content: "Updated content",
        focus: "relationships",
      });

      const interpretation = await t.run(async (ctx) => {
        return await ctx.db.get(interpretationId);
      });

      expect(interpretation?.content).toBe("Updated content");
      expect(interpretation?.focus).toBe("relationships");
    });

    it("throws error when interpretation does not exist", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const readingId = await createTestReading(t, userId);

      const fakeInterpretationId = await t.run(async (ctx) => {
        const tempId = await ctx.db.insert("interpretations", {
          userId,
          readingId,
          updatedAt: Date.now(),
          content: "Temp",
          source: "self",
        });
        await ctx.db.delete(tempId);
        return tempId;
      });

      await expect(
        asUser.mutation(api.tables.interpretations.update, {
          _id: fakeInterpretationId,
          content: "Updated",
        })
      ).rejects.toThrowError("Interpretation not found");
    });

    it("throws error when user does not own the interpretation", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      const otherInterpretationId = await t.run(async (ctx) => {
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
          positions: [{ name: "Card", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
        const readingId = await ctx.db.insert("readings", {
          userId: otherUserId,
          updatedAt: Date.now(),
          question: "Other question",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: false,
        });
        return await ctx.db.insert("interpretations", {
          userId: otherUserId,
          readingId,
          updatedAt: Date.now(),
          content: "Other interpretation",
          source: "self",
        });
      });

      await expect(
        asUser.mutation(api.tables.interpretations.update, {
          _id: otherInterpretationId,
          content: "Trying to update",
        })
      ).rejects.toThrowError("Not authorized to update this interpretation");
    });
  });

  describe("remove", () => {
    it("deletes an interpretation successfully", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const readingId = await createTestReading(t, userId);

      const interpretationId = await t.run(async (ctx) => {
        return await ctx.db.insert("interpretations", {
          userId,
          readingId,
          updatedAt: Date.now(),
          content: "To be deleted",
          source: "self",
        });
      });

      await asUser.mutation(api.tables.interpretations.remove, {
        _id: interpretationId,
      });

      const interpretation = await t.run(async (ctx) => {
        return await ctx.db.get(interpretationId);
      });

      expect(interpretation).toBeNull();
    });

    it("throws error when interpretation does not exist", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await setupAuthenticatedUser(t);
      const readingId = await createTestReading(t, userId);

      const fakeInterpretationId = await t.run(async (ctx) => {
        const tempId = await ctx.db.insert("interpretations", {
          userId,
          readingId,
          updatedAt: Date.now(),
          content: "Temp",
          source: "self",
        });
        await ctx.db.delete(tempId);
        return tempId;
      });

      await expect(
        asUser.mutation(api.tables.interpretations.remove, {
          _id: fakeInterpretationId,
        })
      ).rejects.toThrowError("Interpretation not found");
    });

    it("throws error when user does not own the interpretation", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await setupAuthenticatedUser(t);

      const otherInterpretationId = await t.run(async (ctx) => {
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
          positions: [{ name: "Card", transform: { x: 0, y: 0, r: 0, z: 0 } }],
        });
        const readingId = await ctx.db.insert("readings", {
          userId: otherUserId,
          updatedAt: Date.now(),
          question: "Other question",
          date: Date.now(),
          drawMethod: "digital",
          spread: { id: spreadId, version: 1 },
          useReverseMeanings: true,
          useSignifierCard: false,
          results: { cards: [] },
          starred: false,
        });
        return await ctx.db.insert("interpretations", {
          userId: otherUserId,
          readingId,
          updatedAt: Date.now(),
          content: "Other interpretation",
          source: "self",
        });
      });

      await expect(
        asUser.mutation(api.tables.interpretations.remove, {
          _id: otherInterpretationId,
        })
      ).rejects.toThrowError("Not authorized to delete this interpretation");
    });
  });
});
