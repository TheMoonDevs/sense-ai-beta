import { defineFlow, run } from "@genkit-ai/flow";
import deserializeSenseUser from "../../middleware/deserializeUser";
import { zUserInfoModel, zUserInfoModelType } from "../../types/_data.userInfo";
import { UserInfoModel } from "../../models/_db.userInfo";

function mergeDeep(target: any, source: any) {
  for (const key in source) {
    if (Array.isArray(source[key])) {
      if (!target[key]) {
        target[key] = [];
      }
      target[key] = [...new Set([...target[key], ...source[key]])]; // Merge arrays uniquely
    } else if (source[key] instanceof Object) {
      if (!target[key]) {
        target[key] = {};
      }
      mergeDeep(target[key], source[key]); // Recursively merge objects
    } else {
      target[key] = source[key]; // Directly assign values
    }
  }
  return target;
}

export const UpdateUserInfoFlow = defineFlow(
  {
    name: "UpdateUserInfoFlow",
    inputSchema: zUserInfoModel.omit({
      _id: true,
      createdAt: true,
      updatedAt: true,
    }),
    outputSchema: zUserInfoModel,
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
    // Fetch existing user info
    let existingUserInfo = await UserInfoModel.findOne({ user_id: input.user_id });

    if (existingUserInfo) {
      // Merge existing data with input data
      mergeDeep(existingUserInfo, input);
    } else {
      // If no existing data, initialize with input data
      existingUserInfo = input;
    }

    // Perform the update operation in MongoDB
    const updatedUserInfo = await UserInfoModel.findOneAndUpdate(
      { user_id: input.user_id },
      existingUserInfo,
      { new: true, upsert: true } // Ensure defaults are set on insert
    );

    return updatedUserInfo;
  }
);
