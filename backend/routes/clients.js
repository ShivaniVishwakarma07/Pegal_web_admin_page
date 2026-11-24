import express from "express";
import mongoose from "mongoose";
import Client from "../models/Client.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const client = await Client.create(req.body);

    res.status(201).json(client);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });

    res.json(clients);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid client ID",
      });
    }

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    res.json(client);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid client ID",
      });
    }

    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    res.json(client);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid client ID",
      });
    }

    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    res.json({
      success: true,
      message: "Client deleted successfully",
      clientId: req.params.id,
    });
  } catch (error) {
    console.error("Delete client error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;
