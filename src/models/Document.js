import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Document title is required."],
    },
    category: {
      type: String,
      default: "Internal Brief", // Proposal, Contract, Technical Spec, Internal Brief
    },
    clientName: {
      type: String,
      default: "General Operations",
    },
    fileUrl: {
      type: String,
      default: "#",
    },
    uploadedBy: {
      type: String,
      default: "Internal Staff",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Document || mongoose.model("Document", DocumentSchema);