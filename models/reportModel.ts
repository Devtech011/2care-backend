import mongoose, { Schema } from "mongoose";

const reportSchema = new Schema({
  summary: { type: String, required: true },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }
}, { timestamps: true });

export default mongoose.model("Report", reportSchema);
