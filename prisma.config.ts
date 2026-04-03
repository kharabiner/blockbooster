import "dotenv/config";
import { defineConfig } from "prisma/config";

// prisma CLI (migrate deploy 등)는 DIRECT_URL을 우선 사용
// 앱 런타임(src/lib/prisma.ts)은 DATABASE_URL(pooler)을 직접 사용
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
