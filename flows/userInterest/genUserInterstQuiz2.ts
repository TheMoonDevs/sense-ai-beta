import { defineFlow, run, runFlow } from "@genkit-ai/flow";
import { z } from "zod";
import {
  zSurveyLinkedRootTypeEnum,
  zSurveyModel,
  zSurveyQuestionTypeEnum,
} from "../../types/_data.survey";
import { SurveyModel } from "../../models/_db.survey";
import { UserInfoModel } from "../../models/_db.userInfo";
import { InterestSurveyHelper } from "./../survey/interest_survey/_gen.interestQuiz";
import { zInterestSchema } from "../../types/_data.interest";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { zId } from "../../types/_zod.common";
import { UserPreferencesModel } from "../../models/_db.userPrefs";
import { InterestModel } from "../../models/_db.interest";
import { RandomHelper } from "../../utils/random";
import { zUserPrefModel } from "../../types/_data.userPrefs";
import { UserInterestModel } from "../../models/_db.userInterest";
import {
  UserInterestSchemaType,
  zUserInterestSchema,
} from "../../types/_data.userInterest";
import { UserInterestSurveyHelper } from "./_gen.userInterest";
import { UserInterestTrackerModel } from "../../models/_db.userInterestTracker";
import { HomeFeedModel } from "../../models/_db.feed";

