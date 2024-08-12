import { geminiPro } from "@genkit-ai/googleai";
import { zPromptModelType } from "../../../types/_data.prompt";
import { prompt } from "@genkit-ai/dotprompt";
import { z } from "zod";
import { generate } from "@genkit-ai/ai";
import { zSurveyModel, zSurveyModelType } from "../../../types/_data.survey";
import { fineTuningIds } from "./_config";

export const genInterestPromptSelectionSurvey = async (
  input: zPromptModelType,
  surveyTypeId: string,
  context?: string
) => {
  const subject = input.firstBreakdown?.field;
  const prompt = `
  You are a surveyor and you are trying to understand the users intentions or interests.
    with full prompt data of users query is ${JSON.stringify(
      input.firstBreakdown
    )}
  for the above, generate atleast 10 options with the following values. Keep the options widely varied and very particular to ${
    context ? `` : `a specific sub field of the subject.`
  }
  options:
    - label: a short keyword that describes the interest
    - labelDescription: a short description of what this interest relates to`;
  const output = await generate({
    model: geminiPro.name,
    prompt: prompt,
    output: {
      format: "json",
      schema: zSurveyModel.pick({ options: true }),
    },
  });
  const result = output.output();
  if (!result?.options) return null;
  return {
    ...result,
    type: "prompt_survey",
    question: "What are your key areas of interest?",
    subtitle: "You can re-adjust this setting at a later time, if needed.",
    surveyTypeId,
    ui: {
      selectionStyle: "extendible_select",
      questionType: "multiple_select",
    },
    logic: {
      responseType: "mixed",
      extendibleSelect: "promptInterestSelectionsFlow",
    },
  } as zSurveyModelType;
};
