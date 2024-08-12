import { geminiPro } from "@genkit-ai/googleai";
import { zPromptModelType } from "../../../types/_data.prompt";
import { prompt } from "@genkit-ai/dotprompt";
import { z } from "zod";
import { generate } from "@genkit-ai/ai";
import { zSurveyModel, zSurveyModelType } from "../../../types/_data.survey";
import { fineTuningIds } from "./_config";


export const genPromptLearningGoalSurvey = async (
    input: zPromptModelType,
    surveyTypeId: string,
) => {
    const subject = input.firstBreakdown?.field;
    const prompt = `
  You are a course estimator and you can estimate how many days learning a casual topic or subject would take.
  User asked for ${input.input_prompt} with full prompt data of users query is ${JSON.stringify(input.firstBreakdown)}
  
  
  for the above, generate 4 options with the following values.
  options:
    - value: number of days.
    - label: a unique creative keyword to explain the range
    - icon: an emoji icon to represent the label`;
    const output = await generate({
        model: geminiPro.name,
        prompt: prompt,
        output: {
            format: "json",
            schema: zSurveyModel.pick(
                { options: true }
            )
        }
    });
    const result = output.output();
    if (!result?.options)
        return null;
    return {
        ...result,
        type: "prompt_survey",
        question: "How fast do you want to learn?",
        subtitle: "You can re-adjust this setting at a later time, if needed.",
        surveyTypeId,
        ui: {
            selectionStyle: "emoji_choices",
            questionType: "single_select"
        },
        logic: {
            responseType: "number",
            responseUnit: "days"
        },
    } as zSurveyModelType
}