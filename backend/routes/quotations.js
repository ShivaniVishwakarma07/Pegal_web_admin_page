import express from "express";
import mongoose from "mongoose";
import Quotation from "../models/Quotation.js";
import Client from "../models/Client.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .populate("client.clientId")
      .sort({ createdAt: -1 });

    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid quotation ID" });
    }

    const quotation = await Quotation.findById(req.params.id).populate(
      "client.clientId",
    );

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const quotationData = { ...req.body };

    if (
      quotationData.client?.clientId &&
      mongoose.Types.ObjectId.isValid(quotationData.client.clientId)
    ) {
      const client = await Client.findById(quotationData.client.clientId);

      if (client) {
        quotationData.client = {
          ...quotationData.client,
          clientId: client._id,
        };
      }
    } else if (quotationData.client?.email) {
      const client = await Client.findOne({
        email: quotationData.client.email.trim().toLowerCase(),
      });

      if (client) {
        quotationData.client = {
          ...quotationData.client,
          clientId: client._id,
        };
      }
    }

    const quotation = await Quotation.create(quotationData);

    res.status(201).json(quotation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid quotation ID" });
    }

    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    res.json(quotation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid quotation ID" });
    }

    const quotation = await Quotation.findByIdAndDelete(req.params.id);

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    res.json({
      success: true,
      message: "Quotation deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
