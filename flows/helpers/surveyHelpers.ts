import { z } from "zod";
import {
  zSurveyModelType,
  zSurveyResponseTypeEnum,
  zSurveyUiStyleEnum,
} from "../../types/_data.survey";
import { RandomHelper } from "../../utils/random";

export const customSurveyFields = (
  optionFIlls: "image" | "emoji" | "plain",
  surveyData: zSurveyModelType
) => {
  let selectionStyle: z.infer<typeof zSurveyUiStyleEnum> | null = null;
  let responseType: z.infer<typeof zSurveyResponseTypeEnum> = "mixed";
  let is_open_ended: boolean = false;

  const questionType = surveyData?.ui?.questionType;

  if (questionType === "open_ended") {
    is_open_ended = true;
  }
  if (!questionType) {
    throw new Error("Question type must be provided.");
  }
  if (!surveyData?.options) {
    responseType = "text";
  }
  // if (questionType === "scale") {
  //   selectionStyle = "range_keywords";
  //   responseType = "number";
  // }
  if (questionType === "open_ended") {
    responseType = "text";
    selectionStyle = "in_chat_choices";
  }
  if (questionType === "boolean") {
    selectionStyle = "yes_no";
    responseType = "boolean";
  }
  if (questionType === "single_select" || questionType === "multiple_select") {
    let choiceValues = Object.values(zSurveyUiStyleEnum.enum)
      .filter((value) => value.endsWith("_choices"))
      .filter(
        (value) =>
          value !== "pager_choices" &&
          value != "quiz_4bt_choices" &&
          value != "emoji_choices"
      );

    if (
      surveyData?.options &&
      (surveyData?.options[0]?.labelDescription ||
        surveyData?.options[0]?.image) &&
      questionType === "single_select"
    ) {
      choiceValues = [
        "quiz_vertical_choices",
        "card_choices",
        "in_chat_choices",
      ];
    } else {
      //choiceValues = choiceValues.filter((value) => value !== "card_choices");
    }

    if (surveyData?.options && surveyData?.options?.length > 4) {
      choiceValues = choiceValues.filter(
        (value) => value !== "quiz_vertical_choices"
      );
    }

    if (optionFIlls === "plain") {
      choiceValues = choiceValues.filter((value) => value !== "card_choices");
    }

    if (
      optionFIlls === "image" &&
      surveyData?.options &&
      surveyData?.options?.filter((option) => option?.image).length ===
        surveyData?.options?.length
    ) {
      choiceValues = ["card_choices"];
    }

    if (
      surveyData?.options &&
      surveyData?.options.filter((option) => !option?.icon && !option?.image)
        .length > 0
    ) {
      choiceValues = choiceValues.filter((value) => value !== "card_choices");
    }

    //choiceValues = ["card_choices"];

    // surveyData?.options?.forEach((option) => {
    //   if(option?.label && option?.label?.length > 60) {
    //     choiceValues = choiceValues.filter(
    //       (value) => value !== "quiz_vertical_choices"
    //     );
    //   }
    // });

    // if (surveyData?.options && surveyData?.options[0]?.icon) {
    //   choiceValues = ["emoji_choices"];
    // } else {
    //   choiceValues = choiceValues.filter((value) => value !== "emoji_choices");
    // }

    // if (surveyData?.options && surveyData?.options.length !== 4) {
    //   choiceValues = choiceValues.filter(
    //     (value) => value !== "quiz_4bt_choices"
    //   );
    // }

    // if (surveyData?.options && surveyData?.options.length < 4) {
    //   is_open_ended = true;
    // }

    if (
      surveyData?.options &&
      surveyData.options.find((option) =>
        /^(other|others)$/i.test((option.value || "")?.toString().toLowerCase())
      )
    ) {
      is_open_ended = true;
    }

    selectionStyle =
      choiceValues[Math.floor(Math.random() * choiceValues.length)];
    responseType = "mixed";
  }

  const updatedSurveyData = {
    ...surveyData,
    ...(questionType === "open_ended" ? { is_open_ended: true } : {}),
    ui: {
      ...surveyData?.ui,
      questionType,
      selectionStyle,
    },
    logic: {
      ...surveyData?.logic,
      responseType,
    },
    is_open_ended,
  };

  return updatedSurveyData;
};
