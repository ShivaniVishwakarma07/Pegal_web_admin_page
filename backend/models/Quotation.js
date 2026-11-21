import mongoose from "mongoose";

const quotationSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    client: {
      clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        default: null,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      company: {
        type: String,
        default: "",
        trim: true,
      },
      email: {
        type: String,
        default: "",
        trim: true,
      },
      phone: {
        type: String,
        default: "",
        trim: true,
      },
      address: {
        type: String,
        default: "",
        trim: true,
      },
    },
    project: {
      type: String,
      default: "",
      trim: true,
    },
    items: {
      type: Array,
      default: [],
    },
    gstOn: {
      type: Boolean,
      default: true,
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    gst: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Quotation", quotationSchema);
