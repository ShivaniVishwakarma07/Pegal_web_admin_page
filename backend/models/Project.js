import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      trim: true,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Paid", "Pending", "Overdue", "Unpaid", "Partial"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  },
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    projectId: {
      type: String,
      trim: true,
      default: "",
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
    clientName: {
      type: String,
      trim: true,
      default: "",
    },
    bills: {
      type: [billSchema],
      default: [],
    },
    payroll: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Project", projectSchema);
