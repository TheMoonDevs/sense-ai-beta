import { z } from "zod";
import { zId } from "./_zod.common";

export const zUserSchema = z.object({
  _id: zId,
  email: z.string().email(),
  name: z.string(),
  password: z.string(),
  profile_url: z.string().optional(),
  googleId: z.string().optional(),
  phone: z.string().optional(),
  accesssData: z
    .object({
      admin: z.boolean(),
      betaAccess: z.boolean(),
      betaAccessRequested: z.boolean(),
    })
    .optional(),
  social_stats: z
    .object({
      following: z.array(
        z.object({
          doc_type: z.string(),
          following_count: z.number(),
        })
      ),
      rating: z.array(
        z.object({
          doc_type: z.string(),
          rating_count: z.number(),
        })
      ),
    })
    .optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
