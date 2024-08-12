import { run } from "@genkit-ai/flow";
import { HomeFeedModel } from "../../models/_db.feed";
import { zFeedModelType } from "../../types/_data.feed";
import { zSurveyModelType } from "../../types/_data.survey";

export const FeedCOnverter = {
  convertQuizToFeed: async (
    surveys: (zSurveyModelType | undefined)[],
    user_id: string
  ) => {
    const successfulSurveys = surveys.filter(
      (_result) => _result != undefined || _result != null
    );

    const gen_feed = successfulSurveys.map(async (survey) => {
      if (!survey) {
        return undefined;
      }
      const surveyFeed = await HomeFeedModel.create({
        user_id: user_id,
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

    // console.log(
    //   "generatedFeed Ids",
    //   generatedFeed.map((feed) => feed?.linked_survey_id),
    //   successfulSurveys.map((survey) => survey?._id),
    //   successfulSurveys.find(
    //     (survey) =>
    //       survey?._id?.toString() ===
    //       generatedFeed[0]?.linked_survey_id?.toString()
    //   )
    // );
    return generatedFeed.map((_feed) => ({
      ..._feed,
      linked_survey_id: successfulSurveys.find(
        (_survey) =>
          _survey?._id?.toString() === _feed?.linked_survey_id?.toString()
      ) as zSurveyModelType | undefined,
      //linkedSurvey: feed?.linked_survey_id,
      //inserted:
    }));
  },
};
