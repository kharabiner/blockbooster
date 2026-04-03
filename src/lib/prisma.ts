import { PrismaClient } from "@/generated/prisma/client";
import path from "path";

function createPrismaClient() {
  if (process.env.NODE_ENV === "production") {
    // 운영: Supabase PostgreSQL — DATABASE_URL 환경변수로 연결
    // schema.prisma provider를 "postgresql"로 변경하고 재배포 필요
    const { Pool } = require("pg") as typeof import("pg");
    const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  // 개발: SQLite + better-sqlite3 어댑터
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3") as typeof import("@prisma/adapter-better-sqlite3");
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: ReturnType<typeof createPrismaClient> | undefined;
}

const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export { prisma };
