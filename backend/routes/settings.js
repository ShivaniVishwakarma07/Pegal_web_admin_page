import express from "express";
import Settings from "../models/Settings.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const settings = await Settings.findOne({ key: "main" }).lean();

    res.json({
      success: true,
      settings: settings || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/", async (req, res) => {
  try {
    const data = { ...req.body };

    delete data._id;
    delete data.key;
    delete data.createdAt;
    delete data.updatedAt;

    const settings = await Settings.findOneAndUpdate(
      { key: "main" },
      {
        $set: data,
        $setOnInsert: { key: "main" },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    ).lean();

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
