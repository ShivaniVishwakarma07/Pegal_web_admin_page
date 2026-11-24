import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    profile: { type: mongoose.Schema.Types.Mixed, default: {} },
    business: { type: mongoose.Schema.Types.Mixed, default: {} },
    banks: { type: [mongoose.Schema.Types.Mixed], default: [] },
    qrs: { type: [mongoose.Schema.Types.Mixed], default: [] },
    invoice: { type: mongoose.Schema.Types.Mixed, default: {} },
    notify: { type: mongoose.Schema.Types.Mixed, default: {} },
    twoFA: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Settings", settingsSchema);
