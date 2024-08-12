import { geminiPro } from "@genkit-ai/googleai";
import { generate } from "@genkit-ai/ai";
import {
  zSurveyModel,
  zSurveyOption,
  zSurveyOptionSingle,
  zSurveyOptions,
  zSurveyQuestionTypeEnum,
  zSurveyUiStyleEnum,
} from "../../../types/_data.survey";
import { zUserInfoModelType } from "../../../types/_data.userInfo";
import { z } from "zod";
import { customSurveyFields } from "../../helpers/surveyHelpers";
import { zUserTasteValues } from "../../../types/_zod.userInfo";
import { zInterestSchema } from "../../../types/_data.interest";
import { RandomHelper } from "../../../utils/random";
import { ImageGenSdk } from "../../../service/imageGenSdk";

export const InterestSurveyHelper = {
  determineNextKeywordContext: async (input: {
    userTaste: zUserInfoModelType["userTaste"];
    interest: z.infer<typeof zInterestSchema>;
  }) => {
    const { interest, userTaste } = input;

    const prompt = `You are an examinor trying to understand the user's knowledge on topic ${
      interest.title
    } through a quiz. ${
      userTaste
        ? " known user taste data: " + JSON.stringify(userTaste) + "."
        : ""
    }
    known context for quiz: ${JSON.stringify(
      interest.context
    )}. Generate a keyword for the next quiz from known context and, based on this newly generated keyword, select a related user taste from the known data. Also, choose a suitable question type for the quiz( except open-ended).`;

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

  genInterestQuiz: async (input: {
    keywordContext: string;
    relatedUserTaste?: z.infer<typeof zUserTasteValues> | null;
    questionType: z.infer<typeof zSurveyQuestionTypeEnum>;
  }) => {
    const { keywordContext, relatedUserTaste, questionType } = input;

    const prompt = `You are an examinor trying to understand the user's knowledge through a quiz. User's new interest keyword: ${keywordContext}. ${
      relatedUserTaste
        ? `Known User Taste: ${JSON.stringify(relatedUserTaste)}.`
        : ""
    } Generate a quiz on user's new interest context based on their known taste info (do not mention it in the survey). The quiz question type must be: ${questionType}. ${
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
        learningQuizBottomSlider: true,
        isAnswerInOption:
          (result?.options ?? [])?.findIndex((opt) => opt?.isCorrect) > -1
            ? true
            : false,
        // selectionStyle: (result?.options ?? []).filter(
        //   (option) => (option.image != undefined || option.icon != undefined)
        // ).length > 0 ? "card_choices" : "quiz_vertical_choices",
      },
      type: "interest_casual_quiz",
    });

    return outputSurveyData;
  },

  genInterestQuiz2: async (input: {
    difficultyContext?: string;
    keywordContext: string;
    tasteContext?: string;
    questionType: z.infer<typeof zSurveyQuestionTypeEnum>;
  }) => {
    const optionFIlls = RandomHelper.pickOneAtRandom([
      "emoji",
      "image",
      "plain",
    ]);
    //You are an examinor trying to test the user's knowledge
    const prompt = `${
      input.difficultyContext
        ? input.difficultyContext
        : `You are an tutor trying to teach the user knowledge in the below field through a quiz.`
    }
    ${input.keywordContext} 
    Create a simple but interesting quiz question that is ${
      input.questionType === "boolean"
        ? " in the format of a yes or no question."
        : `a multiple choice with ${
            input.questionType === "single_select"
              ? "one correct answer in options."
              : "multiple correct answers in options."
          } options must have at least one isCorrect set to true.
          No emojis in label. maximum 4 options.
          labelDescription must explain the option, and why it is correct or wrong.
          ${
            optionFIlls === "emoji"
              ? "Fill icon in option with emoji (not check/wrong)."
              : optionFIlls === "image"
              ? "Fill image in option with a short keyword for image search (only if suitable)."
              : ""
          }`
    } 
    ${
      input.tasteContext
        ? `Make use of the following users taste.  User ${JSON.stringify(
            input.tasteContext
          )}.`
        : ""
    }
    Output must also include: question, subtitle, keywords (new keywords for that question),
    ${
      input.questionType === "boolean"
        ? "booleanAnswer (if answer is yes - true , no - false),"
        : "options,"
    } hint, explanation.
    `;

    const output = await generate({
      model: geminiPro.name,
      prompt: prompt,
      output: {
        format: "json",
        schema: zSurveyModel
          .pick({
            question: true,
            subtitle: true,
            keywords: true,
          })
          .extend({
            ...(input.questionType === "boolean"
              ? {}
              : {
                  options: z
                    .array(zSurveyOptionSingle.omit({ value: true }))
                    .optional(),
                }),
            //surveyIntent: z.string().optional().nullable(),
            hint: z.string().optional().nullable(),
            explanation: z.string().optional().nullable(),
            booleanAnswer: z.boolean().optional().nullable(),
          }),
      },
    });

    let result = output.output();
    const keywords = result?.keywords || [];
    let filteredOptions: zSurveyOption[] =
      (result?.options as zSurveyOption[])?.map((opt) => ({
        ...opt,
        icon:
          opt.icon &&
          opt.icon != "✅" &&
          opt.icon != "❌" &&
          opt.icon != "🚫" &&
          opt.icon != "🛑" &&
          opt.icon != "✔️" &&
          opt.icon != "✖️" &&
          opt.icon != "☑️" &&
          opt.icon != "🆗"
            ? opt.icon
            : undefined,
      })) ?? [];

    if (
      optionFIlls === "image" &&
      result?.options &&
      (result?.options as zSurveyOption[]).filter((opt) => opt?.image).length >
        0
    ) {
      filteredOptions = await Promise.all(
        (result?.options as zSurveyOption[]).map(async (opt) => {
          const images = await ImageGenSdk.generateImages(opt.image as string, {
            imageType: "stock",
            source: "unsplash",
          });
          return images && images.length > 0
            ? {
                ...opt,
                image: images[0].image,
              }
            : opt;
        })
      );
    }

    let outputSurveyData = customSurveyFields(optionFIlls as any, {
      question: result?.question,
      subtitle: result?.subtitle ?? undefined,
      options: filteredOptions,
      logic: {
        booleanAnswer: result?.booleanAnswer ?? undefined,
      },
      extra: {
        //surveyIntent: result?.surveyIntent ?? undefined,
        hint: result?.hint ?? undefined,
        explanation: result?.explanation ?? undefined,
      },
      keywords: [...keywords],
      ui: {
        questionType: input.questionType,
        learningQuizBottomSlider: true,
        isQuiz: true,
        isAnswerInOption:
          ((result?.options as zSurveyOption[]) ?? [])?.findIndex(
            (opt) => opt?.isCorrect
          ) > -1
            ? true
            : false,
        // selectionStyle: (result?.options ?? []).filter(
        //   (option) => (option.image != undefined || option.icon != undefined)
        // ).length > 0 ? "card_choices" : "quiz_vertical_choices",
      },
      type: "interest_casual_quiz",
    });

    if (!outputSurveyData.question) {
      throw new Error("Failed to generate question.");
    }
    return outputSurveyData;
  },
};
