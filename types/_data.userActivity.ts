import { z } from "zod";
import { zId } from "./_zod.common";

export const zUserActivityModel = z.object({
  user_id: zId,
  linked_interest_id: zId.optional(),
  linked_prompt_id: zId.optional(),
  linked_survey_id: zId.optional(),
  type: z.enum(["feed_quiz", "feed_interest", "feed_pref", "feed_taste"]),
  screen: z.string().optional(),
  action: z.enum([
    "view",
    "click",
    "like",
    "dislike",
    "comment",
    "share",
    "submit",
  ]),
  quantity: z.number().optional(),
  weightage: z.number().optional(),
});
