import z from "zod";

export const cardSchema = z.object({
    name: z.string().max(50),
    description: z.string().max(500).optional(),
    allowReverse: z.boolean().optional(),
    x: z.number(),
    y: z.number(),
    r: z.number().min(0).max(315),
    z: z.number().min(0).max(100),
  })
  
  // Form validation schema
 export const spreadSchema = z.object({
    name: z.string().min(3).max(50),
    description: z.string().max(1000).optional(),
    positions: z.array(cardSchema)
  });
