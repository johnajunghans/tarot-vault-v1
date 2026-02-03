import { v, Validator } from "convex/values";
import { internalMutation, query, QueryCtx } from "./_generated/server";
import { UserJSON } from "@clerk/backend";

// Query to get the current authenticated user
export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

// Internal mutation to create or update user from Clerk webhook
export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> }, // no runtime validation, trust Clerk
  async handler(ctx, { data }) {
    // Get primary email
    const primaryEmail = data.email_addresses.find(
      (email) => email.id === data.primary_email_address_id
    );

    if (!primaryEmail) {
      throw new Error("No primary email found for user");
    }

    // Construct full name
    const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || "User";

    const userAttributes = {
      name,
      email: primaryEmail.email_address,
      authId: data.id,
      tokenIdentifier: `${process.env.CLERK_JWT_ISSUER_DOMAIN}|${data.id}`,
      updatedAt: Date.now(),
      lastSignedIn: Date.now(),
    };

    const user = await userByAuthId(ctx, data.id);
    if (user === null) {
      // Create new user with default settings
      await ctx.db.insert("users", {
        ...userAttributes,
        settings: {
          appearance: {
            theme: "system",
          },
          preferences: {
            useReverseMeanings: "auto",
          },
          notifications: {
            private: {
              showToasts: true,
            },
          },
        },
      });
    } else {
      // Update existing user
      await ctx.db.patch(user._id, userAttributes);
    }
  },
});

// Internal mutation to delete user from Clerk webhook
export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByAuthId(ctx, clerkUserId);

    if (user !== null) {
      await ctx.db.delete(user._id);
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
      );
    }
  },
});

// Helper function to get current user or throw error
export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) throw new Error("Can't get current user");
  return userRecord;
}

// Helper function to get current user
export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await userByAuthId(ctx, identity.subject);
}

// Helper function to look up user by Clerk ID
async function userByAuthId(ctx: QueryCtx, authId: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_authId", (q) => q.eq("authId", authId))
    .unique();
}
