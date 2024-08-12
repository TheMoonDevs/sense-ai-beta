import { PromptBreakdownAlertType } from "../../types/_zod.prompt";
import { StopperType } from "../../types/_zod.stopper";

//500 - complete stop of prompt
//501 - one stop of prompt
//502 - restart of prompt with a question.
export const StopperHelper = {
  promptBreakdownStopper: (_alerts?: PromptBreakdownAlertType) => {
    if (_alerts?.is_contextless) {
      return {
        _alerts,
        stopper: {
          code: 500,
          reason: "contextless_word",
          action: ["survey"],
          message: "The prompt is a verb/adverb without context",
        } as StopperType,
      };
    }

    if (_alerts?.is_oneline_answer && _alerts?.is_question) {
      return {
        _alerts,
        stopper: {
          code: 501,
          reason: "oneline_answer",
          steer: ["Are they interested in anything else"],
          action: ["survey", "skip"],
          message: "The prompt is too short to generate a meaningful response",
        } as StopperType,
      };
    }

    if (_alerts?.is_non_relaistic) {
      return {
        _alerts,
        stopper: {
          code: 501,
          reason: "non_realistic",
          action: ["survey"],
          message: "The prompt is non-realistic",
        } as StopperType,
      };
    }

    // if(_alerts?.is_assertion) {
    //     return {
    //         _alerts,
    //         stopper: {
    //             code: 500,
    //             reason: "assertion",
    //             action: ["survey"],
    //             message: "The prompt is an assertion"
    //         } as StopperType
    //     }
    // }

    // if(_alerts?.is_opinion) {
    //     return {
    //         _alerts,
    //         stopper: {
    //             code: 500,
    //             action: ["survey"],
    //             reason: "opinion",
    //             message: "The prompt is an opinion"
    //         } as StopperType
    //     }
    // }

    return null;
  },
};
