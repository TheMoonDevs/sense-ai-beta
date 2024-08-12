import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { PromptModel } from "../../models/_db.prompt";
import { zPromptModel } from "../../types/_data.prompt";

export const PromptFetchFlow = defineFlow(
  {
    name: "promptFetchFlow",
    inputSchema: z.object({
      id: z.string(),
    }),
    outputSchema: zPromptModel.nullable(),
  },
  async (input) => {
    if (input) {
      const fetchedPrompt = await run("Fetch Mongodb Prompt", async () => {
        return await PromptModel.findById(input.id);
      });
      return fetchedPrompt;
    }
    return null;
  }
);
