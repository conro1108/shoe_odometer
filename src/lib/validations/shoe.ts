import { z } from "zod";

export const shoeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  brand: z.string().min(1, "Brand is required").max(100),
  startingMileage: z.coerce.number().min(0, "Must be 0 or greater").default(0),
  photoUrl: z.string().url().nullable().optional(),
});

export type ShoeFormData = z.infer<typeof shoeSchema>;
