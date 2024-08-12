import { z } from "zod";

export const zSupportedImageSources = z.enum([
  "unsplash",
  "serpapi",
  "pexels",
  "pixabay",
  "modelLabs",
]);
export const zImageType = z.object({
  image_id: z.string().optional(),
  query: z.string().optional(),
  source: zSupportedImageSources.optional(),
  imageType: z.enum(["stock", "illustration"]).optional(),
  orientation: z.enum(["squarish", "landscape", "portrait"]).optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  image: z.string(),
  urls: z.object({}).passthrough().optional() || z.array(z.string()).optional(),
  //   .object({
  //     raw: z.string(),
  //     full: z.string(),
  //     regular: z.string(),
  //     small: z.string(),
  //     thumb: z.string(),
  //   })
  //   .optional(),
  eta_timestamp: z.number().optional(),
  crawlStatus: z.enum(["pending", "completed", "Failed"]).optional(),
  fetch_result: z.string().optional(),
});

export type ImageType = z.infer<typeof zImageType>;
