import { z } from "zod";
import {
  zUserAcademicsSchema,
  zUserBackgroundSchema,
  zUserProfessionSchema,
  zUserTasteSchema,
} from "./_zod.userInfo";
import { zId } from "./_zod.common";

export const zUserInfoModel = z.object({
  _id: zId,
  user_id: zId.nullable().optional(),
  userAcademics: zUserAcademicsSchema.optional(),
  userProfession: zUserProfessionSchema.optional(),
  userTaste: zUserTasteSchema.optional(),
  userBackground: zUserBackgroundSchema.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type zUserInfoModelType = z.infer<typeof zUserInfoModel>;
