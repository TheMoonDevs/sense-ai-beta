import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import {
  zSurveyLinkedRootTypeEnum,
  zSurveyModel,
  zSurveyOptions,
} from "../../types/_data.survey";
import { SurveyModel } from "../../models/_db.survey";
import { zId } from "../../types/_zod.common";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { updateTrackerModel } from "../helpers/updateTrackerModels";
import { UserInterestModel } from "../../models/_db.userInterest";
import { InterestModel } from "../../models/_db.interest";
import { UserActivityModel } from "../../models/_db.userActivity";

export const submitSurveyResponseFlow = defineFlow(
  {
    name: "submitSurveyResponseFlow",
    inputSchema: z.object({
      linked_id: zId,
      linked_type: zSurveyLinkedRootTypeEnum,
      user_id: zId,
      surveyId: zId,
      learning_topic_id: z.string().optional(),
      subtopic_id: z.string().optional(),
      screen: z.string().optional(),
      response: z
        .object({
          single: z.string().optional().or(z.number().optional()),
          mixed: z.any().optional(),
          multiple: z.array(z.string().or(z.number())).optional(),
          openEndedInput: z.string().optional(),
          boolean: z.boolean().optional(), // if booleantype
          checked: z.boolean().optional(), // only to check if clicked on ui
          submitted: z.boolean().optional(), // if submitted
          correctlyAnswered: z.boolean().optional(), // if correctly answered
        })
        .optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      status: z.object({}).passthrough().optional(),
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
    if (!input.response) {
      return {
        success: false,
        status: {
          code: 400,
          message: "Response must be provided.",
        },
      };
    }

    if (!input.surveyId) {
      return {
        success: false,
        status: {
          code: 400,
          message: "Survey ID must be provided.",
        },
      };
    }

    try {
      if (input.linked_type === "interest" && input.linked_id) {
        await run("Update Interest", async () => {
          try {
            await InterestModel.findByIdAndUpdate(input.linked_id, {
              $inc: { popularity: 0.00000001 },
            });
          } catch (error) {
            console.error("Failed to update interest:", error);
            throw new Error("Failed to update interest popularity.");
          }
        });

        await run("Update User Interest", async () => {
          try {
            const updateQuery = {
              user_id: input.user_id,
              interest_id: input.linked_id,
            };

            const updateData: any = {
              $inc: { submitted: 1 },
              $set: { lastSubmitted: new Date() },
            };

            if (input.learning_topic_id) {
              updateData.$inc["topics.$[topic].submitted"] = 1;
              updateData.$set["topics.$[topic].lastSubmitted"] = new Date();
            }

            if (input.subtopic_id) {
              updateData.$inc[
                "topics.$[topic].subtopics.$[subtopic].submitted"
              ] = 1;
              updateData.$set[
                "topics.$[topic].subtopics.$[subtopic].lastSubmitted"
              ] = new Date();
            }

            await UserInterestModel.updateOne(updateQuery, updateData, {
              arrayFilters: [
                { "topic.id": input.learning_topic_id || "" },
                { "subtopic.id": input.subtopic_id || "" },
              ],
            });
          } catch (error) {
            console.error("Failed to update user interest:", error);
            throw new Error("Failed to update user interest.");
          }
        });

        if (input.learning_topic_id) {
          await run("Update Learning Topic Tracker", async () => {
            try {
              await updateTrackerModel({
                user_id: input.user_id,
                interest_id: input.linked_id,
                topic_id: input.learning_topic_id || "",
                topic_type: "learning_topic",
                isCorrect: input.response?.correctlyAnswered || false,
              });
            } catch (error) {
              console.error("Failed to update learning topic tracker:", error);
              throw new Error("Failed to update learning topic tracker.");
            }
          });
        }

        if (input.subtopic_id) {
          await run("Update Subtopic Tracker", async () => {
            try {
              await updateTrackerModel({
                user_id: input.user_id,
                interest_id: input.linked_id,
                topic_id: input.subtopic_id || "",
                topic_type: "subtopic",
                isCorrect: input.response?.correctlyAnswered || false,
              });
            } catch (error) {
              console.error("Failed to update subtopic tracker:", error);
              throw new Error("Failed to update subtopic tracker.");
            }
          });
        }
      }

      await run("Save Survey Response", async () => {
        try {
          await SurveyModel.findByIdAndUpdate(input.surveyId, {
            $set: {
              response: input.response,
            },
          });
        } catch (error) {
          console.error("Failed to save survey response:", error);
          throw new Error("Failed to save survey response.");
        }
      });

      await run("Update User Activity", async () => {
        try {
          await UserActivityModel.create({
            user_id: input.user_id,
            linked_interest_id: input.linked_id,
            linked_survey_id: input.surveyId,
            type: "feed_quiz",
            action: "submit",
            screen: input.screen || "feed",
          });
        } catch (error) {
          console.error("Failed to update user activity:", error);
          throw new Error("Failed to update user activity.");
        }
      });

      return {
        success: true,
        status: {
          code: 200,
          message: "Response successfully saved.",
        },
      };
    } catch (error: any) {
      console.error("Error in submitSurveyResponseFlow:", error);
      return {
        success: false,
        status: {
          code: 500,
          message: error.message || "An unknown error occurred.",
        },
      };
    }
  }
);
