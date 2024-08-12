import { geminiPro } from "@genkit-ai/googleai";
import { generate } from "@genkit-ai/ai";
import {
  zSurveyModel,
  zSurveyModelType,
  zSurveyQuestionTypeEnum,
} from "../../types/_data.survey";
import { zUserInfoModelType } from "../../types/_data.userInfo";
import { z } from "zod";
import { customSurveyFields } from "../helpers/surveyHelpers";
import { zUserTasteValues } from "../../types/_zod.userInfo";
import { RandomHelper } from "../../utils/random";

export const UserInterestSurveyHelper = {
  genSurveyKeyword: async (input: {
    topic: string;
    subTopic: string;
    knowledgePoints: string[];
  }) => {
    const { topic, subTopic, knowledgePoints } = input;

    const keywordsCount = 6;

    const prompt = `You are an examiner trying to analyze user's knowledge on "${topic}" through quizzes.
    Generate ${keywordsCount} specific sub points for quiz questions based on "${subTopic}".
    Make sure that none of the generated points are one of these: ${JSON.stringify(
      knowledgePoints
    )}`;

    const output = await generate({
      model: geminiPro.name,
      prompt: prompt,
      output: {
        format: "json",
        schema: z.object({
          knowledgePoints: z
            .array(z.string())
            .min(keywordsCount)
            .max(keywordsCount),
          //questionType: zSurveyQuestionTypeEnum,
        }),
      },
    });
    let result = output.output();

    if (!result) {
      return null;
    }
    // Extract the generated keywords
    let generatedKeywords = result.knowledgePoints;

    let randomKeyword;

    // Filter out the keywords that already exist in the knowledgePoints array
    if (knowledgePoints) {
      generatedKeywords = generatedKeywords?.filter(
        (keyword) => !knowledgePoints.includes(keyword)
      );
    }

    // Pick one keyword at random from the filtered list
    if (!generatedKeywords || generatedKeywords?.length === 0) {
      return null; // Return null if no new keywords are available
    }

    const randomIndex = Math.floor(Math.random() * generatedKeywords.length);
    randomKeyword = generatedKeywords[randomIndex];

    return {
      keyword: randomKeyword,
      questionType: RandomHelper.pickOneAtRandom(
        Object.values(zSurveyQuestionTypeEnum.Values)
      ),
      //result?.questionType,
    };
  },
  generateUserInterestSurvey: async (input: {
    keywordContext: string;
    relatedUserTaste?: z.infer<typeof zUserTasteValues> | null;
    questionType: z.infer<typeof zSurveyQuestionTypeEnum>;
  }) => {
    const { keywordContext, questionType } = input;

    const prompt = `You are an examiner trying to understand the user's knowledge through a quiz. Generate a quiz on ${keywordContext}. The quiz question type must be: ${questionType}. ${
      questionType === "single_select" || questionType === "multiple_select"
        ? "Provide multiple options."
        : ""
    } options must have at least one isCorrect set to true. Output: question, subtitle, keywords (new keywords for that question), options (if required).`;

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
      type: "userInterest_survey",
    });

    return outputSurveyData;
  },
};
