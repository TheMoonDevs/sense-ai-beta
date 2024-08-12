import { z } from "zod";
import { zId } from "./_zod.common";
import { zImageType } from "./_data.images";

export const zTutorBotSchema = z.object({
  _id: zId,
  fullname: z.string().optional(),
  nickname: z.string().optional(),
  subtitle: z.string().optional(),
  user_id: zId.optional(),
  bio: z.string().optional(),
  bot_prompt: z.string().optional(),
  avatars: z.array(zImageType).optional(),
  prompt_prefix: z.string().optional(),
  isEditorsPick: z.boolean().optional().default(false),
  popularity: z.number().min(0).max(1).default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type TutorBotSchemaType = z.infer<typeof zTutorBotSchema>;
