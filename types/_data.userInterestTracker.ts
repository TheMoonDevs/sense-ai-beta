import { z } from "zod";
import { zId } from "./_zod.common";

export const zUserInterestTrackerSchema = z.object({
  _id: zId,
  user_id: zId.nullable().optional(),
  interest_id: zId.nullable().optional(),
  user_interest_id: zId.nullable().optional(),
  learning_topic_id: z.string().optional(),
  topic_type: z.enum(["learningTopic", "subtopic"]).optional(),
  topic_id: z.string().optional(),
  total_points: z.number().optional(),
  status: z.enum(["active", "inactive"]).optional(), // active, inactive based on user follows this interest or not
  interactivityIndex: z.number().optional(), // represents how much user is interactive with this interest
  total_time_spent: z.number().optional(), // used in leaderboard
  generated: z.number().optional(), // total sum of subtopics generated
  submitted: z.number().optional(), // total sum of subtopics submitted
  points_distribution: z
    .array(
      z.object({
        type: z.enum(["submitted", "correct", "incorrect"]).optional(),
        count: z.number().optional(),
        points: z.number().optional(),
      })
    )
    .optional(),
  knowledgePoints: z.array(z.string()).optional(),
  lastGenerated: z.date().optional(), // last generated date
  lastSubmitted: z.date().optional(), // last submitted date
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type UserInterestTrackerSchemaType = z.infer<
  typeof zUserInterestTrackerSchema
>;
