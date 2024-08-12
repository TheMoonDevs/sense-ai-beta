import { z } from "zod";
import { zPromptModel } from "./_data.prompt";
import { zSurveyModel } from "./_data.survey";

export const zSQSteerInputSchema = z.object({
  promptData: zPromptModel,
  steerPrompt: z.string().optional().nullable(),
});

export const zSQSteerOutputSchema = zSurveyModel.omit({ response: true });

export const zGenTypeEnum = z.enum(["quiz", "survey"])
