import { defineFlow } from "@genkit-ai/flow";
import { PromptBreakdownHelper } from "../_gen.prompt";
import { PromptAudioInputSchema, PromptAudioOutputSchema } from "./_def.media";

export const promptAudioFlow = defineFlow(
  {
    name: "promptAudioFlow",
    inputSchema: PromptAudioInputSchema,
    outputSchema: PromptAudioOutputSchema,
  },
  async (input) => {
    const textFromSpeech = await PromptBreakdownHelper.generateSpeechToText({
      audio: input.audio,
    });

    return (
      textFromSpeech || {
        converted_audio: "",
      }
    );
  }
);
