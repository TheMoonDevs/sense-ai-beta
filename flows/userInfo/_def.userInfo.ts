import {
  zDegreeSchema,
  zUserAcademicsSchema,
  zUserBackgroundSchema,
  zUserProfessionSchema,
  zUserTasteSchema,
} from "./../../types/_zod.userInfo";
import { defineSchema } from "@genkit-ai/core";

export const DegreeSchema = defineSchema("DegreeSchema", zDegreeSchema);

export const UserTasteSchema = defineSchema(
  "UserTasteSchema",
  zUserTasteSchema
);

export const UserProfessionSchema = defineSchema(
  "UserProfessionSchema",
  zUserProfessionSchema
);

export const UserAcademicsSchema = defineSchema(
  "UserAcademicsSchema",
  zUserAcademicsSchema
);

export const UserBackgroundSchema = defineSchema(
  "UserBackgroundSchema",
  zUserBackgroundSchema
);
