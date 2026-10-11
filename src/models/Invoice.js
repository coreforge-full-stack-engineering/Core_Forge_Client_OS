import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: [true, "Invoice/Bill number is required."],
    },
    clientName: {
      type: String,
      required: [true, "Client/Vendor name is required."],
    },
    amount: {
      type: Number,
      required: [true, "Amount in ZAR is required."],
    },
    status: {
      type: String,
      enum: ["Pending Manager Approval", "Approved", "Rejected", "Paid"],
      default: "Pending Manager Approval",
    },
    uploadedBy: {
      type: String, // Display name of the person who submitted it
      default: "Internal Operations",
    },
    uploadedByEmail: {
      type: String,
      default: "",
    },
    approvedBy: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
    },
    documentUrl: {
      type: String, // Link or Base64 data for attached bill/invoice
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);