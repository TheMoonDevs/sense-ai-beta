import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { PromptModel } from "../../../models/_db.prompt";
import { SurveyModel } from "../../../models/_db.survey";
import { zSurveyModelType } from "../../../types/_data.survey";
import { checkIfSurveyTypesAreFilled, fineTuningIds } from "./_config";
import { zPromptModelType } from "../../../types/_data.prompt";
import { PromptKnowledgeHelper } from "./_help.knowledge";

export const promptFinetuningFlow = defineFlow(
  {
    name: "promptFinetuningFlow",
    inputSchema: z.object({
      promptId: z.string(),
      surveyId: z.string(),
      response: z.object({}).passthrough().optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      status: z.object({}).passthrough().optional(),
    }),
  },
  async (input) => {
    const promptData: any = await run("Fetch Mongodb Prompt", async () => {
      return await PromptModel.findById(input.promptId);
    });

    if (!promptData) {
      throw new Error("Prompt not found.");
    }

    const survey: any = await run("Fetch Mongodb Survey", async () => {
      return await SurveyModel.findById(input.surveyId);
    });

    if (!survey) {
      throw new Error("Survey not found.");
    }

    if (!input.response) throw new Error("Response must be provided.");

    let success = false;
    survey.response = input.response;

    await run("Update SurveyData", async () => {
      await survey.save();
    });

    // TODO: Add more logic for other types of questions
    let surveyType = fineTuningIds.find((d) => d.id === survey.surveyTypeId);
    if (surveyType == undefined) {
      throw new Error("Survey Type not found.");
    }
    const finetunedKnowledge = PromptKnowledgeHelper.feedKnowledge(
      promptData.promptKnowledge,
      surveyType.id,
      input.response,
	  survey
    );
    if (finetunedKnowledge != undefined) {
      promptData.promptKnowledge = finetunedKnowledge;
      success = true;
    }

    if (!success) {
      throw new Error(
        "Failed to submit survey response & generate prompt data."
      );
    }

    await run("Update PromptData", async () => {
      await promptData.save();
    });

    // TODO: Generate 2nd dimensional surveys or generate context based on input response or knowledge data.

    await run("Checking / Setting finetuning flag", async () => {
      let surveys = await SurveyModel.find({
        linked_id: input.promptId,
        response: {
          $exists: true,
        },
      });
      const surveys_jsons = [
        ...surveys.map((d) => d.toJSON()),
        survey.toJSON(),
      ];
      // setting the finetuning flags.
      promptData.finetuning = {
        ...promptData.finetuning,
        [surveyType!.finetuningType]: checkIfSurveyTypesAreFilled(
          surveys_jsons,
          surveyType!.finetuningType
        ),
      };
	  //console.log("finetuning data", promptData.finetuning);
    });

    await run("Update PromptData", async () => {
      await promptData.save();
    });

    return { success, status: promptData.toJSON().finetuning };
  }
);
