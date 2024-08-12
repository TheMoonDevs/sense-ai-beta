import { defineFlow, run, runFlow } from "@genkit-ai/flow";
import { z } from "zod";
import {
  zSurveyLinkedRootTypeEnum,
  zSurveyModel,
  zSurveyQuestionTypeEnum,
} from "../../../types/_data.survey";
import { SurveyModel } from "../../../models/_db.survey";
import { UserInfoModel } from "../../../models/_db.userInfo";
import { InterestSurveyHelper } from "./_gen.interestQuiz";
import { zInterestSchema } from "../../../types/_data.interest";
import deserializeSenseUser from "../../../middleware/deserializeUser";
import { zId } from "../../../types/_zod.common";
import { UserPreferencesModel } from "../../../models/_db.userPrefs";
import { InterestModel } from "../../../models/_db.interest";
import { RandomHelper } from "../../../utils/random";
import { zUserPrefModel } from "../../../types/_data.userPrefs";

export const genInterstQuizFlow2 = defineFlow(
  {
    name: "genInterstQuizFlow2",
    inputSchema: z.object({
      user_id: zId,
      surveyConfig: z
        .object({
          linked_type: zSurveyLinkedRootTypeEnum.optional().nullable(),
          linked_id: zId,
          surveyTypeId: z.any().optional().nullable(),
        })
        .optional(),
      interest: zInterestSchema.optional(),
      interest_id: z.string().optional(),
      tasteEffect: z.number().optional(),
      tasteContext: z.string().optional(),
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

    if (!input.interest_id && !input.interest) {
      throw new Error("Interest ID or Interest object must be provided.");
    }

    // fetch interest if not provided
    if (!input.interest) {
      const interest = await run("Get Interest", async () => {
        return await InterestModel.findOne({
          interest_id: input.interest_id,
        }).exec();
      });
      input.interest = interest;
    }

    if (!input.tasteEffect) {
      input.tasteEffect = 0;
    }

    let userInfoPref: typeof zUserPrefModel._type | null = null;
    if (input.tasteEffect > 0) {
      // GET USER Info - pick one at random.
      // 0 <<<< taste close to interest < 0.5 < random taste of user <<<<1
      userInfoPref = await run("Get User Taste", async () => {
        const _userInfos = await UserPreferencesModel.find(
          { user_id: input.user_id },
          {},
          {
            sort: {
              createdAt: -1,
            },
          }
        ).exec();
        return _userInfos[0];
      });
    }

    if (!input.interest) {
      throw new Error("Interest not found");
    }

    const randomTopic =
      input.interest.learningTopics && input.interest.learningTopics?.length > 0
        ? RandomHelper.pickOneAtRandom(input.interest.learningTopics)
        : null;
    const randomSUbtopic = randomTopic
      ? randomTopic.subTopicObjects && randomTopic.subTopicObjects.length > 0
        ? `${
            RandomHelper.pickOneAtRandom(randomTopic.subTopicObjects).text
          } is a subtopic under ${randomTopic.title}`
        : `${randomTopic.title} is a topic under ${input.interest.title}`
      : input.interest.domain
      ? `${input.interest.title} is a topics under ${input.interest.domain}`
      : `${input.interest.title} is the topic and some context: ${input.interest.context.description}`;

    //TODO: GENERATE QUESTION TYPE

    // GENERATE QUIZ
    const generated_quiz = await run("Generate Interest Quiz", async () => {
      return await InterestSurveyHelper.genInterestQuiz2({
        keywordContext: randomSUbtopic,
        tasteContext:
          input.tasteContext ??
          (userInfoPref?.action
            ? userInfoPref.action + userInfoPref.subject
            : undefined),
        questionType: RandomHelper.pickOneAtRandom(
          Object.values(zSurveyQuestionTypeEnum.Values)
        ),
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
