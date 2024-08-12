import { defineFlow, run } from "@genkit-ai/flow";
import { z } from "zod";
import { UserInterestTrackerModel } from "../../models/_db.userInterestTracker";
import { zUserInterestTrackerSchema } from "../../types/_data.userInterestTracker";

export const fetchLeaderboardDataFlow = defineFlow(
  {
    name: "fetchLeaderboardDataFlow",
    inputSchema: z.object({
      user_id: z.string().optional(),
      interest_id: z.string().optional(),
      topic_type: z.string().optional(),
      topic_id: z.string().optional(),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(10),
    }),
    outputSchema: z
      .object({
        currentPage: z.number(),
        totalPages: z.number(),
        hasNextPage: z.boolean(),
        data: z
          .array(zUserInterestTrackerSchema.optional().nullable())
          .nullable(),
      })
      .nullable(),
  },
  async (input) => {
    const { user_id, interest_id, topic_type, topic_id, page, limit } = input;

    const skip = (page - 1) * limit;

    // Fetch the paginated users sorted by total_points
    const paginatedUsers = await UserInterestTrackerModel.find({
      ...(interest_id && { interest_id }),
      ...(topic_id && { topic_id }),
      ...(topic_type && { topic_type }),
    })
      .sort({ total_points: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user_id");

    // Calculate ranks for the paginated users
    const rankedUsers = paginatedUsers.map((user, index) => ({
      ...user.toObject(),
      rank: skip + index + 1,
    }));

    // Fetch the user with the specified user_id if not already in the paginated results
    if (
      user_id &&
      !rankedUsers.some((user) => user.user_id._id.toString() === user_id)
    ) {
      const userWithId = await UserInterestTrackerModel.findOne({ user_id })
        .sort({ total_points: -1 })
        .populate("user_id");

      if (userWithId) {
        // Calculate the rank for the user with user_id
        const userRank = await UserInterestTrackerModel.countDocuments({
          ...(interest_id && { interest_id }),
          ...(topic_id && { topic_id }),
          ...(topic_type && { topic_type }),
          total_points: { $gt: userWithId.total_points },
        });

        rankedUsers.push({
          ...userWithId.toObject(),
          rank: userRank + 1,
        });
      }
    }

    // Sort the final result by rank
    rankedUsers.sort((a, b) => a.rank - b.rank);

    // Fetch the total count of users for pagination
    const totalCount = await UserInterestTrackerModel.countDocuments({
      ...(interest_id && { interest_id }),
      ...(topic_id && { topic_id }),
      ...(topic_type && { topic_type }),
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;

    // Return empty data if current page exceeds total pages
    if (page > totalPages) {
      return {
        currentPage: page,
        totalPages,
        hasNextPage,
        data: [],
      };
    }

    return {
      currentPage: page,
      totalPages,
      hasNextPage,
      data: rankedUsers,
    };
  }
);
