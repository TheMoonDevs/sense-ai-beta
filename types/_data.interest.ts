import { z } from "zod";
import { zId } from "./_zod.common";
import { zImageType } from "./_data.images";
import { specifity } from "./_zod.prompt";

export const zInterestTypeEnum = z.enum([
  "keyword",
  "category",
  "curated",
  "subject",
]);

export const zInterestRootEnum = z.enum([
  "promptQuery",
  "searchQuery",
  "likedCourse",
  "surpriseCorrectAnswer",
  "curatedInterest",
]);

// example -
export const zLearningTopicSchema = z.object({
  title: z.string().optional(), //
  description: z.string().optional(), // information about the topic.
  depthLevel: z.number().optional(), // from 1 to 10.
  broadnessOfTopic: z.number().optional(), // from 1 to 10
  // suggestedQuizStyle: z.enum(["choose_from_options", "true_false", "open_ended"]).optional(), // suggested quiz style.
  subTopics: z.array(z.string()).optional(), // array of specific sub topics under this topic.
  subTopicObjects: z
    .array(
      z.object({
        text: z.string(),
        numberOfQuestions: z.number(),
      })
    )
    .optional(),
  //prompts: z.array(z.string()).optional() // an array of prompt to generate knowledge.
  subLearningTopics: z.array(z.any()).optional(),
});

export const zInterestSchema = z.object({
  _id: zId,
  interest_id: z.string().optional(),
  parent_interest: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  image: z.string().optional(),
  images: z.array(zImageType).optional(),
  interestType: zInterestTypeEnum.optional(),
  rootType: zInterestRootEnum.optional(),
  context: z.object({
    description: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    prompt: z.string().optional(),
    imageKeyword: z.string().optional(),
  }),
  breakdown: z
    .object({
      domain: z.string().optional(),
      field: z.string().optional(),
      specifity: specifity,
    })
    .optional(),
  learningTopics: z.array(zLearningTopicSchema).optional(),
  domain: z.string().optional(),
  isCurated: z.boolean().optional(),
  isEditorsPick: z.boolean().optional(),
  popularity: z.number().min(0).max(1).default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  connectedPrefs: z.array(z.any()).optional(),
});

export type InterestSchemaType = z.infer<typeof zInterestSchema>;

export const zInterestCuration = z.object({
  id: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  icon: z.string().optional(),
  sort: z.enum(["popularity", "createdAt", "updatedAt", "other"]),
  order: z.enum(["asc", "desc"]),
  searchTerms: z.array(z.string()),
  data: z.array(zInterestSchema).optional(),
  isGeneratable: z.boolean().optional(),
  imageSize: z.number().optional(),
});
