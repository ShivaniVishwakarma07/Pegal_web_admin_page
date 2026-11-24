import express from "express";
import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";
import Expense from "../models/Expense.js";
import Project from "../models/Project.js";
import Client from "../models/Client.js";

const router = express.Router();

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const prepareClient = async (client) => {
  if (!client) {
    return client;
  }

  const email = String(client.email || "")
    .trim()
    .toLowerCase();

  let clientId = client.clientId || null;

  if (clientId && isValidId(clientId)) {
    const existingClient = await Client.findById(clientId);

    if (!existingClient) {
      clientId = null;
    }
  } else {
    clientId = null;
  }

  if (!clientId && email) {
    let existingClient = await Client.findOne({ email });

    if (!existingClient) {
      existingClient = await Client.create({
        name: client.name || "",
        company: client.company || "",
        email,
        phone: client.phone || "",
        address: client.address || "",
        gstin: client.gstin || "",
      });
    }

    clientId = existingClient._id;
  }

  return {
    ...client,
    email,
    clientId,
  };
};

router.post("/", async (req, res) => {
  try {
    const invoiceData = { ...req.body };

    if (invoiceData.client) {
      invoiceData.client = await prepareClient(invoiceData.client);
    }

    const invoice = await Invoice.create(invoiceData);

    res.status(201).json(invoice);
  } catch (error) {
    console.error("Create invoice error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Invoice number already exists. Please use another invoice number.",
      });
    }

    res.status(500).json({
      message: error.message,
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid invoice ID",
      });
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    if (
      invoice.status === "Paid" ||
      invoice.status === "Refunded" ||
      invoice.status === "Partially Refunded"
    ) {
      return res.status(400).json({
        message: "Paid or refunded invoices cannot be edited.",
      });
    }

    const invoiceData = { ...req.body };

    if (invoiceData.client) {
      invoiceData.client = await prepareClient(invoiceData.client);
    }

    delete invoiceData._id;
    delete invoiceData.createdAt;
    delete invoiceData.updatedAt;
    delete invoiceData.refunds;
    delete invoiceData.refundedAmount;

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      invoiceData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedInvoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    res.json(updatedInvoice);
  } catch (error) {
    console.error("Update invoice error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Invoice number already exists. Please use another invoice number.",
      });
    }

    res.status(500).json({
      message: error.message,
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid invoice ID",
      });
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    if (
      invoice.status !== "Unpaid" ||
      Number(invoice.refundedAmount || 0) > 0 ||
      (invoice.refunds && invoice.refunds.length > 0)
    ) {
      return res.status(400).json({
        message: "Only unpaid invoices without refunds can be deleted.",
      });
    }

    await Invoice.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
      invoiceId: req.params.id,
    });
  } catch (error) {
    console.error("Delete invoice error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate("client.clientId")
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    console.error("Get invoices error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/client/:clientId/financials", async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!isValidId(clientId)) {
      return res.status(400).json({
        message: "Invalid client ID",
      });
    }

    const invoices = await Invoice.find({
      "client.clientId": clientId,
    });

    const expenses = await Expense.find({
      clientId,
    });

    const projects = await Project.find({
      clientId,
    });

    let totalProjectRevenue = 0;
    let totalReceived = 0;
    let totalRefunded = 0;
    let pendingPayments = 0;

    invoices.forEach((invoice) => {
      const total = Number(invoice.total || 0);
      const refunded = Number(invoice.refundedAmount || 0);

      totalProjectRevenue += total;
      totalRefunded += refunded;

      const received = Math.max(0, total - refunded);

      if (
        invoice.status === "Paid" ||
        invoice.status === "Partially Refunded" ||
        invoice.status === "Refunded"
      ) {
        totalReceived += received;
      }

      if (
        invoice.status === "Unpaid" ||
        invoice.status === "Pending" ||
        invoice.status === "Overdue"
      ) {
        pendingPayments += received;
      }
    });

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0,
    );

    const netProfit = totalReceived - totalExpenses;

    res.json({
      clientId,
      totalProjectRevenue,
      totalReceived,
      totalRefunded,
      totalExpenses,
      netProfit,
      pendingPayments,
      invoiceCount: invoices.length,
      projectCount: projects.length,
    });
  } catch (error) {
    console.error("Client financials error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid invoice ID",
      });
    }

    const invoice = await Invoice.findById(req.params.id).populate(
      "client.clientId",
    );

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    res.json(invoice);
  } catch (error) {
    console.error("Get invoice error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/:id/link-client", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid invoice ID",
      });
    }

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const email = String(invoice.client?.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Invoice client email is missing",
      });
    }

    let client = await Client.findOne({ email });

    if (!client) {
      client = await Client.create({
        name: invoice.client.name || "",
        company: invoice.client.company || "",
        email,
        phone: invoice.client.phone || "",
        address: invoice.client.address || "",
        gstin: invoice.client.gstin || "",
      });
    }

    invoice.client.clientId = client._id;

    await invoice.save();

    res.json({
      success: true,
      message: "Client linked successfully",
      clientId: client._id,
    });
  } catch (error) {
    console.error("Link client error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/:id/refund", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid invoice ID",
      });
    }

    const { amount, reason } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        message: "Invoice not found",
      });
    }

    const refundAmount = Number(amount);

    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({
        message: "Enter a valid refund amount.",
      });
    }

    const alreadyRefunded = Number(invoice.refundedAmount || 0);
    const refundableAmount = Number(invoice.total || 0) - alreadyRefunded;

    if (refundableAmount <= 0) {
      return res.status(400).json({
        message: "Maximum refundable amount is 0",
      });
    }

    if (refundAmount > refundableAmount) {
      return res.status(400).json({
        message: `Maximum refundable amount is ${refundableAmount}`,
      });
    }

    invoice.refunds.push({
      amount: refundAmount,
      date: new Date(),
      reason: reason?.trim() || "",
    });

    invoice.refundedAmount = alreadyRefunded + refundAmount;

    if (invoice.refundedAmount >= invoice.total) {
      invoice.refundedAmount = invoice.total;
      invoice.status = "Refunded";
    } else {
      invoice.status = "Partially Refunded";
    }

    await invoice.save();

    res.json(invoice);
  } catch (error) {
    console.error("Refund invoice error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;
