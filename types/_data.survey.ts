import { z } from "zod";
import { zId } from "./_zod.common";

export const zSuveyType = z.enum([
  "prompt_survey",
  "course_quiz",
  "interest_casual_quiz",
  "userInfo_survey",
  "userInterest_survey",
]);
export const zSurveyLinkedRootTypeEnum = z.enum([
  "prompt",
  "course",
  "interest",
  "user",
]);
export const zSurveyQuestionTypeEnum = z.enum([
  "single_select",
  "multiple_select",
  "boolean",
  //"scale",
  //"image",
  "open_ended",
]);
export const zSurveyResponseTypeEnum = z.enum([
  "text",
  "boolean",
  "number",
  "image",
  "mixed",
]);
export const zSurveyUiStyleEnum = z.enum([
  // "yesNo",
  // "textChoices",
  // "cardChoices",
  "range_keywords",
  "extendible_select",
  "yes_no",
  "in_chat_choices",
  "emoji_choices",
  "card_choices",
  "pager_choices",
  "quiz_vertical_choices",
  "quiz_4bt_choices",
  // "rating",
]);

export const zSurveyOptionSingle = z
  .object({
    value: z.string().optional().or(z.number().optional()),
    label: z.string().optional(),
    labelDescription: z.string().optional(),
    image: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
    isCorrect: z.boolean().optional(),
  })
  .passthrough();

export const zSurveyOptions = z.array(zSurveyOptionSingle);

export const zSurveyModel = z.object({
  _id: zId,
  type: zSuveyType,
  surveyTypeId: z.string().optional(),
  user_id: zId.nullable().optional(),
  linked_type: zSurveyLinkedRootTypeEnum.optional(),
  linked_id: z.string().or(z.any()).optional(),
  linked_order: z.number().optional(),
  question: z.string().optional(),
  subtitle: z.string().optional().nullable(),
  keywords: z.array(z.string()).optional(),
  ui: z
    .object({
      questionType: zSurveyQuestionTypeEnum.optional(),
      selectionStyle: zSurveyUiStyleEnum.optional(),
      learningQuizBottomSlider: z.boolean().optional(),
      isAnswerInOption: z.boolean().optional(),
      isQuiz: z.boolean().optional(),
    })
    .optional(),
  logic: z
    .object({
      responseType: zSurveyResponseTypeEnum.optional(),
      extendibleSelect: z.string().optional(),
      responseUnit: z.string().optional(),
      booleanAnswer: z.boolean().optional(),
    })
    .optional(),
  extra: z
    .object({
      surveyIntent: z.string().optional(),
      hint: z.string().optional(),
      explanation: z.string().optional(),
      learning_topic_id: z.string().optional(),
      subtopic_id: z.string().optional(),
    })
    .optional(),
  options: zSurveyOptions.optional(),
  is_open_ended: z.boolean().optional(),
  response: z
    .object({
      single: z.string().optional().or(z.number().optional()),
      mixed: z.any().optional(),
      multiple: z.array(z.string().or(z.number())).optional(),
      openEndedInput: z.string().optional(),
      boolean: z.boolean().optional(), // if booleantype
      checked: z.boolean().optional(), // only to check if clicked on ui
      submitted: z.boolean().optional(), // if submitted
      correctlyAnswered: z.boolean().optional(), // if correctly answered
    })
    .optional(),
});

export type zSurveyModelType = z.infer<typeof zSurveyModel>;

export type zSurveyOption = z.infer<typeof zSurveyOptions.element>;
