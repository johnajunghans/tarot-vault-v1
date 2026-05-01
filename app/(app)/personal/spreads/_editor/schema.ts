import z from "zod";
import { areCanonicalLayerValues } from "./lib/layering";

export const cardSchema = z.object({
    name: z.string().max(50),
    description: z.string().max(500).optional(),
    allowReverse: z.boolean().optional(),
    x: z.number(),
    y: z.number(),
    r: z.number().min(0).max(359),
    z: z.number().int().min(1),
  })
  
export const spreadSchema = z.object({
    name: z.string().min(3).max(50),
    description: z.string().max(1000).optional(),
    positions: z.array(cardSchema)
  }).superRefine((spread, ctx) => {
    const layers = spread.positions.map((position) => position.z);
    if (areCanonicalLayerValues(layers)) return;

    ctx.addIssue({
      code: "custom",
      path: ["positions"],
      message: "Card layers must be unique integers from 1 to the number of cards.",
    });
  });
