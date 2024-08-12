import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import {
  zSurveyOptions,
  zSurveyResponseTypeEnum,
} from "../../types/_data.survey";
import { SurveyModel } from "../../models/_db.survey";

export const updateFeedSurveyResponseFlow = defineFlow(
  {
    name: "updateFeedSurveyResponseFlow",
    inputSchema: z.object({
      surveyId: z.string(),
      response: z
        .object({
          single: z.string().optional().or(z.number().optional()),
          mixed: z.object({}).passthrough().optional(),
          multiple: z.array(zSurveyOptions).optional(),
          openEndedInput: z.string().optional(),
        })
        .optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      status: z.object({}).passthrough().optional(),
    }),
  },
  async (input) => {
    if (input.surveyId) {
      const fetchedSurveys = await run(
        "Fetch Mongodb Suvreys for prompt - " + input.surveyId,
        async () => {
          return await SurveyModel.updateOne(
            { _id: input.surveyId },
            {
              $set: {
                response: input.response,
              },
            }
          );
        }
      );

      return {
        success: true,
        status: {
          code: 200,
          message: "Response saved successfully",
        },
      };
    }
    return {
      success: false,
      status: {
        code: 500,
        messaage: "Couldn't save the response",
      },
    };
  }
);
