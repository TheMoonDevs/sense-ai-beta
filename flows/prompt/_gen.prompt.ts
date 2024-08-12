import { geminiPro, gemini15Flash } from "@genkit-ai/googleai";
import {
  PromptBreakdownAlertsOutputSchema,
  PromptBreakdownClassificationOutputSchema,
  PromptDepthInputSchema,
  PromptDepthOutputSchema,
  PromptKeywordsInputSchema,
  PromptKeywordsOutputSchema,
  PromptKnowledgeSchema,
  PromptRandomInputSchema,
  PromptRandomOutputSchema,
} from "./_def.prompt";
import { prompt } from "@genkit-ai/dotprompt";
import { z } from "zod";
import {
  PromptAudioInputSchema,
  PromptAudioOutputSchema,
  PromptImageInputSchema,
  PromptImageOutputSchema,
} from "./media/_def.media";
import { PromptBreakdownInputType } from "../../types/_zod.prompt";

export const PromptBreakdownHelper = {
  generateRandomPrompt: async (
    input: z.infer<typeof PromptRandomInputSchema>
  ) => {
    const randomPrompt = await prompt<typeof input>("pb_random");
    const llmResponse = await randomPrompt.generate<
      typeof PromptRandomOutputSchema
    >({
      model: geminiPro.name,
      input,
    });
    return llmResponse.output();
  },

  //Image

  generateSuggestivePromptFromImage: async (
    input: z.infer<typeof PromptImageInputSchema>
  ) => {
    const imagePrompt = await prompt<typeof input>("pb_image");
    const llmResponse = await imagePrompt.generate<
      typeof PromptImageOutputSchema
    >({
      model: gemini15Flash.version,
      input,
    });
    return llmResponse.output();
  },

  generateSpeechToText: async (
    input: z.infer<typeof PromptAudioInputSchema>
  ) => {
    const audioPrompt = await prompt<typeof input>("pb_audio");
    const llmResponse = await audioPrompt.generate<
      typeof PromptAudioOutputSchema
    >({
      model: gemini15Flash.version,
      input,
    });
    return llmResponse.output();
  },

  generateAlerts: async (input: PromptBreakdownInputType) => {
    const promptBreakdownAlerts = await prompt<PromptBreakdownInputType>(
      "pb_alerts"
    );
    const llmAlertsResponse = await promptBreakdownAlerts.generate<
      typeof PromptBreakdownAlertsOutputSchema
    >({ model: geminiPro.name, input });
    const _alerts = llmAlertsResponse.output();
    return _alerts;
  },
  generateClassification: async (input: PromptBreakdownInputType) => {
    const breakdownClassPrompt = await prompt<PromptBreakdownInputType>(
      "pb_class"
    );
    const llmClassifyResponse = await breakdownClassPrompt.generate<
      typeof PromptBreakdownClassificationOutputSchema
    >({ model: geminiPro.name, input });
    const _breakdown = llmClassifyResponse.output();
    return _breakdown;
  },
  generateDepth: async (input: z.infer<typeof PromptDepthInputSchema>) => {
    const breakdownClassPrompt = await prompt<
      z.infer<typeof PromptDepthInputSchema>
    >("pb_depth");
    const llmClassifyResponse = await breakdownClassPrompt.generate<
      typeof PromptDepthOutputSchema
    >({ model: geminiPro.name, input });
    return llmClassifyResponse.output();
  },
  generateKeywords: async (
    input: z.infer<typeof PromptKeywordsInputSchema>
  ) => {
    const keywordsPrompt = await prompt<
      z.infer<typeof PromptKeywordsInputSchema>
    >("pb_keywords");
    const llmClassifyResponse = await keywordsPrompt.generate<
      typeof PromptKeywordsOutputSchema
    >({ model: geminiPro.name, input });
    return llmClassifyResponse.output();
  },
};
