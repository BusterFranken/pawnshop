import { z } from "zod";

export const shopSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  acceptsGold: z.boolean().default(true),
  acceptsSilver: z.boolean().default(true),
  acceptsPlatinum: z.boolean().default(false),
  payoutFactor: z.number().min(0).max(1).default(0.6),
  rating: z.number().min(0).max(5).optional().nullable(),
  isActive: z.boolean().default(true),
});

export type ShopInput = z.infer<typeof shopSchema>;
