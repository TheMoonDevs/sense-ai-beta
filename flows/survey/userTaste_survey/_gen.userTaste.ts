import { geminiPro } from "@genkit-ai/googleai";
import { generate } from "@genkit-ai/ai";
import {
  zSurveyModel,
  zSurveyModelType,
  zSurveyQuestionTypeEnum,
} from "../../../types/_data.survey";
import { zUserInfoModelType } from "../../../types/_data.userInfo";
import { z } from "zod";
import { customSurveyFields } from "../../helpers/surveyHelpers";
import { zUserTasteValues } from "../../../types/_zod.userInfo";
import { zGenTypeEnum } from "../../../types/_zod.survey";

export const UserTasteSurveyHelper = {
  determineNextKeywordContext: async (input: {
    genType: z.infer<typeof zGenTypeEnum>;
    userTaste: zUserInfoModelType["userTaste"];
    context: any;
  }) => {
    const { context, userTaste, genType } = input;

    const prompt = `You are a surveyor trying to understand the user's likes, tastes, or interests${
      genType === "quiz" && " through a quiz"
    }. ${
      userTaste
        ? " known user taste data: " + JSON.stringify(userTaste) + "."
        : ""
    } The survey should explore an uncovered aspect of the user's taste ${
      context ? "related to the context: " + JSON.stringify(context) + "." : ""
    }. Generate a keyword for the next survey and, based on this keyword, select a related user taste from the known data. Also, choose a suitable question type for the survey(${
      genType === "quiz" && " except open-ended"
    }).`;

    const output = await generate({
      model: geminiPro.name,
      prompt: prompt,
      output: {
        format: "json",
        schema: z.object({
          keywordContext: z.string(),
          relatedUserTaste: zUserTasteValues.nullable(),
          questionType: zSurveyQuestionTypeEnum,
        }),
      },
    });

    let result = output.output();

    if (!result?.keywordContext) {
      throw new Error("Failed to generate keyword context.");
    }

    if (!result?.questionType) {
      result.questionType = zSurveyQuestionTypeEnum.Enum.single_select;
    }

    return result;
  },

  generateUserTasteSurvey: async (input: {
    genType: z.infer<typeof zGenTypeEnum>;
    keywordContext: string;
    relatedUserTaste?: z.infer<typeof zUserTasteValues> | null;
    questionType: z.infer<typeof zSurveyQuestionTypeEnum>;
  }) => {
    const { keywordContext, relatedUserTaste, questionType, genType } = input;

    const prompt = `You are a surveyor trying to understand the user's ${
      genType === "quiz"
        ? " knowledge through a quiz"
        : "taste/likes through a survey"
    }. User's new interest context: ${JSON.stringify(keywordContext)}. ${
      relatedUserTaste
        ? `Known User Taste: ${JSON.stringify(relatedUserTaste)}.`
        : ""
    } Generate a ${genType} on user's new interest context based on their known taste info (do not mention it in the survey). The ${genType} question type must be: ${questionType}. ${
      questionType === "single_select" || questionType === "multiple_select"
        ? "Provide multiple options."
        : ""
    }${
      genType === "quiz" &&
      " options must have at least one isCorrect set to true."
    } Output: question, subtitle, keywords (new keywords for that question), options (if required).`;

    const output = await generate({
      model: geminiPro.name,
      prompt: prompt,
      output: {
        format: "json",
        schema: zSurveyModel
          .pick({
            question: true,
            subtitle: true,
            options: true,
            keywords: true,
          })
          .extend({
            extra: z.object({ surveyIntent: z.string().optional() }).optional(),
          }),
      },
    });

    let result = output.output();
    const keywords = result?.keywords || [];
    let outputSurveyData = customSurveyFields("plain", {
      ...result,
      keywords: [keywordContext, ...keywords],
      ui: {
        questionType: input.questionType,
      },
      type: "userInfo_survey",
    });

    return outputSurveyData;
  },
};