export const genUserInterstQuizFlow2 = defineFlow(
  {
    name: "genUserInterstQuizFlow2",
    inputSchema: z.object({
      user_id: zId,
      user_interest: zUserInterestSchema.optional(),
      interest_id: zId,
      surveyConfig: z
        .object({
          linked_type: zSurveyLinkedRootTypeEnum.optional().nullable(),
          linked_id: zId,
          surveyTypeId: z.any().optional().nullable(),
        })
        .optional(),
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
    let userInterest: UserInterestSchemaType | undefined = input.user_interest;
    if (!userInterest) {
      userInterest = await run("Get User Interest", async () => {
        return await UserInterestModel.findOne({
          user_id: input.user_id,
          interest_id: input?.interest_id,
        }).exec();
      });
    }

    if (!userInterest) {
      throw new Error("User is not following the interest");
    }

    if (!input.tasteEffect) {
      input.tasteEffect = 0;
    }

    // Find the corresponding Interest document
    const interest = await InterestModel.findById(input.interest_id).exec();
    if (!interest || !interest.learningTopics) {
      throw new Error("Interest or learningTopics not found");
    }

    // Prepare the update for topics and subtopics
    let updatedTopics = (userInterest.topics || []).map((topic) => {
      const correspondingLearningTopic = interest.learningTopics.find(
        (lt: any) => lt.title === topic.id
      );

      if (
        correspondingLearningTopic &&
        (!topic.subtopics || topic.subtopics.length === 0)
      ) {
        topic.subtopics = correspondingLearningTopic.subTopicObjects.map(
          (subtopic: any) => ({
            id: subtopic.text,
          })
        );
      }

      return topic;
    });

    // Check if we need to populate topics (i.e., if userInterest has no topics)
    if (!userInterest?.topics || userInterest.topics.length === 0) {
      updatedTopics = interest.learningTopics.map((lt: any) => ({
        id: lt.title,
        subtopics: lt.subTopicObjects.map((subtopic: any) => ({
          id: subtopic.text,
        })),
      }));
    }

    // Update the userInterest document in the database
    userInterest = await UserInterestModel.findOneAndUpdate(
      {
        user_id: input.user_id,
        interest_id: input.interest_id,
      },
      {
        $set: {
          topics: updatedTopics,
          lastGenerated: new Date(),
          lastSubmitted: new Date(),
        },
      },
      { new: true, upsert: true } // `upsert` ensures that a new document is created if none is found
    ).exec();

    let selected_topic: any = null;
    let selected_subtopic: any = null;

    // Sort topics by depthLevel in ascending order
    const sortedTopics = (userInterest?.topics || []).sort(
      (a: any, b: any) => a.depthLevel - b.depthLevel
    );

    for (const topic of sortedTopics) {
      for (const subtopic of topic?.subtopics || []) {
        if (!subtopic?.generated || subtopic?.generated < 10) {
          selected_subtopic = subtopic.id;
          selected_topic = topic.id;
          break;
        }
      }
      if (selected_subtopic) {
        break;
      }
    }

    if (!selected_subtopic || !selected_topic) {
      throw new Error("No subtopic found for user interest");
    }

    //TODO: GENERATE QUESTION TYPE
    let subtopicTracker = await UserInterestTrackerModel.findOneAndUpdate(
      {
        user_id: input.user_id,
        topic_type: "subtopic",
        topic_id: selected_subtopic,
      },
      {
        $setOnInsert: {
          status: "active",
          learning_topic_id: selected_topic,
          user_interest_id: userInterest?._id,
          interest_id: input?.interest_id,
          knowledgePoints: [],
        },
      },
      { upsert: true, new: true }
    );

    let topicTracker = await UserInterestTrackerModel.findOneAndUpdate(
      {
        user_id: input.user_id,
        topic_type: "learningTopic",
        topic_id: selected_topic,
      },
      {
        $setOnInsert: {
          status: "active",
          user_interest_id: userInterest?._id,
          interest_id: input?.interest_id,
          knowledgePoints: [],
        },
      },
      { upsert: true, new: true }
    );

    let _keyword: any = null;

    if (!input.tasteContext) {
      const output = await run("Generate Keyword for next survey", async () => {
        return await UserInterestSurveyHelper.genSurveyKeyword({
          topic: selected_topic,
          subTopic: selected_subtopic,
          knowledgePoints: subtopicTracker.knowledgePoints,
        });
      });

      if (!output) {
        console.log(output);
        throw new Error("Failed to generate keyword context.");
      }
      _keyword = output;
    }

    const prompt = `${selected_subtopic} is a subtopic under ${selected_topic}. The User is learning ${_keyword.keyword}.`;

    // GENERATE QUIZ
    const generated_quiz = await run("Generate Interest Quiz", async () => {
      return await InterestSurveyHelper.genInterestQuiz2({
        keywordContext: prompt,
        tasteContext: input.tasteContext || undefined, //(_keywords ? _keywords[0].keyword : undefined),
        questionType: _keyword
          ? _keyword.questionType
          : RandomHelper.pickOneAtRandom(
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
          linked_id: input?.surveyConfig?.linked_id || input?.interest_id,
          surveyTypeId:
            input?.surveyConfig?.surveyTypeId || "user_interest_quiz",
          ...generated_quiz,
          extra: {
            ...generated_quiz?.extra,
            learning_topic_id: selected_topic,
            subtopic_id: selected_subtopic,
          },
        });
      }
    );

    await run("Save KnowledgePoints to Trackers", async () => {
      await UserInterestTrackerModel.updateOne(
        {
          _id: subtopicTracker._id,
        },
        {
          $push: {
            knowledgePoints: _keyword.keyword ?? _keyword.keyword,
          },
          $inc: {
            generated: 1,
          },
          $set: {
            lastGenerated: new Date(),
          },
        }
      );

      await UserInterestTrackerModel.updateOne(
        {
          _id: topicTracker._id,
        },
        {
          $push: {
            knowledgePoints: _keyword.keyword ?? _keyword.keyword,
          },
          $inc: {
            generated: 1,
          },
          $set: {
            lastGenerated: new Date(),
          },
        }
      );
    });

    await run("Update User Interest", async () => {
      await UserInterestModel.findOneAndUpdate(
        {
          _id: userInterest?._id,
          "topics.id": selected_topic,
          "topics.subtopics.id": selected_subtopic,
        },
        {
          $inc: {
            generated: 1,
            "topics.$.generated": 1,
            "topics.$.subtopics.$[subtopic].generated": 1,
          },
          $set: {
            lastGenerated: new Date(),
            "topics.$.lastGenerated": new Date(),
            "topics.$.subtopics.$[subtopic].lastGenerated": new Date(),
          },
        },
        {
          arrayFilters: [{ "subtopic.id": selected_subtopic }],
        }
      );
    });

    return saved_quiz;
  }
);
