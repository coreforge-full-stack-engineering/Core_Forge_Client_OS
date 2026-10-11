import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    senderEmail: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    // Emails of users who deleted/hidden this chat or message from their own side
    hiddenFor: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Message || mongoose.model("Message", MessageSchema);