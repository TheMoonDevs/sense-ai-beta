import { z } from "zod";
import { zId } from "./_zod.common";

export const zUserInterestSubTopicSchema = z.object({
  id: z.string().optional(), // subtopic
  total_time_spent: z.number().optional(), // total time spent by user in this subtopic's quizes
  generated: z.number().optional(), // total sum of surveys generated for this subtopic
  submitted: z.number().optional(), // total sum of subtopics submitted
  lastGenerated: z.date().optional(), // last generated date
  lastSubmitted: z.date().optional(), // last submitted date
});

export type UserInterestSubTopicSchemaType = z.infer<
  typeof zUserInterestSubTopicSchema
>;

export const zUserInterestTopicSchema = z.object({
  id: z.string().optional(), // topic
  depthLevel: z.number().optional(), // from 1 to 10.
  broadnessOfTopic: z.number().optional(), // from 1 to 10
  total_time_spent: z.number().optional(), // used in leaderboard
  generated: z.number().optional(), // total sum of subtopics generated
  submitted: z.number().optional(), // total sum of subtopics submitted
  subtopics: z.array(zUserInterestSubTopicSchema).optional(),
  lastGenerated: z.date().optional(), // last generated date
  lastSubmitted: z.date().optional(), // last submitted date
});

export type UserInterestTopicSchemaType = z.infer<
  typeof zUserInterestSubTopicSchema
>;

export const zUserInterestSchema = z.object({
  _id: zId,
  user_id: zId.nullable().optional(),
  interest_id: zId.nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(), // active, inactive based on user follows this interest or not
  interactivityIndex: z.number().optional(), // represents how much user is interactive with this interest
  total_time_spent: z.number().optional(), // used in leaderboard
  generated: z.number().optional(), // total sum of subtopics generated
  submitted: z.number().optional(), // total sum of subtopics submitted
  topics: z.array(zUserInterestTopicSchema).optional(),
  lastGenerated: z.date().optional(), // last generated date
  lastSubmitted: z.date().optional(), // last submitted date
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type UserInterestSchemaType = z.infer<typeof zUserInterestSchema>;
