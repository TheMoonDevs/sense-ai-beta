// import { defineFlow, run, runFlow } from "@genkit-ai/flow";
// import { z } from "zod";
// import {
//   zSurveyLinkedRootTypeEnum,
//   zSurveyModel,
// } from "../../types/_data.survey";
// import { SurveyModel } from "../../models/_db.survey";
// import { UserInfoModel } from "../../models/_db.userInfo";
// import { UserInterestSurveyHelper } from "./_gen.userInterest";
// import { zId } from "../../types/_zod.common";
// import { UserInterestModel } from "../../models/_db.userInterest";
// import { HomeFeedModel } from "../../models/_db.feed";
// import { zFeedModel, zFeedModelType } from "../../types/_data.feed";
// import { UserInterestTrackerModel } from "../../models/_db.userInterestTracker";

// export const genUserInterestQuizFlow = defineFlow(
//   {
//     name: "genUserInterestQuizFlow",
//     inputSchema: z.object({
//       user_id: zId,
//       interest_id: zId,
//       topic_id: zId.optional(),
//       topic_type: z.enum(["learningTopic", "subtopic"]).optional(),
//       surveyCount: z.number().optional(),
//       retryCount: z.number().optional(),
//     }),
//     outputSchema: z.object({
//       surveys: z.array(zSurveyModel).optional(),
//       feeds: z.array(zFeedModel).optional(),
//     }),
//   },
//   async (input) => {
//     if (!input.user_id) {
//       throw new Error("User ID must be provided.");
//     }

//     const surveyCount = input?.surveyCount || 10;

//     const userInterest = await run("Get User Interest", async () => {
//       return await UserInterestModel.findOne({
//         user_id: input.user_id,
//         interest_id: input?.interest_id,
//       }).exec();
//     });

//     let selected_topic =
//       input?.topic_type === "learningTopic" ? input?.topic_id || null : null;
//     let selected_subtopic =
//       input?.topic_type === "subtopic" ? input?.topic_id || null : null;

//     // Sort topics by depthLevel in ascending order
//     const sortedTopics = (userInterest?.topics || []).sort(
//       (a: any, b: any) => a.depthLevel - b.depthLevel
//     );

//     if (selected_topic && !selected_subtopic) {
//       // If we have a selected topic but not a subtopic, find the subtopic with less than 10 generated
//       const topic = sortedTopics.find((t: any) => t.id === selected_topic);
//       if (topic) {
//         const subtopic = topic.subtopics.find((st: any) => st.generated < 10);
//         if (subtopic) {
//           selected_subtopic = subtopic.id;
//         } else {
//           throw new Error("No subtopic found for user interest");
//         }
//       }
//     } else if (!selected_topic && selected_subtopic) {
//       // If we have a selected subtopic but not a topic, find the topic containing this subtopic
//       for (const topic of sortedTopics) {
//         const subtopic = topic.subtopics.find(
//           (st: any) => st.id === selected_subtopic
//         );
//         if (subtopic) {
//           selected_topic = topic.id;
//           break;
//         } else {
//           throw new Error("No topic found for user interest");
//         }
//       }
//     } else if (!selected_topic && !selected_subtopic) {
//       // If neither topic nor subtopic is selected, find the first subtopic with less than 10 generated
//       for (const topic of sortedTopics) {
//         for (const subtopic of topic?.subtopics || []) {
//           if (subtopic.generated < 10) {
//             selected_subtopic = subtopic.id;
//             selected_topic = topic.id;
//             break;
//           }
//         }
//         if (selected_subtopic) {
//           break;
//         }
//       }
//     }

//     if (!selected_topic || !selected_subtopic) {
//       throw new Error("No topic or subtopic found for user interest");
//     }

//     let subtopicTracker = await UserInterestTrackerModel.findOne({
//       user_id: input.user_id,
//       topic_type: "subtopic",
//       topic_id: selected_subtopic,
//     });

//     if (!subtopicTracker) {
//       subtopicTracker = await UserInterestTrackerModel.create({
//         user_id: input.user_id,
//         interest_id: input?.interest_id,
//         topic_type: "subtopic",
//         topic_id: selected_subtopic,
//         knowledgePoints: [],
//       });
//     }

//     let topicTracker = await UserInterestTrackerModel.findOne({
//       user_id: input.user_id,
//       topic_type: "learningTopic",
//       topic_id: selected_topic,
//     });

