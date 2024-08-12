// import { defineFlow, run } from "@genkit-ai/flow";
// import { z } from "zod";
// import { PromptModel } from "./_db.prompt";
// import { SurveyModel } from "../survey/_db.model";
// import { PromptUnderstandHelper } from "./_gen.prompt";
// import { PromptKnowledgeSchema } from "./_zod.prompt";
// // Schemas

// _gen.prompts.ts
// export const PromptUnderstandHelper = {
//     generatePromptKnowledge: async (input: z.infer<typeof PUImproveKnowledgeInput> ) => {
//       const knowledgePrompt = await prompt<
//         z.infer<typeof PUImproveKnowledgeInput>
//       >("pu_knowledge");
//       const llmClassifyResponse = await knowledgePrompt.generate<
//         typeof PromptKnowledgeSchema
//       >({ model: geminiPro.name, input });
//       return llmClassifyResponse.output();
//     },
//   };

// _zod.prompts.ts
// export const PUImproveKnowledgeInput = defineSchema(
//     "PUImproveKnowledge",
//     z.object({
//       promptData: zPromptModel,
//       surveyData: zSurveyModel.optional()
//     })
//   )
  
// export const promptUnderstandFlow = defineFlow(
//   {
//     name: "promptUnderstandFlow",
//     inputSchema: z.object({
//       prompt_id: z.string(),
//       survey_id: z.string(),
//       answer: z.string(),
//     }),
//     outputSchema: PromptKnowledgeSchema,
//   },
//   async (input) => {
//     if (!input.answer) {
//       throw new Error("Prompt data not found");
//     }

//     if (!input.prompt_id) {
//       throw new Error("prompt_id must be provided.");
//     }

//     if (!input.survey_id) {
//       throw new Error("survey_id must be provided.");
//     }

//     let promptData = await PromptModel.findById(input.prompt_id);
//     if (!promptData) {
//       throw new Error("Prompt data not found.");
//     }

//     let surveyData = await SurveyModel.findById(input.survey_id);
//     if (!surveyData) {
//       throw new Error("Survey data not found.");
//     }

//     console.log("reached here 1")
//     const puSurvey = (await PromptUnderstandHelper.generatePromptKnowledge({
//       promptData,
//       surveyData: { ...surveyData, answer: input.answer },
//     })) as z.infer<typeof PromptKnowledgeSchema>;
    
//     console.log("puSurvey", puSurvey)
//     promptData.promptKnowledge = puSurvey;
    
//     console.log("reached here 2")
//     await promptData.save();

//     return puSurvey;
//   }
// );
