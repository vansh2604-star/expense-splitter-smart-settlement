import express from "express";
import cors from "cors";

import healthRouter from "./routes/health.routes";
import authRouter from "./routes/auth.routes";
import groupRoutes from "./routes/group.routes";
import expenseRoutes from "./routes/expense.routes";
import settlementRoutes from "./routes/settlement.routes";
import settlementPaymentRoutes from "./routes/settlementPayment.routes";
import walletRoutes from "./routes/wallet.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Expense Splitter API is running 🚀",
  });
});

app.use("/api/health", healthRouter);

app.use("/api/auth", authRouter);

app.use("/api/groups", groupRoutes);

app.use("/api", expenseRoutes);

app.use("/api/groups", settlementRoutes);

app.use("/api", settlementPaymentRoutes);

app.use("/api", walletRoutes);


export default app;


