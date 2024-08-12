import { geminiPro } from "@genkit-ai/googleai";
import { zPromptModelType } from "../../../types/_data.prompt";
import { prompt } from "@genkit-ai/dotprompt";
import { z } from "zod";
import { generate } from "@genkit-ai/ai";
import { zSurveyModel, zSurveyModelType } from "../../../types/_data.survey";
import { fineTuningIds } from "./_config";


export const genPromptUserKnowledgSurvey = async (
    input: zPromptModelType,
    surveyTypeId: string,
) => {
    const subject = input.firstBreakdown?.field;
    const prompt = `
  You are a surveyor and you are trying to understand the users previous knowledge in ${input.input_prompt}.
    with full prompt data of users query is ${JSON.stringify(input.firstBreakdown)}
  for the above, generate a question to check the users knowledge in the field.
  question: a short question that is  catchy.
  subtitle: a detailed question to ask the user.
  options:
    - value: correct or wrong
    - label: the answer to the question
    - labelDescription: a hint text to show the user if they are wrong`;
    const output = await generate({
        model: geminiPro.name,
        prompt: prompt,
        output: {
            format: "json",
            schema: zSurveyModel.pick(
                { options: true, question: true, subtitle: true }
            )
        }
    });
    const result = output.output();
    if (!result?.options)
        return null;
    return {
        ...result,
        type: "prompt_survey",
        surveyTypeId,
        ui: {
            selectionStyle: "in_chat_choices",
            questionType: "single_select"
        },
        logic: {
            responseType: "mixed",
        },
        is_open_ended: true,
    } as zSurveyModelType
}