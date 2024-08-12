import z from "zod";

export const zPromptAudioInputSchema = z.object({
  audio: z.string(),
});

export const zPromptAudioOutputSchema = z.object({
  converted_audio: z.string(),
});

// Image Prompt

export const zPromptImageInputSchema = z.object({
  image: z.string(),
});

export const zPromptImageOutputSchema = z.object({
  image_description: z.string(),
  suggested_prompt: z.string(),
});
