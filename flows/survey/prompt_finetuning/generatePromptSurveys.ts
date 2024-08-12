import {defineFlow, run} from "@genkit-ai/flow";
import {z} from "zod";
import {zSurveyLinkedRootTypeEnum, zSurveyModel, zSurveyModelType} from "../../../types/_data.survey";
import {PromptModel} from "../../../models/_db.prompt";
import {zPromptModelType} from "../../../types/_data.prompt";
import {PromptSurveyHelper} from "./_gen.router";
import {SurveyModel} from "../../../models/_db.survey";
import {defaultFineTuning} from "../../../types/_zod.prompt";
import {fineTuningIds} from "./_config";

// GENERATE 1st DIMENSIONAL SUURVEYS FOR FINETUNING PROMPT IF NOT ALREADY GENERATED
// 1st DIMENSIONAL MEANS ONLY DEPENDENT ON PROMPT DATA AND NOT OTHER SURVEY RESPONSE DATA.

export const generatePromptSurveysFlow = defineFlow({
	name: "generatePromptSurveysFlow",
	inputSchema: z.object(
		{
			promptId: z.string(),
			surveyTypeIds: z.array(z.string()).optional()
		}
	),
	outputSchema: z.object(
		{
			surveys: z.array(zSurveyModel.omit({response: true})).optional()
		}
	)
}, async (input) => {
	if (!input.promptId) {
		throw new Error("Prompt ID must be provided.");
	}

	const fetchedPrompt = (await run("Fetch Mongodb Prompt", async () => {
		return await PromptModel.findById(input.promptId);
	}))as zPromptModelType | null;

	const fetchedSurveys = await run("Fetch Mongodb Suvreys for prompt for" + input.promptId, async () => {
		return await SurveyModel.find({linked_id: input.promptId, linked_type: zSurveyLinkedRootTypeEnum.Values.prompt});
	});

	if (! fetchedPrompt) {
		throw new Error("Prompt not found.");
	}

	console.log("surveys for finetuning prompt", fetchedPrompt.finetuning, fetchedSurveys);

	// GENERATE FINETUNING QUESTIONS
	let surveyQuestionGen: Promise < zSurveyModelType | null > [] = [];
	const {survey_gens} = PromptSurveyHelper.generateSurveyQuestions(fetchedPrompt, fetchedSurveys, undefined, input.surveyTypeIds);
	// if(completed) _finetuning.isDepthFinetuned = true;
	if (survey_gens.length > 0) 
		surveyQuestionGen = surveyQuestionGen.concat(survey_gens);
	
	// if (!fetchedPrompt.finetuning?.isDepthFinetuned) {
	// const {survey_gens} = PromptSurveyHelper.generateSurveyQuestions(fetchedPrompt, fetchedSurveys, "isDepthFinetuned", input.surveyTypeIds);
	// // if(completed) _finetuning.isDepthFinetuned = true;
	// if (survey_gens.length > 0)
	// surveyQuestionGen = surveyQuestionGen.concat(survey_gens);
	// }
	// if (!fetchedPrompt.finetuning?.isInterestFinetuned) {
	// const {survey_gens} = PromptSurveyHelper.generateSurveyQuestions(fetchedPrompt, fetchedSurveys, "isInterestFinetuned", input.surveyTypeIds);
	// if (survey_gens.length > 0)
	// surveyQuestionGen = surveyQuestionGen.concat(survey_gens);
	// }

	// PARALLEL SEQUENCING
	let surveyQuestionSequence = (await Promise.all(surveyQuestionGen)).filter((x) => x != null)as zSurveyModelType[];

	if (surveyQuestionSequence.length === 0) {
		return {surveys: []};
	}

	// SAVE GENERATED SURVEYS

	const results_saved = await Promise.all(surveyQuestionSequence.map(async (survey : zSurveyModelType) => {
		if (!survey) 
			return null;
		

		return await run("Save Survey", async () => {
			const new_survey = await SurveyModel.create({
				linked_id: input.promptId,
				linked_type: zSurveyLinkedRootTypeEnum.Values.prompt,
				linked_order: fineTuningIds.findIndex((d) => d.id === survey.surveyTypeId),
				...survey
			});
			return new_survey;
		});
	}));

	return {surveys: results_saved};
});
