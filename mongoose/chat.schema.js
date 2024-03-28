import mongoose from "mongoose";
const chatSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  imageUrl: String,
});

export const chatModel = mongoose.model("Chat", chatSchema);
