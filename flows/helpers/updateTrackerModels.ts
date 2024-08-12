import { UserInterestTrackerModel } from "../../models/_db.userInterestTracker";
import { pointsWeightage } from "../userInterest/_config";

export const updateTrackerModel = async ({
  user_id,
  interest_id,
  topic_id,
  topic_type,
  isCorrect,
}: {
  user_id: string;
  interest_id: string;
  topic_id: string;
  topic_type: string;
  isCorrect: boolean;
}) => {
  const pointType = isCorrect ? "correct" : "incorrect";
  const pointsToAdd =
    pointsWeightage?.find((point) => point?.type === pointType)?.points || 0;

  const submittedPoints =
    pointsWeightage?.find((point) => point?.type === "submitted")?.points || 0;

  const update = {
    $inc: {
      submitted: 1,
      total_points: submittedPoints,
    },
    $set: { lastSubmitted: new Date() },
    $setOnInsert: {
      points_distribution: [
        {
          type: "submitted",
          count: 1,
          points: submittedPoints,
        },
        {
          type: pointType,
          count: 1,
          points: pointsToAdd,
        },
      ],
    },
  };

  const updateOperation = await UserInterestTrackerModel.findOneAndUpdate(
    {
      user_id,
      interest_id,
      topic_id,
      topic_type,
    },
    update,
    {
      new: true,
      upsert: true,
    }
  );

  // Update points_distribution array separately if necessary
  if (updateOperation) {
    const updatePointsDistribution = (type: string, points: number) => {
      const distribution = updateOperation.points_distribution.find(
        (entry: any) => entry.type === type
      );

      if (distribution) {
        distribution.count += 1;
        distribution.points += points;
      } else {
        updateOperation.points_distribution.push({
          type: type,
          count: 1,
          points: points,
        });
      }
    };

    // Update for "submitted" type
    updatePointsDistribution("submitted", submittedPoints);

    // Update for "correct" or "incorrect" type
    updatePointsDistribution(pointType, pointsToAdd);

    // Save the updated document
    await updateOperation.save();
  }

  return updateOperation;
};
