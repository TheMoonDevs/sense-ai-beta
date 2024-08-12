import { defineFlow, run, runFlow } from "@genkit-ai/flow";
import { z } from "zod";
import { zFeedModel, zFeedModelType } from "../../types/_data.feed";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { generate } from "@genkit-ai/ai";
import { geminiPro } from "@genkit-ai/googleai";
import {
  InterestSchemaType,
  zInterestSchema,
} from "../../types/_data.interest";
import {
  zSurveyModel,
  zSurveyModelType,
  zSurveyResponseTypeEnum,
} from "../../types/_data.survey";
import { HomeFeedModel } from "../../models/_db.feed";
import { InterestModel } from "../../models/_db.interest";
import { SurveyModel } from "../../models/_db.survey";
import { genInterstQuizFlow } from "../survey/interest_survey/genInterstQuizFlow";
import { genUserTasteSurveyFlow } from "../survey/userTaste_survey/genUserTasteSurvey";

// TODO: setup pagination later depending on home feed requirements
export const genHomeFeedFlow = defineFlow(
  {
    name: "genHomeFeedFlow",
    inputSchema: z.object({
      user_id: z.string().optional(),
    }),
    outputSchema: z.object({
      success: z.boolean().optional(),
      response: z.object({}).optional(),
    }),
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
    if (!input?.user_id) {
      throw new Error("User Id is required");
    }
    const user_id = input.user_id;
    // fetch user interests.
    // fetch general curated interests based on popularity.
    // fetch general curated prompts based on popularity.
    // TODO: if more than 1 home feed in this curated prompt with interaction > 0,
    // then generate more with higher priority - priority is dependent on the count of feed with interaction > 0,
    // insert a survey to add the curated prompt (course) to his saved group.
    // TODO:
    // fetch users current casual courses.
    // and then generate home feed based on these (atleast 30).

    const fetchedCuratedInterests = await run(
      "Fetch Popular Interests",
      async () => {
        const interests = (await InterestModel.find(
          {
            isCurated: true,
            rootType: "curatedInterest",
            interestType: "subject",
          },
          null,
          {
            sort: { popularity: -1 },
            limit: 30,
          }
        )
          .lean()
          .exec()) as InterestSchemaType[];
        const feedStats = await HomeFeedModel.aggregate([
          {
            $match: {
              interest_id: {
                $in: interests.map((i) => i._id),
              },
            },
          },
          {
            $group: {
              _id: "$interest_id",
              count: { $sum: 1 },
              interaction: { $sum: "$interaction" },
            },
          },
        ]).exec();
        return {
          interests,
          feedStats,
        };
      }
    );
    const surveys = await Promise.all(
      fetchedCuratedInterests.interests.map(async (interest) => {
        try {
          let _surveys = [];
          console.log("interest", interest);
          const interestQuiz = await runFlow(
            genInterstQuizFlow,
            {
              user_id,
              surveyConfig: {
                linked_type: "interest",
                linked_id: interest._id,
                surveyTypeId: "feed_interest_quiz",
              },
              interest,
            },
            {
              withLocalAuthContext: { _id: user_id },
            }
          );
          const userTasteSurvey = await runFlow(
            genUserTasteSurveyFlow,
            {
              user_id,
              context: interest.context,
              surveyConfig: {
                genType: "survey",
                linked_type: "interest",
                linked_id: interest._id,
                surveyTypeId: "feed_userTaste_survey",
              },
            },
            {
              withLocalAuthContext: { _id: user_id },
            }
          );
          if (interestQuiz) {
            _surveys.push(interestQuiz);
          }
          if (userTasteSurvey) {
            _surveys.push(userTasteSurvey);
          }
          return _surveys;
        } catch (err) {
          console.error("Error generating survey", err);
          return undefined;
        }
      })
    ).then((results) => results.flat());

    // const surveys = await Promise.all(gen_surveys);
    console.log("surveys", surveys);

    const successfulSurveys = surveys.filter(
      (_result) => _result != undefined || _result != null
    );

    const gen_feed = successfulSurveys.map(async (survey) => {
      if (!survey) {
        return undefined;
      }
      const surveyFeed = await HomeFeedModel.create({
        user_id: input.user_id,
        rootType: "curatedInterest",
        interest_id: survey?.linked_id,
        feedType: survey?.surveyTypeId?.endsWith("_quiz") ? "quiz" : "survey",
        priority: 1,
        interaction: 0,
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        uiSettings: {
          skippable: false,
        },
        linked_survey_id: survey?._id,
        //linkedSurvey: survey,
      });
      return surveyFeed.toJSON() as zFeedModelType;
    });

    const generatedFeed = await run("Generate Home Feed", async () => {
      return (await Promise.all(gen_feed)).filter(
        (_result) => _result != undefined
      );
    });

    return {
      success: true,
      response: {
        fetchedCuratedInterests,
        generatedFeed,
      },
    };
  }
);
