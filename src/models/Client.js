import mongoose from "mongoose";

// Define the blueprint for a Client document in MongoDB
const ClientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a client or company name."],
    },
    email: {
      type: String,
      required: [true, "Please provide a client email address."],
    },
    status: {
      type: String,
      default: "Active",
    },
    projects: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt dates!
  }
);

// Prevent re-declaring the model during Next.js Hot Reloading
export default mongoose.models.Client || mongoose.model("Client", ClientSchema);