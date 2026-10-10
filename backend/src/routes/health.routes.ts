import { Router } from "express";
import prisma from "../config/prisma";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
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

router.get("/migrate", async (_req, res) => {
  try {
    const { stdout, stderr } = await execAsync("bunx prisma db push --accept-data-loss", {
      env: process.env,
    });

    res.status(200).json({
      success: true,
      message: "Database schema pushed successfully",
      stdout,
      stderr,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    res.status(500).json({
      success: false,
      message: "Migration failed",
      error: error.message,
      stderr: error.stderr,
    });
  }
});

export default router;
