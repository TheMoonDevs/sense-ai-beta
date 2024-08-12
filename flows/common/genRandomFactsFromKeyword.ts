import { generate } from "@genkit-ai/ai";
import { defineFlow, runFlow } from "@genkit-ai/flow";
import { z } from "zod";
import { geminiPro } from "@genkit-ai/googleai";
import { UnsplashSdk } from "../../service/unsplashSdk";
import { genImagesFlow } from "../images/genImages";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { UserPreferencesModel } from "../../models/_db.userPrefs";
import { RandomHelper } from "../../utils/random";
import { zImageType } from "../../types/_data.images";
import { genKeywordsFlow } from "./genKeywords";

export const genRandomFactsFromKeyword = defineFlow(
  {
    name: "genRandomFactsFromKeyword",
    inputSchema: z.object({
      user_id: z.string(),
    }),
    outputSchema: z.object({
      fact: z.string(),
      imageUrl: zImageType.pick({
        image: true,
      }),
    }),
    middleware: [deserializeSenseUser],
    authPolicy: (auth, input) => {
      if (!auth || !auth._id) {
        throw new Error("Authorization required.");
      }
      input.user_id = auth._id.toString();
    },
  },

  async (input) => {
    //fetch userPRef and select a random keyword
    // const userPref = await UserPreferencesModel.aggregate([
    //   { $match: { user_id: input.user_id } }, // Filter by user_id
    //   { $sample: { size: 1 } }, // Get a random document
    // ]);
    const count = await UserPreferencesModel.countDocuments({
      user_id: input.user_id,
    });
    const randomIndex = Math.floor(Math.random() * count); // Calculate a random index to skip

    const userPref = await UserPreferencesModel.findOne({
      user_id: input.user_id,
    })
      .skip(randomIndex)
      .limit(1);
    console.log(userPref);
    const randomUserPref = userPref;

    const userInput =
      randomUserPref.data.keywords && randomUserPref.data.keywords.length > 0
        ? RandomHelper.pickOneAtRandom(randomUserPref.data.keywords)
        : randomUserPref?.subdomain
        ? randomUserPref.subject +
          randomUserPref?.domain +
          randomUserPref?.subdomain
        : randomUserPref.domain;

    // if (!(userPref.data.keywords && userPref.data.keywords.length)) {
    //   const getKeywords = await runFlow(
    //     genKeywordsFlow,
    //     {
    //       keywords: userPref?.subdomain
    //     },
    //     {
    //       withLocalAuthContext: { _id: input.user_id },
    //     }
    //   );
    //   userPref.data.keywords = getKeywords.keywords;
    //   userPref.data.userInput = getKeywords.userInput;
    //   await userPref.save();
    // }

    // Get unsplash images from the keyword

    const getImagesFromUnsplash = await runFlow(
      genImagesFlow,
      {
        input_prompt:
          (randomUserPref.data.keywords &&
            RandomHelper.pickOneAtRandom(randomUserPref.data.keywords)) ||
          randomUserPref?.subdomain
            ? randomUserPref?.subdomain
            : randomUserPref.domain,
      },
      {
        withLocalAuthContext: { _id: input.user_id },
      }
    );

    const imagesData = getImagesFromUnsplash.images;
    const generatedKeywords = await generate({
      model: geminiPro,
      prompt: `This is the user input : ${userInput}.
      Generate 1 fun fact, 
      can be in terms of scientific discovery or new findings, 
      about the user input.
      Every fact has to be unique.
      Exclude the obvious facts.
      This is the image data:
      ${JSON.stringify(imagesData)}
      Pick and attach relevant imageUrl to each fact from images data image field without modifying the url
            `,
      output: {
        format: "json",
        schema: z.object({
          fact: z.string(),
          imageUrl: zImageType.pick({
            image: true,
          }),
        }),
      },
    });
    const response = generatedKeywords.output();

    return (
      response || {
        fact: "",
        imageUrl: {
          image: "",
        },
      }
    );
  }
);
