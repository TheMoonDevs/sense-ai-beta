import { z } from "zod";
import { zId } from "./_zod.common";

export const zActionModel = z.object({
  user_interest_id: zId,
  image_url: z.string().optional().nullable(),
  title: z.string(),
  description: z.string().optional().nullable(),
  ext_link: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type zActionModelType = z.infer<typeof zActionModel>;
