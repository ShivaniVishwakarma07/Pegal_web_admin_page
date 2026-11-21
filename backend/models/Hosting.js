import mongoose from "mongoose";

const hostingSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Hosting", "Maintenance"],
      default: "Hosting",
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
    },
    client: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
    },
    plan: {
      type: String,
      default: "",
    },
    detail: {
      type: String,
      default: "",
    },
    tenure: {
      type: Number,
      default: 12,
      min: 1,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    gstOn: {
      type: Boolean,
      default: true,
    },
    billed: {
      type: Date,
      required: true,
    },
    due: {
      type: Date,
      required: true,
    },
    remind: {
      type: Number,
      default: 30,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
    reminderHistory: [
      {
        reminderDate: Date,
        channel: {
          type: String,
          enum: ["WhatsApp", "Email"],
        },
        status: {
          type: String,
          enum: ["Sent", "Failed"],
        },
        message: String,
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Hosting", hostingSchema);
