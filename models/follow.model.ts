import { model, Schema } from "mongoose";

const FollowSchema = new Schema({
  doc_type: {
    type: String,
  },
  to_id: {
    type: Schema.Types.ObjectId,
    index: true
  },
  from_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true
  },
});

export default model("Follow", FollowSchema);
