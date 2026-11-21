import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import expenseRoutes from "./routes/expenses.js";
import clientRoutes from "./routes/clients.js";
import projectRoutes from "./routes/projects.js";
import invoiceRoutes from "./routes/invoices.js";
import hostingRoutes from "./routes/hosting.js";
import quotationRoutes from "./routes/quotations.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://pegal-web-admin-page.vercel.app",
    ],
  }),
);

app.use(express.json());

app.use("/api/expenses", expenseRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/hosting", hostingRoutes);
app.use("/api/quotations", quotationRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PEGALWEB API is running",
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
