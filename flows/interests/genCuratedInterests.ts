import { generate } from "@genkit-ai/ai";
import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import {
  InterestSchemaType,
  zInterestSchema,
} from "../../types/_data.interest";
import { InterestModel } from "../../models/_db.interest";
import { geminiPro, geminiProVision } from "@genkit-ai/googleai";
import { ImageGenSdk } from "../../service/imageGenSdk";
import { UserInterestModel } from "../../models/_db.userInterest";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { zId } from "../../types/_zod.common";

// - domain: The top-level field of the area.
// - field: Which particular field it belongs to within the domain.
// - subject: The area of study within the field.
// - category: The specific type the subject belongs to.
// - prompt: a short prompt to help the generate content based on the interest.
export const genCuratedInterestsFlow = defineFlow(
  {
    name: "genCuratedInterestsFlow",
    inputSchema: z.object({
      input_prompt: z.string().optional(),
      count: z.number().default(3),
      title: z.string().optional(),
      exact: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      parent_interest: z.string().optional(),
      user_id: zId,
    }),
    outputSchema: z.object({ interests: z.array(zInterestSchema).optional() }),
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
    if (
      !input.input_prompt &&
      !input.title &&
      !input.parent_interest &&
      !input.keywords &&
      !input.exact
    ) {
      throw new Error("Prompt must be provided.");
    }

    let subject_prompt = `Each subject should have 
	- title: a short word or phrase that describes the area of study.
	- subtitle: a short sentence that describes the subject.
	- context: 
		- description: a short paragraph that describes the subject.
		- keywords: a list of keywords that relate to the subject.
		- imageKeyword: a keyword to search for an image related to the subject.`;
    let prompt = ``;
    let parent_interest = input.parent_interest;
    if (input.input_prompt) {
      prompt = `
	Subjects are basically keywords or domains or subjects or area of studies. Generate ${input.count} subjects based on the following prompt: ${input.input_prompt}
		${subject_prompt}
	`;
    } else if (input.title) {
      prompt = `Generate 1 subject based on the following prompt: ${input.title}
	  ${subject_prompt.replace(
      "a short word or phrase that describes the area of study.",
      "exact as title in input"
    )}`;
    } else if (input.exact) {
      prompt = `Generate 1 subject that is titled: ${input.exact} 
    ${subject_prompt}`;
    } else if (input.keywords) {
      prompt = `Generate ${
        input.keywords?.length ?? 1
      } subjects based on the following keywords: ${input.keywords.join(", ")}
		${subject_prompt.replace(
      "a short word or phrase that describes the area of study.",
      "keyword"
    )}`;
    } else if (input.parent_interest) {
      const parentInterest = await run("Find the parent Interesr", async () => {
        return (await InterestModel.findOne({
          interest_id: input.parent_interest,
        })) as InterestSchemaType;
      });
      prompt = `Generate ${
        input.count ?? 3
      } subjects under the following category: ${
        parentInterest.title
      } which means ${parentInterest.subtitle}
	  ${subject_prompt}`;
    }

    const responses = await generate({
      model: geminiPro,
      prompt: prompt,
      output: {
        format: "json",
        schema: z.object({
          subjects: z.array(
            zInterestSchema.pick({
              title: true,
              subtitle: true,
              context: true,
            })
          ),
        }),
      },
    });

    const results = responses.output()?.subjects;

    if (!results) {
      throw new Error("No results found.");
    }

    const operations = results?.map(async (response: any) => {
      const existing = await InterestModel.findOne({
        interest_id: response.title.toLowerCase().replaceAll(" ", ""),
      });
      const interest_id = !existing
        ? response.title.toLowerCase().replaceAll(" ", "")
        : response.title.toLowerCase().replaceAll(" ", "") +
          "-" +
          Math.floor(Math.random() * 1000);
      if (existing && input.keywords && input.keywords?.length > 0) {
        return existing;
      }
      const newInterest = new InterestModel({
        interest_id,
        parent_interest: input.parent_interest || undefined,
        title: response.title,
        subtitle: response.subtitle,
        context: response.context,
        popularity: 0,
        interestType: "subject",
        rootType: "curatedInterest",
        isCurated: false,
        isEditorsPick: false,
      });

      await newInterest.save();

      const userInterestData = {
        user_id: input.user_id,
        interest_id: newInterest._id,
        status: "active",
        topics: newInterest?.learningTopics?.map((topic: any) => ({
          id: topic?.title,
          depthLevel: topic?.depthLevel,
          broadnessOfTopic: topic?.broadnessOfTopic,
          subtopics: topic?.subTopics?.map((subTopic: any) => ({
            id: subTopic,
          })),
        })),
      };

      await UserInterestModel.updateOne(
        { user_id: input.user_id, interest_id: newInterest._id },
        { $set: userInterestData },
        { upsert: true }
      );
      return newInterest;
    });

    const interests = await run("saving all interests to db", async () => {
      return (await Promise.all(operations)).map((interest) =>
        "toJSON" in interest ? interest.toJSON() : interest
      );
    });

    //console.log("fetched", interests);

    // Generate Images for the Interests.
    const operations2 = interests.map(async (interest: any) => {
      if (interest.image && interest.images && interest.images.length > 0) {
        return interest;
      }
      const images = await ImageGenSdk.generateImages(
        interest.context.imageKeyword,
        {
          imageType: "stock",
          source: "unsplash",
        }
      );
      //console.log("images", images);
      return await InterestModel.findByIdAndUpdate(
        {
          _id: interest._id,
        },
        {
          $set: {
            images,
            image: images.length > 0 ? images[0].image : undefined,
          },
        },
        { new: true }
      ).exec();
    });

    const interestsWithMedia = await run("generating images", async () => {
      return (await Promise.all(operations2)).map((interest) =>
        "toJSON" in interest ? interest.toJSON() : interest
      );
    });

    // TODO: generate Images.
    return { interests: interestsWithMedia };
  }
);
