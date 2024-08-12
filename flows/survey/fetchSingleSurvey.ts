import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { zSurveyModel } from "../../types/_data.survey";
import { SurveyModel } from "../../models/_db.survey";

export const fetchSingleSurveyFlow = defineFlow(
  {
    name: "fetchSingleSurveyFlow",
    inputSchema: z.object({
      surveyId: z.string(),
    }),
    outputSchema: zSurveyModel.nullable().optional(),
  },
  async (input) => {
    if (input.surveyId) {
      const fetchedSurveys = await run(
        "Fetch Mongodb Suvreys for prompt - " + input.surveyId,
        async () => {
          return await SurveyModel.findById(input.surveyId);
        }
      );
      return fetchedSurveys;
    }
    return null;
  }
);
