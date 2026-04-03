import { Pool } from "pg";
import fs from "fs";
import path from "path";

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

  const sqlPath = path.join(
    process.cwd(),
    "prisma/migrations/20260403000000_init/migration.sql"
  );
  const sql = fs.readFileSync(sqlPath, "utf-8");

  // 세미콜론 기준으로 개별 구문 분리
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let applied = 0;
  let skipped = 0;

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      applied++;
    } catch (e: unknown) {
      const code = (e as { code?: string }).code;
      // 이미 존재(테이블/인덱스/제약조건) → 무시
      if (code === "42P07" || code === "42710" || code === "23505") {
        skipped++;
      } else {
        console.error("Migration error:", e);
        await pool.end();
        process.exit(1);
      }
    }
  }

  console.log(`✔ Migration complete: ${applied} applied, ${skipped} skipped`);
  await pool.end();
}

migrate();
