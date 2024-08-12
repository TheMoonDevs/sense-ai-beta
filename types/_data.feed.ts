import { z } from "zod";
import { zId } from "./_zod.common";
import { zSurveyModel } from "./_data.survey";
import { zInterestRootEnum, zInterestSchema } from "./_data.interest";

export const feedType = z.enum(["quiz", "video", "audio", "text", "survey"]);
// generalInterests
// if feed is skipped, the interest/prompt/course will be down weighted.
// if feed is interacted,
export const zFeedModel = z.object({
  _id: zId,
  user_id: zId.nullable().optional(),
  rootType: zInterestRootEnum.optional(),
  linked_type: z
    .enum(["prompt", "course", "interest", "user_interest", "user_info"])
    .optional(),
  course_id: zId.optional(),
  prompt_id: zId.optional(),
  user_interest_id: zId.optional(),
  interest_id: zId.or(zInterestSchema).optional(),
  priority: z.number().optional(),
  interaction: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  maturityDate: z.date().optional(),
  expiryDate: z.date().optional(),
  uiSettings: z.object({ skippable: z.boolean().optional() }).optional(),
  settings: z.object({}).optional(),
  feedType: feedType.optional(),
  linked_survey_id: zId.or(zSurveyModel).optional(),
  linkedSurvey: zSurveyModel.optional(),
});

export type zFeedModelType = z.infer<typeof zFeedModel>;
