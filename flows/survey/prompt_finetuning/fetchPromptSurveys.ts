import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { zSurveyLinkedRootTypeEnum, zSurveyModel } from "../../../types/_data.survey";
import { SurveyModel } from "../../../models/_db.survey";

export const promptSurveysFetchFlow = defineFlow(
  {
    name: "promptSurveysFetchFlow",
    inputSchema: z.object({
      promptId: z.string(),
      condition: z.string().optional(),
    }),
    outputSchema: z.array(zSurveyModel).default([]),
  },
  async (input) => {
    if (input.promptId) {
      const fetchedSurveys = await run(
        "Fetch Mongodb Suvreys for prompt - " + input.promptId,
        async () => {
          if (input.condition === "no_response") {
            return await SurveyModel.find({
              linked_id: input.promptId,
              linked_type: zSurveyLinkedRootTypeEnum.Values.prompt,
              response: { $exists: false },
            });
          } else {
            return await SurveyModel.find({
              linked_id: input.promptId,
              linked_type: zSurveyLinkedRootTypeEnum.Values.prompt,
            });
          }
        }
      );
      return fetchedSurveys.sort((a, b) => {
        return a.linked_order < b.linked_order ? -1 : 1
        });
    }
    return [];
  }
);
