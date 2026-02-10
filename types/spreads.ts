import { Doc } from "@/convex/_generated/dataModel";
import { spreadPositionValidator } from "@/convex/schema";
import { Infer } from "convex/values";

export type CardPosition = Infer<typeof spreadPositionValidator>

export type SpreadDoc = Doc<"spreads">

export type SpreadInput = Omit<SpreadDoc, "_id" | "_creationTime" | "userId" | "updatedAt">