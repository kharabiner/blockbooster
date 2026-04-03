import path from "node:path";
import { defineConfig } from "prisma/config";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // 개발: SQLite 파일 DB
    // 운영: Supabase PostgreSQL (DATABASE_URL 환경변수 설정 필요)
    url: isProduction
      ? process.env.DATABASE_URL!
      : `file:${path.join(process.cwd(), "prisma", "dev.db")}`,
  },
});
