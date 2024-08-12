import { z } from "zod";

export const zPromptBreakdownInputSchema = z.object({
  input_prompt: z.string().optional(),
  related_prompt_id: z.string().optional(),
  prompt_id: z.string().optional(),
});

export type PromptBreakdownInputType = z.infer<
  typeof zPromptBreakdownInputSchema
>;

//Random Prompts
export const zPromptRandomInputSchema = z.object({
  keywords: z.string().optional(),
});

export const zPromptRandomOutputSchema = z.object({
  prompts: z.array(
    z.object({
      prompt: z.string(),
      icon: z.string().optional(),
    })
  ),
});

// Classification
export const zPromptBreakdownClassificationOutputSchema = z.object({
  type: z
    .union([
      z.literal("question"),
      z.literal("confirmation"),
      z.literal("statement"),
      z.literal("interest"),
      z.literal("opinion"),
      z.literal("thought"),
      z.literal("skillup"),
      z.literal("field"),
      z.literal("other"),
      z.literal("unkown"),
    ])
    .default("other"),
  // classification of subject
  domain: z.string().optional(),
  field: z.string().optional(),
  //subField: z.string().optional(),
  subject: z.string().optional(),
  category: z.string().optional(),
  // classification of user & topic
  // contex
  keywords: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const zPromptDepthInputSchema = z.object({
  input_prompt: z.string().optional(),
  classification: zPromptBreakdownClassificationOutputSchema.optional(),
});

export const specifity = z
  .union([
    z.literal("broad"),
    z.literal("medium"),
    z.literal("specific"),
    z.literal("very_specific"),
    z.literal("ambiguous"),
    z.literal("uknown"),
  ])
  .optional();

export const zPromptDepthOutputSchema = z
  .object({
    // specifity of promptdepth
    promptSpecificity: specifity,
    fieldSpecificity: specifity,
    // flags
    isGeneralKnowledge: z.boolean().optional(),
    isProfessionalKnowledge: z.boolean().optional(),
    isAcademicKnowledge: z.boolean().optional(),
    // depth of learning topic
    learningDepth: z.string().optional(),
    skillLevel: z.string().optional(),
    outcomeOfAction: z.string().optional(),
    actionKind: z.string().optional(),
  })
  .passthrough();

// Alerts & finetuning
export const zPromptBreakdownAlertsOutputSchema = z.object({
  // // negative_alerts
  // is_adult_rated: z.boolean(),
  // is_opinionated: z.boolean(),
  is_contextless: z.boolean().optional(),
  is_noun: z.boolean().optional(),
  is_question: z.boolean().optional(),
  is_oneline_answer: z.boolean().optional(),
  is_non_relaistic: z.boolean().optional(),
  is_assertion: z.boolean().optional(),
  is_opinion: z.boolean().optional(),
  // optionals
  // is_instruction: z.boolean().optional(),
  // is_dangerous: z.boolean().optional(),
  // is_hypothetical: z.boolean().optional(),
  // is_open_ended: z.boolean().optional(),
  // positive_alerts - TODOS_OPTIMIZE: positive alerts to a second breakdown to save token cost.
  answer: z.string().optional(),
});

export type PromptBreakdownAlertType = z.infer<
  typeof zPromptBreakdownAlertsOutputSchema
>;

export type StopperAlert = {
  code: number;
  reason: string;
  message: string;
  action: string[];
};

// big suprsets of type of finetuning questions - how deep do you wanna go.
export const zPromptFinetuningSchema = z.object({
  isDepthFinetuned: z.boolean().default(false).optional(),
  isInterestFinetuned: z.boolean().default(false).optional(),
  //isUserKnowledgeFinetuned: z.boolean().default(false).optional(),
  isLearningGoalFinetuned: z.boolean().default(false).optional(),
  isLearningStyleFinetuned: z.boolean().default(false).optional(),
});

export const defaultFineTuning = (): z.infer<
  typeof zPromptFinetuningSchema
> => {
  return {
    isDepthFinetuned: false,
    isInterestFinetuned: false,
    //isUserKnowledgeFinetuned: false,
    isLearningGoalFinetuned: false,
    isLearningStyleFinetuned: false,
  };
};

export const zPromptKnowledgeSchema = z.object({
  depthFinetuning: z
    .object({
    })
    .passthrough()
    .optional(),
  interestFinetuning: z
    .object({
    })
    .passthrough()
    .optional(),
  userKnowledgeFinetuning: z
    .object({
    })
    .passthrough()
    .optional(),
  learningGoalFinetuning: z
    .object({
    })
    .passthrough()
    .optional(),
  learningStyleFinetuning: z
    .object({
    })
    .passthrough()
    .optional(),
  keywords: z.array(z.string()).optional(),
  user_level: z.number().min(1).max(10).optional(), // User's current understanding level
  complexity: z.enum(["low", "medium", "high"]).optional(), // Complexity of information desired
  learning_goals: z.array(z.string()).optional(), // Specific learning objectives
  preferred_learning_style: z
    .enum(["visual", "auditory", "reading/writing"])
    .optional(), // User's learning style
  preferred_content_format: z
    .enum(["text", "video", "interactive", "mixed"])
    .optional(), // Preferred content format
  estimated_time: z.string().optional(), // Time the user is willing to dedicate
  previous_knowledge: z.string().optional(), // User's prior knowledge or background
  additional_notes: z.string().optional(), // Additional user preferences or notes
  // preferred_pacing: z
  //   .enum(["self-paced", "instructor-led", "blended"])
  //   .optional(), // Preferred pacing of the course
  target_audience: z.string().optional(), // Description of the target audience
  prerequisites: z.array(z.string()).optional(), // Prerequisites for the course
  // evaluation_methods: z.array(z.string()).optional(), // Preferred methods of evaluation
  learning_path: z
    .array(
      z.object({
        // Structured learning path with modules
        module_title: z.string(),
        module_description: z.string().optional(),
        module_duration: z.string().optional(),
        module_content: z.array(z.string()).optional(),
      })
    )
    .optional(),
  // additional_knowledge: z
  //   .array(
  //     z.object({
  //       // Additional knowledge gained from surveys
  //       question: z.string(),
  //       answer: z.string(),
  //     })
  //   )
  //   .optional(),
});

export const zPromptKeywordsInputSchema = z.object({
  classification: zPromptBreakdownClassificationOutputSchema.optional(),
});

export const zPromptKeywordsOutputSchema = z.object({
  keywords: z.array(z.string()).min(10).max(20),
});
