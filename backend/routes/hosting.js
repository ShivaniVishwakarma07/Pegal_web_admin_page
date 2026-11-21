import express from "express";
import mongoose from "mongoose";
import Hosting from "../models/Hosting.js";
import Client from "../models/Client.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const services = await Hosting.find().populate("clientId").sort({ due: 1 });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/upcoming", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const limit = new Date(today);
    limit.setDate(limit.getDate() + 30);
    limit.setHours(23, 59, 59, 999);

    const services = await Hosting.find({
      due: { $gte: today, $lte: limit },
    })
      .populate("clientId")
      .sort({ due: 1 });

    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = { ...req.body };

    if (data.clientId && !mongoose.Types.ObjectId.isValid(data.clientId)) {
      return res.status(400).json({ message: "Invalid client ID" });
    }

    if (!data.clientId && data.email) {
      const client = await Client.findOne({
        email: String(data.email).trim().toLowerCase(),
      });

      if (client) data.clientId = client._id;
    }

    data.remind = 30;

    const service = await Hosting.create(data);

    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const data = { ...req.body };
    data.remind = 30;

    const service = await Hosting.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Hosting.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/paid", async (req, res) => {
  try {
    const service = await Hosting.findByIdAndUpdate(
      req.params.id,
      { paid: Boolean(req.body.paid) },
      { new: true },
    );

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
