import { convexTest } from "convex-test";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { modules, schema } from "./test.setup";
import { Webhook } from "svix";

// Mock svix Webhook verification
vi.mock("svix", () => {
  return {
    Webhook: vi.fn().mockImplementation(() => ({
      verify: vi.fn(),
    })),
  };
});

describe("http - Clerk webhook", () => {
  beforeEach(() => {
    vi.stubEnv("CLERK_WEBHOOK_SECRET", "test_webhook_secret");
    vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "https://clerk.test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe("user.created event", () => {
    it("creates a new user from Clerk webhook", async () => {
      const t = convexTest(schema, modules);

      const clerkEvent = {
        type: "user.created",
        data: {
          id: "clerk_user_webhook_test",
          first_name: "Webhook",
          last_name: "User",
          email_addresses: [
            {
              id: "email_1",
              email_address: "webhook@example.com",
            },
          ],
          primary_email_address_id: "email_1",
        },
      };

      // Mock the Webhook verify to return our event
      const mockVerify = vi.fn().mockReturnValue(clerkEvent);
      vi.mocked(Webhook).mockImplementation(
        () =>
          ({
            verify: mockVerify,
          }) as unknown as Webhook
      );

      const response = await t.fetch("/clerk-users-webhook", {
        method: "POST",
        headers: {
          "svix-id": "test-id",
          "svix-timestamp": "1234567890",
          "svix-signature": "v1,test-signature",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clerkEvent),
      });

      expect(response.status).toBe(200);

      // Verify user was created
      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_authId", (q) =>
            q.eq("authId", "clerk_user_webhook_test")
          )
          .unique();
      });

      expect(user).not.toBeNull();
      expect(user?.name).toBe("Webhook User");
      expect(user?.email).toBe("webhook@example.com");
    });
  });

  describe("user.updated event", () => {
    it("updates an existing user from Clerk webhook", async () => {
      const t = convexTest(schema, modules);

      // Create existing user
      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          authId: "clerk_user_update_test",
          tokenIdentifier: "https://clerk.test|clerk_user_update_test",
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

      const clerkEvent = {
        type: "user.updated",
        data: {
          id: "clerk_user_update_test",
          first_name: "Updated",
          last_name: "Name",
          email_addresses: [
            {
              id: "email_1",
              email_address: "updated@example.com",
            },
          ],
          primary_email_address_id: "email_1",
        },
      };

      // Mock the Webhook verify
      const mockVerify = vi.fn().mockReturnValue(clerkEvent);
      vi.mocked(Webhook).mockImplementation(
        () =>
          ({
            verify: mockVerify,
          }) as unknown as Webhook
      );

      const response = await t.fetch("/clerk-users-webhook", {
        method: "POST",
        headers: {
          "svix-id": "test-id",
          "svix-timestamp": "1234567890",
          "svix-signature": "v1,test-signature",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clerkEvent),
      });

      expect(response.status).toBe(200);

      // Verify user was updated
      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_authId", (q) =>
            q.eq("authId", "clerk_user_update_test")
          )
          .unique();
      });

      expect(user).not.toBeNull();
      expect(user?.name).toBe("Updated Name");
      expect(user?.email).toBe("updated@example.com");
      // Settings should be preserved
      expect(user?.settings.appearance.theme).toBe("dark");
    });
  });

  describe("user.deleted event", () => {
    it("deletes an existing user from Clerk webhook", async () => {
      const t = convexTest(schema, modules);

      // Create user to be deleted
      await t.run(async (ctx) => {
        await ctx.db.insert("users", {
          authId: "clerk_user_delete_test",
          tokenIdentifier: "https://clerk.test|clerk_user_delete_test",
          updatedAt: Date.now(),
          lastSignedIn: Date.now(),
          name: "To Be Deleted",
          email: "delete@example.com",
          settings: {
            appearance: { theme: "system" },
            preferences: { useReverseMeanings: "auto" },
            notifications: { private: { showToasts: true } },
          },
        });
      });

      const clerkEvent = {
        type: "user.deleted",
        data: {
          id: "clerk_user_delete_test",
        },
      };

      // Mock the Webhook verify
      const mockVerify = vi.fn().mockReturnValue(clerkEvent);
      vi.mocked(Webhook).mockImplementation(
        () =>
          ({
            verify: mockVerify,
          }) as unknown as Webhook
      );

      const response = await t.fetch("/clerk-users-webhook", {
        method: "POST",
        headers: {
          "svix-id": "test-id",
          "svix-timestamp": "1234567890",
          "svix-signature": "v1,test-signature",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clerkEvent),
      });

      expect(response.status).toBe(200);

      // Verify user was deleted
      const user = await t.run(async (ctx) => {
        return await ctx.db
          .query("users")
          .withIndex("by_authId", (q) =>
            q.eq("authId", "clerk_user_delete_test")
          )
          .unique();
      });

      expect(user).toBeNull();
    });
  });

  describe("invalid webhook", () => {
    it("returns 400 when webhook verification fails", async () => {
      const t = convexTest(schema, modules);

      // Mock the Webhook verify to throw an error
      const mockVerify = vi.fn().mockImplementation(() => {
        throw new Error("Invalid signature");
      });
      vi.mocked(Webhook).mockImplementation(
        () =>
          ({
            verify: mockVerify,
          }) as unknown as Webhook
      );

      const response = await t.fetch("/clerk-users-webhook", {
        method: "POST",
        headers: {
          "svix-id": "test-id",
          "svix-timestamp": "1234567890",
          "svix-signature": "v1,invalid-signature",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: "user.created", data: {} }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("ignored events", () => {
    it("returns 200 for unhandled event types", async () => {
      const t = convexTest(schema, modules);

      const clerkEvent = {
        type: "session.created", // Not handled
        data: {
          id: "session_123",
        },
      };

      // Mock the Webhook verify
      const mockVerify = vi.fn().mockReturnValue(clerkEvent);
      vi.mocked(Webhook).mockImplementation(
        () =>
          ({
            verify: mockVerify,
          }) as unknown as Webhook
      );

      const response = await t.fetch("/clerk-users-webhook", {
        method: "POST",
        headers: {
          "svix-id": "test-id",
          "svix-timestamp": "1234567890",
          "svix-signature": "v1,test-signature",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clerkEvent),
      });

      // Should still return 200 (event is ignored but not an error)
      expect(response.status).toBe(200);
    });
  });
});
