import mongoose from "mongoose";

const AssetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide an asset name."],
    },
    category: {
      type: String,
      required: [true, "Please provide a category."],
      default: "General Equipment",
    },
    tagNumber: {
      type: String,
      required: [true, "Please provide an asset tag or serial number."],
    },
    assignedTo: {
      type: String,
      default: "Unassigned / Warehouse",
    },
    status: {
      type: String,
      default: "Available",
    },
    purchaseValue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Asset || mongoose.model("Asset", AssetSchema);