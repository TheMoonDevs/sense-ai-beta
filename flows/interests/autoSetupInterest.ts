import { defineFlow, run, runFlow } from "@genkit-ai/flow";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { z } from "zod";
import { InterestModel } from "../../models/_db.interest";
import { genInterestBreakdownFlow } from "./genInterestBreakdown";
import { genInterestLearningTopicsFlow } from "./genLearningTopics";
import {
  InterestSchemaType,
  zInterestSchema,
} from "../../types/_data.interest";
import { ImageGenSdk } from "../../service/imageGenSdk";

export const autoSetupInterestFlow = defineFlow(
  {
    name: "autoSetupInterestFlow",
    inputSchema: z.object({
      interest_id: z.string().optional(),
      user_id: z.string().optional(),
    }),
    outputSchema: z.object({
      success: z.boolean().optional(),
      interest: zInterestSchema.optional(),
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
    if (!input.user_id) {
      throw new Error("User Id is required");
    }

    if (!input.interest_id) {
      throw new Error("Interest Id is required");
    }

    const interestDoc = await run("fetch Interest", async () => {
      return (await InterestModel.findOne({
        interest_id: input.interest_id,
      })
        .lean()
        .exec()) as InterestSchemaType;
    });

    if (!interestDoc) {
      throw new Error("Interest not found");
    }

    let finalInterestDoc = { ...interestDoc };

    if (!interestDoc.breakdown) {
      const userInterestDoc = await runFlow(
        genInterestBreakdownFlow,
        {
          interest_id: input.interest_id,
        },
        {
          withLocalAuthContext: { _id: input.user_id },
        }
      );

      if (!userInterestDoc.interest) {
        throw new Error("breakdown not generated");
      }
      finalInterestDoc = { ...userInterestDoc.interest };
    }

    if (
      !interestDoc?.learningTopics ||
      interestDoc?.learningTopics.length <= 0
    ) {
      const learningTopics = await runFlow(
        genInterestLearningTopicsFlow,
        {
          interest_id: input.interest_id,
        },
        {
          withLocalAuthContext: { _id: input.user_id },
        }
      );

      if (!learningTopics.learningTopics) {
        throw new Error("Learning topics not generated");
      }

      finalInterestDoc = {
        ...finalInterestDoc,
        learningTopics: learningTopics.learningTopics,
      };
    }

    console.log("finalInterestDoc is", finalInterestDoc);

    if (!finalInterestDoc.image) {
      const images = await ImageGenSdk.generateImages(
        finalInterestDoc.context?.imageKeyword ??
          finalInterestDoc.domain ??
          finalInterestDoc.breakdown?.domain ??
          "",
        {
          imageType: "stock",
          source: "unsplash",
        }
      );
      if (images.length === 0) {
        throw new Error("No images generated for interest");
      }
      const updatedDoc = await run("Save Curated Interest", async () => {
        return await InterestModel.findByIdAndUpdate(
          finalInterestDoc._id,
          {
            images: images,
            image: images[0]?.image?.toString(),
          },
          {
            new: true,
          }
        );
      });

      if (!updatedDoc) {
        throw new Error("Image not updated");
      }

      finalInterestDoc = updatedDoc.toJSON();
    }

    console.log("finalInterestDoc is", finalInterestDoc);
    return {
      success: true,
      interest: finalInterestDoc,
    };
  }
);
