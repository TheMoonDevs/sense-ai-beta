// import { defineFlow, run } from "@genkit-ai/flow";
// import { z } from "zod";
// import {
//   PUSurveyOutputSchema,
//   PUSurveyFlowOutputSchema,
// } from "../survey/_zod.survey";
// import { PromptModel } from "../prompt/_db.prompt";
// import { SurveyModel } from "../survey/_db.model";
// import { SurveyHelper } from "../survey/_gen.survey";

// // Schemas

// export const PUSurveyFlow = defineFlow(
//   {
//     name: "puSurveyFlow",
//     inputSchema: z.object({
//       prompt_id: z.string(),
//       survey_id: z.string().optional().nullable(),
//     }),
//     outputSchema: PUSurveyFlowOutputSchema,
//   },
//   async (input) => {
//     let promptData: any;

//     if (!input.prompt_id) {
//       throw new Error("prompt_id must be provided.");
//     }
//     // Fetch the prompt data using prompt_id
//     promptData = await PromptModel.findById(input.prompt_id);
//     if (!promptData) {
//       throw new Error("Prompt data not found.");
//     }

//     const knowledgeFields = [
//       "user_level",
//       "complexity",
//       "learning_goals",
//       "preferred_learning_style",
//       "preferred_content_format",
//       "estimated_time",
//       "previous_knowledge",
//       "additional_notes",
//       "target_audience",
//       "prerequisites",
//       "learning_path",
//     ];

//     let missingFields: string[] = [];

//     const { promptKnowledge } = promptData;

//     knowledgeFields.forEach((field) => {
//       if (!promptKnowledge || !promptKnowledge[field]) {
//         missingFields.push(field);
//       }
//     });

//     const questionType = await run(
//       "Generating Question Type for Missing Fields",
//       async () => {
//         return await SurveyHelper.generateQuestionType({
//           input_prompt: promptData.input_prompt,
//           firstBreakdown: promptData.firstBreakdown,
//           promptKnowledge: promptData.promptKnowledge,
//           missingFields: missingFields,
//         });
//       }
//     );

//     console.log("questionType", questionType);

//     const puSurvey = await run(
//       "Generating Question for Missing Knowledge",
//       async () => {
//         return await SurveyHelper.generateMissingKnowledge({
//           input_prompt: promptData.input_prompt,
//           firstBreakdown: promptData.firstBreakdown,
//           promptKnowledge: promptData.promptKnowledge,
//           missingFields: missingFields,
//           questionType: questionType.type,
//         });
//       }
//     );

//     // Save the survey to the database
//     await run("Save Survey to db", async () => {
//       return await SurveyModel.create(puSurvey);
//     });

//     if (missingFields.length === 0) {
//       const puSurvey = await SurveyHelper.generateDepthQuestion({
//         input_prompt: promptData.input_prompt,
//         firstBreakdown: promptData.firstBreakdown,
//         promptKnowledge: promptData.promptKnowledge,
//       });

//       console.log("puSurvey", puSurvey);

//       // Save the survey to the database
//       await run("Save Survey to db", async () => {
//         return await SurveyModel.create(puSurvey);
//       });

//       return puSurvey;
//     }

//     return puSurvey;
//   }
// );



// generateDepthQuestion: async (
//   input: z.infer<typeof PUSurveyFlowInputSchema>
// ): Promise<zPUSurveyFlowOutputType> => {
//   const surveyPrompt = await prompt<z.infer<typeof PUSurveyFlowInputSchema>>(
//     "sq_deeperknowledge"
//   );
//   const surveyResponse = await surveyPrompt.generate<
//     typeof PUSurveyFlowOutputSchema
//   >({ model: geminiPro.name, input });
//   return surveyResponse.output() as zPUSurveyFlowOutputType;
// },


// generateMissingKnowledge: async (
//   input: z.infer<typeof SQMissingFieldInput>
// ): Promise<zSQMissingFieldOutputType> => {
//   const surveyPrompt = await prompt<z.infer<typeof SQMissingFieldInput>>(
//     "sq_missingknowledge"
//   );
//   const surveyResponse = await surveyPrompt.generate<
//     typeof PUSurveyFlowOutputSchema
//   >({ model: geminiPro.name, input });
//   return surveyResponse.output() as zPUSurveyFlowOutputType;
// },


// generateQuestionType: async (
//   input: z.infer<typeof SQQuestionTypeInputSchema>
// ): Promise<z.infer<typeof SQQuestionTypeOutputSchema>> => {
//   const surveyPrompt = await prompt<
//     z.infer<typeof SQQuestionTypeInputSchema>
//   >("sq_questiontype");
//   const surveyResponse = await surveyPrompt.generate<
//     typeof SQQuestionTypeOutputSchema
//   >({ model: geminiPro.name, input });
//   return surveyResponse.output() as z.infer<
//     typeof SQQuestionTypeOutputSchema
//   >;
// },