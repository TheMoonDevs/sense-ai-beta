import { z } from "zod";
import { zId } from "./_zod.common";

export const zUserPrefModel = z.object({
  _id: zId,
  user_id: zId,
  type: z.enum(["taste", "happening", "background"]),
  domain: z.string().optional().nullable(), // food, music, movies, books, etc
  subdomain: z.string().optional().nullable(), // italian, jazz, horror
  action: z
    .enum(["likes", "dislikes", "neutral", "hates", "loves", "lost", "found"])
    .or(z.string())
    .optional(),
  subject: z.string().optional(), // pizza, jazz, stephen king, etc
  weightage: z.number().optional(),
  quantity: z.number().optional().default(0),
  data: z
    .object({
      userInput: z.string().optional(),
    })
    .optional(),
});

export type UserPrefModelType = z.infer<typeof zUserPrefModel>;
