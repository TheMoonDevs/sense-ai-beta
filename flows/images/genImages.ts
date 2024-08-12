import { generate } from "@genkit-ai/ai";
import { defineFlow, run } from "@genkit-ai/flow";
import { gemini15Pro, geminiProVision } from "@genkit-ai/googleai";
import { z } from "zod";
import { ImageGenSdk } from "../../service/imageGenSdk";
import { zImageType } from "../../types/_data.images";
import { ImageCrawlModel } from "../../models/_db.imagecrawl";
import deserializeSenseUser from "../../middleware/deserializeUser";

export const genImagesFlow = defineFlow(
  {
    name: "genImagesFlow",
    inputSchema: z.object({
      input_prompt: z.string(),
      source: zImageType.shape.source.optional(),
      user_id: z.string().nullable().optional(),
    }),
    outputSchema: z.object({ images: z.array(zImageType).optional() }),
    middleware: [deserializeSenseUser],
    authPolicy: (auth, input) => {
      if (!auth || !auth._id) {
        throw new Error("Authorization required.");
      }
      input.user_id = auth._id.toString();
    },
  },
  async (input) => {
    // const media = await generate({
    //     model: gemini15Pro,
    //     prompt: `Generate images for ${input.input_prompt}`,
    //     output: {
    //         format: "media",
    //     }
    // });

    const images = await run(
      `Fetching images from ${input?.source || "unsplash"}`,
      async () => {
        return await ImageGenSdk.generateImages(input.input_prompt, {
          source: input?.source || "unsplash",
          imageType: "stock",
        });
      }
    );

    await run("Save images to db", async () => {
      images.map(async (image) => {
        const imageCrawl = new ImageCrawlModel(image);
        await imageCrawl.save();
      });
    });

    return { images };
  }
);
