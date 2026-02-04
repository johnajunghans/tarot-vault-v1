import { convexTest } from "convex-test";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, internal } from "../_generated/api";
import { modules, schema } from "./test.setup";

describe("users", () => {
  describe("current", () => {
    it("returns null when not authenticated", async () => {
      const t = convexTest(schema, modules);

      const user = await t.query(api.tables.users.current);
      expect(user).toBeNull();
    });

    it("returns the current user when authenticated", async () => {
      const t = convexTest(schema, modules);

      // Create a user directly in the database
      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          authId: "clerk_user_123",
          tokenIdentifier: "https://clerk.test|clerk_user_123",
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

      // Query as the authenticated user
      const asUser = t.withIdentity({
        subject: "clerk_user_123",
        issuer: "https://clerk.test",
        tokenIdentifier: "https://clerk.test|clerk_user_123",
      });

      const user = await asUser.query(api.tables.users.current);
      expect(user).not.toBeNull();
      expect(user?._id).toEqual(userId);
      expect(user?.name).toEqual("Test User");
      expect(user?.email).toEqual("test@example.com");
    });
  });

  describe("upsertFromClerk", () => {
    beforeEach(() => {
      vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "https://clerk.test");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("creates a new user from Clerk webhook data", async () => {
      const t = convexTest(schema, modules);

      const clerkData = {
        id: "clerk_user_new",
        first_name: "John",
        last_name: "Doe",
        email_addresses: [
          {
            id: "email_1",
            email_address: "john.doe@example.com",
          },
        ],
        primary_email_address_id: "email_1",
      };

      await t.mutation(internal.tables.users.upsertFromClerk, {
        data: clerkData,
      });

      // Verify user was created
      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_authId", (q) => q.eq("authId", "clerk_user_new"))
          .unique();
      });

      expect(user).not.toBeNull();
      expect(user?.name).toEqual("John Doe");
      expect(user?.email).toEqual("john.doe@example.com");
      expect(user?.authId).toEqual("clerk_user_new");
      expect(user?.settings).toMatchObject({
        appearance: { theme: "system" },
        preferences: { useReverseMeanings: "auto" },
        notifications: { private: { showToasts: true } },
      });
    });

    it("updates an existing user from Clerk webhook data", async () => {
      const t = convexTest(schema, modules);

      // Create existing user
      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          authId: "clerk_user_existing",
          tokenIdentifier: "https://clerk.test|clerk_user_existing",
          updatedAt: Date.now() - 10000,
          lastSignedIn: Date.now() - 10000,
          name: "Old Name",
          email: "old@example.com",
          settings: {
            appearance: { theme: "dark" },
            preferences: { useReverseMeanings: "never" },
            notifications: { private: { showToasts: false } },
          },
        });
      });

      const clerkData = {
        id: "clerk_user_existing",
        first_name: "New",
        last_name: "Name",
        email_addresses: [
          {
            id: "email_1",
            email_address: "new@example.com",
          },
        ],
        primary_email_address_id: "email_1",
      };

      await t.mutation(internal.tables.users.upsertFromClerk, {
        data: clerkData,
      });

      // Verify user was updated
      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_authId", (q) => q.eq("authId", "clerk_user_existing"))
          .unique();
      });

      expect(user).not.toBeNull();
      expect(user?.name).toEqual("New Name");
      expect(user?.email).toEqual("new@example.com");
      // Settings should not be overwritten during update
      expect(user?.settings.appearance.theme).toEqual("dark");
    });

    it("throws error when no primary email is found", async () => {
      const t = convexTest(schema, modules);

      const clerkData = {
        id: "clerk_user_no_email",
        first_name: "No",
        last_name: "Email",
        email_addresses: [
          {
            id: "email_1",
            email_address: "test@example.com",
          },
        ],
        primary_email_address_id: "email_different",
      };

      await expect(
        t.mutation(internal.tables.users.upsertFromClerk, { data: clerkData })
      ).rejects.toThrowError("No primary email found for user");
    });
  });

  describe("deleteFromClerk", () => {
    it("deletes an existing user", async () => {
      const t = convexTest(schema, modules);

      // Create a user to delete
      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          authId: "clerk_user_to_delete",
          tokenIdentifier: "https://clerk.test|clerk_user_to_delete",
          updatedAt: Date.now(),
          lastSignedIn: Date.now(),
          name: "Delete Me",
          email: "delete@example.com",
          settings: {
            appearance: { theme: "system" },
            preferences: { useReverseMeanings: "auto" },
            notifications: { private: { showToasts: true } },
          },
        });
      });

      await t.mutation(internal.tables.users.deleteFromClerk, {
        clerkUserId: "clerk_user_to_delete",
      });

      // Verify user was deleted
      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_authId", (q) => q.eq("authId", "clerk_user_to_delete"))
          .unique();
      });

      expect(user).toBeNull();
    });

    it("handles deletion of non-existent user gracefully", async () => {
      const t = convexTest(schema, modules);

      // Should not throw, just logs a warning
      await expect(
        t.mutation(internal.tables.users.deleteFromClerk, {
          clerkUserId: "non_existent_user",
        })
      ).resolves.toBeNull();
    });
  });
});
