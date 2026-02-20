import { cardSchema, spreadSchema } from "@/app/(app)/personal/spreads/schema";
import { Doc } from "@/convex/_generated/dataModel";
import { spreadPositionValidator } from "@/convex/schema";
import { Infer } from "convex/values";
import z from "zod";

export type CardDB = Infer<typeof spreadPositionValidator>

export type CardTransform = Pick<CardDB, "x" | "y" | "r" | "z">

export type SpreadDB = Doc<"spreads">

export type SpreadInput = Omit<SpreadDB, "_id" | "_creationTime" | "userId" | "updatedAt">

export type CardForm = z.infer<typeof cardSchema>

export type SpreadForm = z.infer<typeof spreadSchema>

export interface SpreadDraft extends SpreadInput {
    date: number
}