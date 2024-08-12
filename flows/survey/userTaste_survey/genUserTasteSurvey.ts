import { defineFlow, run, runFlow } from "@genkit-ai/flow";
import { z } from "zod";
import {
  zSurveyLinkedRootTypeEnum,
  zSurveyModel,
} from "../../../types/_data.survey";
import { SurveyModel } from "../../../models/_db.survey";
import { UserInfoModel } from "../../../models/_db.userInfo";
import { UserTasteSurveyHelper } from "./_gen.userTaste";
import { zGenTypeEnum } from "../../../types/_zod.survey";
import { zId } from "../../../types/_zod.common";

export const genUserTasteSurveyFlow = defineFlow(
  {
    name: "genUserTasteSurveyFlow",
    inputSchema: z.object({
      user_id: zId,
      context: z.any().optional().nullable(),
      surveyConfig: z
        .object({
          linked_type: zSurveyLinkedRootTypeEnum.optional().nullable(),
          linked_id: zId,
          surveyTypeId: z.any().optional().nullable(),
          genType: zGenTypeEnum.optional().nullable(),
        })
        .optional(),
    }),
    outputSchema: zSurveyModel.omit({ response: true }).optional().nullable(),
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
        return await UserTasteSurveyHelper.determineNextKeywordContext({
          genType: input?.surveyConfig?.genType || "survey",
          userTaste: userInfo?.userTaste,
          context: input?.context,
        });
      }
    );

    // GENERATE SURVEY
    const generated_survey = await run(
      "Generate User Taste Survey",
      async () => {
        return await UserTasteSurveyHelper.generateUserTasteSurvey({
          genType: input?.surveyConfig?.genType || "survey",
          keywordContext,
          relatedUserTaste,
          questionType,
        });
      }
    );

    // SAVE GENERATED SURVEYS
    const saved_survey: z.infer<typeof zSurveyModel> = await run(
      "Save Survey",
      async () => {
        return await SurveyModel.create({
          user_id: input.user_id,
          linked_type: input?.surveyConfig?.linked_type || "user_info",
          linked_id: input?.surveyConfig?.linked_id || userInfo?._id,
          surveyTypeId:
            input?.surveyConfig?.surveyTypeId ||
            `userTaste_${input?.surveyConfig?.genType || "survey"}`,
          ...generated_survey,
        });
      }
    );

    return saved_survey;
  }
);
