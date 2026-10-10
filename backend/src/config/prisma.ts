import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "";

const isRemoteDb =
  connectionString.includes("render.com") ||
  connectionString.includes("neon.tech") ||
  connectionString.includes("supabase.co") ||
  process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});

export default prisma;
