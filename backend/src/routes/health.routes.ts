import { Router } from "express";
import prisma from "../config/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "Server and database are running",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    const dbUrl = process.env.DATABASE_URL || "";
    let maskedDb = "not set";
    if (dbUrl) {
      try {
        const parsed = new URL(dbUrl);
        maskedDb = `${parsed.protocol}//${parsed.username}:***@${parsed.host}${parsed.pathname}`;
      } catch {
        maskedDb = "configured";
      }
    }

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error),
      databaseTarget: maskedDb,
    });
  }
});

export default router;
