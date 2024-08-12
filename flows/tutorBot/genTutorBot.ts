import { generate } from "@genkit-ai/ai";
import { defineFlow, run, runFlow } from "@genkit-ai/flow";
import { geminiPro } from "@genkit-ai/googleai";
import { z } from "zod";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { zTutorBotSchema } from "../../types/_data.tutorBot";
import { TutorBotModel } from "../../models/_db.tutorBot";
import { ImageGenSdk } from "../../service/imageGenSdk";

export const genTutorBotFlow = defineFlow(
  {
    name: "genTutorBotFlow",
    inputSchema: z.object({
      prompt: z.string().optional(),
      user_id: z.string().optional(),
    }),
    outputSchema: zTutorBotSchema,
    middleware: [deserializeSenseUser],
    authPolicy: (auth, input) => {
      console.log("auth", auth);
      if (!auth || !auth._id) {
        throw new Error("Authorization required.");
      }
      input.user_id = auth._id.toString();
    },
  },
  async (input) => {
    if (!input?.prompt) {
      throw new Error("Prompt must be provided.");
    }

    const prompt = `Based on the following user prompt: "${input.prompt}", create a concise tutor bot profile. The profile should include:

    1. **Character Selection:** Identify a suitable character based on the user prompt.
    2. **Bot Creation:** Generate a brief tutor bot profile for the selected character, including:
       * A concise full name and friendly nickname aligned with the character.
       * A brief, first-person biography highlighting the bot's core expertise and teaching style.
       * A concise prompt prefix in the format: "Become [character], a [role] with expertise in [subject]. Adopt a [personality] teaching style. A user wants to ask you:
    3. * A Image keyword to search for an image related to the character."`;

    const generateBotInfo = await generate({
      model: geminiPro,
      prompt: prompt,
      output: {
        format: "json",
        schema: z.object({
          fullname: z.string(),
          nickname: z.string().optional(),
          subtopic: z.string().optional(),
          bio: z.string().optional(),
          prompt_prefix: z.string().optional(),
          imageKeyword: z.string().optional(),
        }),
      },
    });

    const _generatedBotInfo = generateBotInfo.output();
    console.log("generatedBotInfo", _generatedBotInfo);

    const avatars = await ImageGenSdk.generateImages(
      _generatedBotInfo?.imageKeyword
        ? _generatedBotInfo.imageKeyword
        : `${
            `${_generatedBotInfo?.fullname} aka ${_generatedBotInfo?.nickname}` ||
            input.prompt
          } profile photo`,
      {
        imageType: "stock",
        source: _generatedBotInfo?.imageKeyword ? "unsplash" : "serpapi",
      }
    );
    // ).then((res) => res.map((r) => r.image));
    console.log("avatars", avatars);

    const savedBot = await TutorBotModel.create({
      ..._generatedBotInfo,
      user_id: input.user_id,
      bot_prompt: input.prompt,
      avatars,
    });

    return savedBot;
  }
);
