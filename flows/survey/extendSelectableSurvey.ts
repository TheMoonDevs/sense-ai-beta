import {defineFlow, run} from "@genkit-ai/flow";
import {z} from "zod";
import {zSurveyModel} from "../../types/_data.survey";
import {SurveyModel} from "../../models/_db.survey";
import {geminiPro} from "@genkit-ai/googleai";
import {generate} from "@genkit-ai/ai";

export const extendSelectableSurveyFlow = defineFlow({
	name: "extendSelectableSurveyFlow",
	inputSchema: z.object(
		{
			surveyId: z.string(),
			options: z.array(z.string()).optional()
		}
	),
	outputSchema: zSurveyModel.pick({options: true}).optional()
}, async (input) => {
	if (!input.surveyId) {
		throw new Error("Survey ID must be provided.");
	}

	const fetchedSurveys: any = await run("Fetch Mongodb Suvreys - " + input.surveyId, async () => {
		return await SurveyModel.findById(input.surveyId);
	});

	if (! fetchedSurveys) {
		throw new Error("Survey not found.");
	}

	const output = await generate({
			model: geminiPro.name, prompt: `The question is ${
			fetchedSurveys.question
		}, a few selected options are ${
			input?.options?.join(",")
		}. 
        Generate more survey options on the basis of selected options.
        Some can be a specific sub field of the selected option.
        Some can be a sibling option but should not exist in the already generated options - ${
			fetchedSurveys.options.map((f : any) => f.label).join(",")
		} 
        options:
        - label: a short keyword that describes the interest
        - labelDescription: a short description of what this interest relates to`,
		output: {
			format: "json",
			schema: zSurveyModel.pick(
				{options: true}
			)
		}
	});
	const result = output.output();
	console.log("generated options", result);
	if (!result?.options) 
		return {options: []};
	const filtered_options = result?.options.filter(
		(r : any) => {
			let esits = false;
			fetchedSurveys.options.forEach((f : any) => {
				if (f.label === r.label) {
					esits = true;
				}
			});
			return ! esits
		}
	)
	fetchedSurveys.options = [
		...fetchedSurveys.options,
		...filtered_options,
	]
	const updateSurvey = await run("Update Mongodb Suvrey - " + input.surveyId, async () => {
		return await fetchedSurveys.save();
	});
	return {
		options: filtered_options
	};
});
