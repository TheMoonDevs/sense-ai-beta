import {geminiPro} from "@genkit-ai/googleai";
import {zPromptModelType} from "../../../types/_data.prompt";
import {prompt} from "@genkit-ai/dotprompt";
import {z} from "zod";
import {generate} from "@genkit-ai/ai";
import {zSurveyModel, zSurveyModelType} from "../../../types/_data.survey";
import { fineTuningIds } from "./_config";


export const generateDepthPromptGoal= async (input : zPromptModelType, surveyTypeId : string) => {
    const subject = input.firstBreakdown ?. field;
    const prompt = `
  You are a surveyor and you are trying to understand the depth of knowledge user is interested in.
  The main interest is ${
        input.input_prompt
    }
  The given context is ${`${
            input.firstBreakdown ?. keywords ?. join(",")
        }`
    } - with full prompt data is ${
        JSON.stringify(input.firstBreakdown)
    }

  for the above, fill in the following details
  question: something similar to - How deep do you want to go in ${subject}?, or How much do you wish to learn in ${
        input.firstBreakdown ?. subject
    }?
  options:
    - value: a digit range like 0-1, 1-2, etc from 0 to 10
    - label: a unique creative keyword to explain the range based on the prompt data.
    - labelDescription: a description of the label`;
    const output = await generate({
        model: geminiPro.name,
        prompt: prompt,
        output: {
            format: "json",
            schema: zSurveyModel.pick(
                {question: true, options: true}
            )
        }
    });
    const result = output.output();
    if (!result?.options) 
        return null;
    
    return {
        ... result,
        type: "prompt_survey",
        subtitle: "You can re-adjust this setting at a later time, if needed.",
        surveyTypeId,
        ui: {
            selectionStyle: "range_keywords",
            questionType: "single_select" //changed from scale to single_select for build fix
        },
        logic: {
            responseType: "number"
        }
    } as zSurveyModelType
}