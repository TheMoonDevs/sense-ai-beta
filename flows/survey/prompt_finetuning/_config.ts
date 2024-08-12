import { zSurveyModelType } from "../../../types/_data.survey";

export const fineTuningIds = [
  {
    id: "promptGoalDepth_1",
    finetuningType: "isDepthFinetuned",
    knowledgeField: "depthFinetuning",
    valueKey: "LearningGoalDepth",
    dataKey: "LearningGoalDepthContext",
    dimension: 1,
  },
  {
    id: "promptInterestSelections_1",
    finetuningType: "isInterestFinetuned",
    knowledgeField: "interestFinetuning",
    valueKey: "InterestSelections",
    dataKey: "InterestSelectionsContext",
    dimension: 1,
  },
  // {
  //   id: "promptUserKnowledge_1",
  //   finetuningType: "isUserKnowledgeFinetuned",
  //   knowledgeField: "userKnowledgeFinetuning",
  //   valueKey: "UserKnowledge",
  //   dataKey: "UserKnowledgeContext",
  //   dimension: 1,
  // },
  {
    id: "promptLearningLength_1",
    finetuningType: "isLearningGoalFinetuned",
    knowledgeField: "learningGoalFinetuning",
    valueKey: "TimeToLearn",
    dataKey: "TimeToLearnContext",
    dimension: 1,
  },
  {
    id: "promptLearningFormat_1",
    finetuningType: "isLearningStyleFinetuned",
    knowledgeField: "learningStyleFinetuning",
    valueKey: "CourseFormat",
    dataKey: "CourseFormatContext",
    dimension: 1,
  },
  {
    id: "PromptCasualVsProfessional_1",
    finetuningType: "isLearningStyleFinetuned",
    knowledgeField: "learningStyleFinetuning",
    valueKey: "CasualVsProfessional",
    dataKey: "CasualVsProfessionalContext",
    dimension: 1,
  },
];

// returns true if filled.
export const checkIfSurveyTypesAreFilled = (
  surveys: zSurveyModelType[],
  finetuningType: string
) => {
  return fineTuningIds
    .filter((f) => f.finetuningType === finetuningType)
    .map((f) => f.id)
    .reduce((acc, curr) => {
      //console.log("checking for", finetuningType, curr, surveys.find((s) => s.surveyTypeId === curr)?.response);
      return (
        acc &&
        surveys
          .filter((s) => s.response != undefined)
          .filter((s) => s.surveyTypeId === curr).length > 0
      );
    }, true) as boolean;
};
