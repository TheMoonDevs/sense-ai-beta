import { generate } from "@genkit-ai/ai";
import { defineFlow, run } from "@genkit-ai/flow";
import { geminiPro } from "@genkit-ai/googleai";
import { z } from "zod";
import { zUserPrefModel } from "../../types/_data.userPrefs";
import { UserPreferencesModel } from "../../models/_db.userPrefs";
import deserializeSenseUser from "../../middleware/deserializeUser";

export const genUserPrefFlow = defineFlow(
  {
    name: "genUserPrefFlow",
    inputSchema: z.object({
      input: z.string().optional(),
      type: zUserPrefModel.shape.type.optional(),
      user_id: z.string().optional(),
      askedQuestion: z.string().optional(),
      update_pref_id: z.string().optional(),
      update_pref_data: z.any().optional(),
    }),
    outputSchema: z.object({
      pref: zUserPrefModel.optional(),
      message: z.string().optional(),
      followup: z.any().optional(),
      success: z.boolean().optional(),
      reason: z.string().optional(),
      skip: z.boolean().optional(),
    }),
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
    if (input.update_pref_id) {
      if (!input.update_pref_data) throw new Error("Update data is required");
      const updatePref = await run("Update User Pref", async () => {
        return await UserPreferencesModel.findOneAndUpdate(
          {
            _id: input.update_pref_id,
          },
          {
            $set: input.update_pref_data,
          },
          {
            new: true,
          }
        ).exec();
      });
      return {
        pref: updatePref,
        message: "User preference updated successfully",
      };
    }

    const genResponse = await generate({
      model: geminiPro,
      prompt:
        input.type === "taste"
          ? `You have asked user - "${input.askedQuestion}"
          Generate user preference based on user input - "${input.input}", 
            - domain: The top-level field of the area.
            - subdomain: Which particular field it belongs to within the domain.
            - action: a specific action likes, loves, hates, no comments on, adores, etc..
            - subject: a specific point that action drives to
            - message: a short message back to the user based on input. this is must.
            - keywords: a array of keywords that relat to this info.
            - weightage: a number between 0-1 that represents the depth factor of this action.`
          : input.type === "background"
          ? `You have asked user - "${input.askedQuestion}"
          Generate user info based on user input - "${input.input}",
            - domain: The top-level field of the area.
            - subdomain: Which particular field it belongs to within the domain.
            - action: a specific action like is, was, often, afraid of, seeks to be, dreams about, etc..
            - subject: a specific area that the user is stating in the input. Do not assume the subject and be accurate to the user input.
            - message: a short message back to the user seeking confirmation. this is must.
            - keywords: a array of keywords that relat to this info.
            - weightage: a number between 0-1 that represents the depth factor of this action.
            `
          : `You have asked user - "${input.askedQuestion}"
          Generate user info based on user input - "${input.input}",
            - domain: The top-level field of the area.
            - subdomain: Which particular field it belongs to within the domain.
            - action: a specific action that the user is stating in the input
            - subject: a specific area that the user is stating in the input
            - message: a short message back to the user based on input. this is must.
            - keywords: a array of keywords that relat to this info.
            - weightage: a number between 0-1 that represents the depth factor of this action.
            `,
      output: {
        format: "json",
        schema: zUserPrefModel
          .pick({
            domain: true,
            subdomain: true,
            quantity: true,
            weightage: true,
          })
          .extend({
            action: z.string().optional().nullable(),
            subject: z.string().optional().nullable(),
            message: z.string(),
            keywords: z.array(z.string()).optional(),
          }),
      },
    });
    const response = genResponse.output();

    if (!response?.action || !response?.subject) {
      return {
        success: false,
        pref: {
          ...response,
          action: "",
          subject: "",
          type: input.type as any,
          user_id: input.user_id,
          quantity: response?.quantity ?? 0,
          data: {
            userInput: input.input,
            message: response?.message,
            keywords: response?.keywords,
          },
        },
        reason: "Action and Subject are required",
        skip: true,
      };
    }

    const existsAlready = await run("Check if User Pref Exists", async () => {
      return await UserPreferencesModel.findOne({
        user_id: input.user_id,
        //domain: response?.domain, // unstrict check
        //subdomain: response?.subdomain, // unstrict check

        action: response?.action,
        subject: response?.subject,
      });
    });

    if (existsAlready) {
      return {
        success: false,
        reason: "We already know this.",
      };
    }

    const saveToDB = await run("Save User Pref to DB", async () => {
      return await UserPreferencesModel.create({
        type: input.type,
        user_id: input.user_id,
        domain: response?.domain,
        subdomain: response?.subdomain,
        action: response?.action,
        subject: response?.subject,
        quantity: response?.quantity ?? 1,
        weightage: response?.weightage ?? 1,
        data: {
          userInput: input.input,
          message: response?.message,
          keywords: response?.keywords,
        },
      });
    });

    return {
      success: true,
      pref: saveToDB,
      message: response?.message,
      //followup: response?.keywords,
    };
  }
);
