import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: true },
);

const invoiceSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    issue: {
      type: Date,
      required: true,
    },

    due: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      default: "Unpaid",
      trim: true,
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
        trim: true,
        default: "",
      },

      email: {
        type: String,
        trim: true,
        default: "",
      },

      phone: {
        type: String,
        trim: true,
        default: "",
      },

      address: {
        type: String,
        trim: true,
        default: "",
      },

      gstin: {
        type: String,
        trim: true,
        default: "",
      },
    },

    items: {
      type: Array,
      default: [],
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    gstOn: {
      type: Boolean,
      default: true,
    },

    supply: {
      type: String,
      default: "intra",
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

    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    refunds: {
      type: [refundSchema],
      default: [],
    },
  },
  { timestamps: true },
);

invoiceSchema.pre("validate", function (next) {
  if (this.client && (!this.client.clientId || this.client.clientId === "")) {
    this.client.clientId = null;
  }

  next();
});

export default mongoose.model("Invoice", invoiceSchema);
