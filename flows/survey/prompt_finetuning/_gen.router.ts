import { geminiPro } from "@genkit-ai/googleai";
import { zPromptModelType } from "../../../types/_data.prompt";
import { prompt } from "@genkit-ai/dotprompt";
import { z } from "zod";
import { generate } from "@genkit-ai/ai";
import { zSurveyModel, zSurveyModelType } from "../../../types/_data.survey";
import { fineTuningIds } from "./_config";
import { generateDepthPromptGoal } from "./_gen.promptGoalDepth1";
import { genInterestPromptSelectionSurvey } from "./_gen.promptInterestSelections";
import { genPromptUserKnowledgSurvey } from "./_gen.promptUserKnowledge";
import { genPromptLearningGoalSurvey } from "./_gen.promptLearningGoal";
import { genPromptLearningFormatSurvey } from "./_gen.promptLearningStyle";
import { genPromptCasualProfessional } from "./_gen.promptCasualvsPrpfessional";

export const PromptSurveyHelper = {
  generateSurveyQuestions: (
    input: zPromptModelType,
    surveys: zSurveyModelType[],
    finetuningType?: string | number,
    surveyTypeIds?: string[]
  ) => {
    const survey_gens: Promise<zSurveyModelType | null>[] = [];
    if (!surveyTypeIds || surveyTypeIds.length === 0) {
      surveyTypeIds = fineTuningIds
        .filter((f) =>
          finetuningType == undefined
            ? true
            : typeof finetuningType === "string"
            ? f.finetuningType === finetuningType && f.dimension == 1
            : f.dimension == finetuningType
        )
        .map((f) => f.id);
    }

    surveyTypeIds.forEach((surveyTypeId) => {
      let isGeneratedAlready =
        surveys.filter((s) => s.surveyTypeId === surveyTypeId).length > 0;
      if (!isGeneratedAlready) {
        switch (surveyTypeId) {
          case "promptGoalDepth_1":
            survey_gens.push(generateDepthPromptGoal(input, surveyTypeId));
            break;
          case "promptInterestSelections_1":
            survey_gens.push(
              genInterestPromptSelectionSurvey(input, surveyTypeId)
            );
            break;
          case "promptUserKnowledge_1":
            survey_gens.push(genPromptUserKnowledgSurvey(input, surveyTypeId));
            break;
          case "promptLearningLength_1":
            survey_gens.push(genPromptLearningGoalSurvey(input, surveyTypeId));
            break;
          case "promptLearningFormat_1":
            survey_gens.push(
              genPromptLearningFormatSurvey(input, surveyTypeId)
            );
            break;
          case "PromptCasualVsProfessional_1":
            survey_gens.push(genPromptCasualProfessional(input, surveyTypeId));
            break;
          default:
            break;
        }
      }
    });
    return {
      survey_gens,
    };
  },
};
