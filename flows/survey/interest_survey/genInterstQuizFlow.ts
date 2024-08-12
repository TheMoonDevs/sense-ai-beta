import { defineFlow, run, runFlow } from "@genkit-ai/flow";
import { z } from "zod";
import {
  zSurveyLinkedRootTypeEnum,
  zSurveyModel,
} from "../../../types/_data.survey";
import { SurveyModel } from "../../../models/_db.survey";
import { UserInfoModel } from "../../../models/_db.userInfo";
import { InterestSurveyHelper } from "./_gen.interestQuiz";
import { zInterestSchema } from "../../../types/_data.interest";
import deserializeSenseUser from "../../../middleware/deserializeUser";
import { zId } from "../../../types/_zod.common";

export const genInterstQuizFlow = defineFlow(
  {
    name: "genInterstQuizFlow",
    inputSchema: z.object({
      user_id: zId,
      surveyConfig: z
        .object({
          linked_type: zSurveyLinkedRootTypeEnum.optional().nullable(),
          linked_id: zId,
          surveyTypeId: z.any().optional().nullable(),
        })
        .optional(),
      interest: zInterestSchema,
    }),
    outputSchema: zSurveyModel.omit({ response: true }).optional().nullable(),
    middleware: [deserializeSenseUser],
    authPolicy: (auth, input) => {
      console.log("auth", auth);
      if (!auth || !auth._id) {
        throw new Error("Authorization required.");
      }
      input.user_id = auth._id.toString();
    },
  },
  async (input) => {
    if (!input.user_id) {
      throw new Error("User ID must be provided.");
    }

    // GET USER Info
    const userInfo = await run("Get User Taste", async () => {
      return await UserInfoModel.findOne({ user_id: input.user_id }).exec();
    });

    // GENERATE SURVEY
    const { keywordContext, relatedUserTaste, questionType } = await run(
      "Generate Keyword for next survey",
      async () => {
        return await InterestSurveyHelper.determineNextKeywordContext({
          userTaste: userInfo?.userTaste,
          interest: input?.interest,
        });
      }
    );

    // GENERATE QUIZ
    const generated_quiz = await run("Generate Interest Quiz", async () => {
      return await InterestSurveyHelper.genInterestQuiz({
        keywordContext,
        relatedUserTaste,
        questionType,
      });
    });

    // SAVE GENERATED SURVEYS
    const saved_quiz: z.infer<typeof zSurveyModel> = await run(
      "Save Quiz",
      async () => {
        return await SurveyModel.create({
          user_id: input.user_id,
          linked_type: input?.surveyConfig?.linked_type || "interest",
          linked_id: input?.surveyConfig?.linked_id || input?.interest?._id,
          surveyTypeId:
            input?.surveyConfig?.surveyTypeId || "user_interest_quiz",
          ...generated_quiz,
        });
      }
    );

    return saved_quiz;
  }
);
