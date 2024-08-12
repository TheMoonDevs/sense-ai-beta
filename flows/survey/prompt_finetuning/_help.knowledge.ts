import { z } from "zod";
import { zSurveyModel, zSurveyModelType } from "../../../types/_data.survey";
import { fineTuningIds } from "./_config";

export const PromptKnowledgeHelper = {
  feedKnowledge: (
    promptKnowledge: any,
    surveyTypeId: string,
    response: zSurveyModelType["response"],
    survey: zSurveyModelType
  ) => {
    if (!response) return undefined;

    const finetuningData = fineTuningIds.find((d) => d.id === surveyTypeId);

    const responseType = survey.logic?.responseType;
    const responseValue =
      survey.ui?.questionType === "multiple_select"
        ? response.multiple
        : responseType === "number"
        ? typeof response.single == "string"
          ? parseFloat(response.single as string)
          : response.single
        : response.single
        ? response.single
        : response.multiple;
    if (!finetuningData?.knowledgeField) return undefined;

    return {
      ...promptKnowledge,
      [finetuningData.knowledgeField]: {
        ...(finetuningData.knowledgeField in promptKnowledge
          ? promptKnowledge?.[finetuningData.knowledgeField]
          : {}),
        ...(finetuningData.valueKey
          ? { [`${finetuningData.valueKey}Type`]: responseType }
          : {}),
        ...(finetuningData.valueKey
          ? { [`${finetuningData.valueKey}Value`]: responseValue }
          : {}),
        [`${finetuningData.dataKey}`]: response.mixed,
      },
    };
  },
};
