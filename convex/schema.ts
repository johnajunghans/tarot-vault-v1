import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Card type used in readings.results
const cardValidator = v.object({
  id: v.number(), // 0-77
  position: v.optional(v.number()), // 1-78
  reversed: v.boolean(),
  notes: v.string(),
});

// Users table validator (without system fields)
export const userValidator = v.object({
  authId: v.string(), // Clerk user ID
  tokenIdentifier: v.string(),
  updatedAt: v.number(), // milliseconds since epoch
  lastSignedIn: v.number(), // milliseconds since epoch
  name: v.string(),
  email: v.string(),
  settings: v.object({
    appearance: v.object({
      theme: v.union(
        v.literal("light"),
        v.literal("dark"),
        v.literal("system")
      ), // default: "system"
    }),
    preferences: v.object({
      useReverseMeanings: v.union(
        v.literal("auto"),
        v.literal("always"),
        v.literal("never")
      ), // default: "auto"
    }),
    notifications: v.object({
      private: v.object({
        showToasts: v.boolean(), // default: true
      }),
    }),
  }),
});

// Readings table validator (without system fields)
export const readingValidator = v.object({
  userId: v.id("users"),
  updatedAt: v.number(), // milliseconds since epoch
  question: v.string(),
  date: v.number(), // milliseconds since epoch
  drawMethod: v.union(v.literal("manual"), v.literal("digital")),
  digitalDrawRandomness: v.optional(
    v.union(v.literal("pseudo"), v.literal("real"))
  ),
  spread: v.object({
    id: v.id("spreads"),
    version: v.number(),
  }),
  useReverseMeanings: v.boolean(),
  useSignifierCard: v.boolean(),
  results: v.object({
    signifier: v.optional(cardValidator),
    cards: v.array(cardValidator),
  }),
  title: v.optional(v.string()),
  context: v.optional(v.string()),
  image: v.optional(v.id("_storage")),
  parent: v.optional(
    v.object({
      type: v.literal("reading"),
      id: v.id("readings"),
    })
  ),
  notes: v.optional(v.string()),
  interpretations: v.optional(v.array(v.id("interpretations"))),
  starred: v.boolean(), // default: false
});

// Interpretations table validator (without system fields)
export const interpretationValidator = v.object({
  userId: v.id("users"),
  readingId: v.id("readings"),
  updatedAt: v.number(), // milliseconds since epoch
  content: v.string(),
  source: v.union(v.literal("self"), v.literal("ai")),
  focus: v.optional(v.string()),
  aiMetadata: v.optional(
    v.object({
      tier: v.union(v.literal("free"), v.literal("premium")),
      model: v.object({
        name: v.string(),
        version: v.string(),
      }),
      requestTime: v.number(), // milliseconds since epoch
      totalCost: v.number(),
      tokensUsed: v.number(),
      systemPrompt: v.optional(v.string()),
    })
  ),
});

// Spreads table validator (without system fields)
export const spreadValidator = v.object({
  userId: v.id("users"),
  updatedAt: v.number(), // milliseconds since epoch
  name: v.string(),
  description: v.optional(v.string()),
  numberOfCards: v.number(), // 1-78
  positions: v.array(
    v.object({
      name: v.string(),
      description: v.optional(v.string()),
      allowReverse: v.optional(v.boolean()),
      transform: v.object({
        x: v.number(),
        y: v.number(),
        r: v.number(),
        z: v.number(),
      }),
    })
  ),
});

export default defineSchema({
  // Users table - stores user account information synced from Clerk
  users: defineTable(userValidator).index("by_authId", ["authId"]),

  // Readings table - stores tarot reading sessions
  readings: defineTable(readingValidator)
    .index("by_userId_and_updatedAt", ["userId", "updatedAt"])
    .index("by_userId_and_starred", ["userId", "starred"]),

  // Interpretations table - stores user and AI interpretations of readings
  interpretations: defineTable(interpretationValidator)
    .index("by_user", ["userId"])
    .index("by_readingId", ["readingId"])
    .index("by_userId_and_source", ["userId", "source"]),

  // Spreads table - stores custom and default tarot spreads
  spreads: defineTable(spreadValidator).index("by_userId_and_updatedAt", [
    "userId",
    "updatedAt",
  ]),
});
