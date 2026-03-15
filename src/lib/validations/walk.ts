import { z } from "zod";

export const walkSchema = z.object({
  shoeId: z.string().cuid(),
  miles: z.coerce.number().positive("Miles must be greater than 0"),
  date: z.coerce.date(),
  notes: z.string().max(500).nullable().optional(),
});

export type WalkFormData = z.infer<typeof walkSchema>;
