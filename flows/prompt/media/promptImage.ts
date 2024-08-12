import { defineFlow } from "@genkit-ai/flow";

import { PromptBreakdownHelper } from "../_gen.prompt";
import { PromptImageInputSchema, PromptImageOutputSchema } from "./_def.media";

export const promptImageFlow = defineFlow(
  {
    name: "promptImageFlow",
    inputSchema: PromptImageInputSchema,
    outputSchema: PromptImageOutputSchema,
  },
  async (input) => {
    const textFromImage =
      await PromptBreakdownHelper.generateSuggestivePromptFromImage({
        image: input.image,
      });

    return (
      textFromImage || {
        image_description: "",
        suggested_prompt: "",
      }
    );
  }
);