//     if (!topicTracker) {
//       topicTracker = await UserInterestTrackerModel.create({
//         user_id: input.user_id,
//         interest_id: input?.interest_id,
//         topic_type: "learningTopic",
//         topic_id: selected_topic,
//         knowledgePoints: [],
//       });
//     }

//     // GENERATE KEYWORDS
//     const output = await run("Generate Keyword for next survey", async () => {
//       return await UserInterestSurveyHelper.genSurveyKeywords({
//         topic: selected_topic,
//         subTopic: selected_subtopic,
//         knowledgePoints: subtopicTracker.knowledgePoints,
//         surveyCount,
//       });
//     });

//     if (!output?._keywords) {
//       console.log(output);
//       throw new Error("Failed to generate keyword context.");
//     }
//     const { _keywords } = output;

//     console.log("Generated Keywords: ", _keywords);

//     // GENERATE & SAVE SURVEY
//     const saved_surveys = await run("Generate & Save Survey", async () => {
//       const surveyPromises = _keywords?.map(async (keyInfo) => {
//         let generated_survey;
//         let surveyCreated;
//         let retryCount = 0;
//         const maxRetries = input?.retryCount || 1;

//         while (!surveyCreated && retryCount < maxRetries) {
//           try {
//             generated_survey =
//               await UserInterestSurveyHelper.generateUserInterestSurvey({
//                 keywordContext: keyInfo.keyword,
//                 questionType: keyInfo.questionType,
//               });
//             surveyCreated = await SurveyModel.create({
//               ...generated_survey,
//               user_id: input.user_id,
//               linked_type: "interest",
//               linked_id: userInterest.interst_id,
//               surveyTypeId: `userInterest_survey`,
//               extra: {
//                 ...generated_survey.extra,
//                 user_interest_id: userInterest.interst_id,
//                 topic_id: selected_topic,
//                 subtopic_id: selected_subtopic,
//               },
//             });
//           } catch (error) {
//             retryCount++;
//             console.error(
//               `Error generating survey, retrying (${retryCount}/${maxRetries})...`,
//               error
//             );
//           }
//         }

//         if (!surveyCreated) {
//           console.error(
//             `Failed to generate survey after ${maxRetries} attempts.`
//           );
//         }

//         return surveyCreated;
//       });

//       return await Promise.all(surveyPromises || []);
//     });

//     const gen_feed = saved_surveys.map(async (survey) => {
//       if (!survey) {
//         return undefined;
//       }
//       const surveyFeed = await HomeFeedModel.create({
//         user_id: input.user_id,
//         rootType: "curatedInterest",
//         interest_id: survey?.linked_id,
//         feedType: "quiz",
//         priority: 1,
//         interaction: 0,
//         expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
//         uiSettings: {
//           skippable: false,
//         },
//         linked_survey_id: survey?._id,
//       });
//       return surveyFeed.toJSON() as zFeedModelType;
//     });

//     const generatedFeed = await run("Generate Home Feed", async () => {
//       return (await Promise.all(gen_feed)).filter(
//         (_result) => _result != undefined
//       );
//     });

//     await run("Save KnowledgePoints to Trackers", async () => {
//       subtopicTracker.knowledgePoints = [
//         ...subtopicTracker?.knowledgePoints,
//         ..._keywords.map((keyInfo) => keyInfo.keyword),
//       ];

//       topicTracker.knowledgePoints = [
//         ...topicTracker?.knowledgePoints,
//         ..._keywords.map((keyInfo) => keyInfo.keyword),
//       ];

//       await subtopicTracker.save();
//       await topicTracker.save();
//     });

//     const no_of_generated_surveys = saved_surveys?.length || 0;

//     await run("Update User Interest", async () => {
//       userInterest.generated += no_of_generated_surveys;
//       userInterest.topics.find(
//         (topic: any) => topic.id === selected_topic
//       ).generated += no_of_generated_surveys;
//       userInterest.topics
//         .find((topic: any) => topic.id === selected_topic)
//         .subtopics.find(
//           (subtopic: any) => subtopic.id === selected_subtopic
//         ).generated += no_of_generated_surveys;
//       userInterest.topics.find(
//         (topic: any) => topic.id === selected_topic
//       ).lastGenerated = new Date();
//       userInterest.topics
//         .find((topic: any) => topic.id === selected_topic)
//         .subtopics.find(
//           (subtopic: any) => subtopic.id === selected_subtopic
//         ).lastGenerated = new Date();

//       await userInterest.save();
//     });

//     return {
//       surveys: saved_surveys,
//       feeds: generatedFeed as zFeedModelType[],
//     };
//   }
// );
