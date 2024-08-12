import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { zUserSchema } from "../../types/_data.user";
import UserModel from "../../models/user.model";

export const updateUserDataFlow = defineFlow(
  {
    name: "updateUserDataFlow",
    inputSchema: z.object({
      user_id: z.string(),
      updates: zUserSchema.partial(), // Accept any partial update of the user schema
    }),
    outputSchema: zUserSchema,
    middleware: [deserializeSenseUser],
    authPolicy: (auth, input) => {
      if (!auth || !auth._id) {
        throw new Error("Authorization required.");
      }
      input.user_id = auth._id.toString();
    },
  },
  async (input) => {
    const { user_id, updates } = input;

    if (!user_id) {
      throw new Error("User Id is required");
    }

    // Ensure that updates are provided
    if (Object.keys(updates).length === 0) {
      throw new Error("No updates provided");
    }

    // Update the user in the database
    const user = await UserModel.findOneAndUpdate(
      { _id: user_id },
      { $set: updates }, // Only update fields provided in updates
      { new: true } // Return the updated document
    );

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
);
