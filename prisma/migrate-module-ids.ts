/**
 * 원자 모듈 재설계에 따른 moduleId 마이그레이션
 * 실행: npx tsx prisma/migrate-module-ids.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

const RENAME_MAP: Record<string, string> = {
  "visitor-rating":  "score-input",
  "judge-scoring":   "score-input",
  "product-showcase": "info-board",
  "stamp-rally":     "stamp",
  "live-chat":       "chat",
};

async function main() {
  console.log("모듈 ID 마이그레이션 시작...\n");

  for (const [oldId, newId] of Object.entries(RENAME_MAP)) {
    // ── EventModule ──────────────────────────────────────────────────────────
    // 이미 newId 레코드가 있는 eventId는 충돌 방지를 위해 건너뜀
    const conflicts = await prisma.eventModule.findMany({
      where: { moduleId: newId },
      select: { eventId: true },
    });
    const conflictEventIds = new Set(conflicts.map((c) => c.eventId));

    const toMigrate = await prisma.eventModule.findMany({
      where: {
        moduleId: oldId,
        eventId: { notIn: [...conflictEventIds] },
      },
    });

    if (toMigrate.length > 0) {
      // FeatureModule upsert (참조 무결성)
      await prisma.featureModule.upsert({
        where: { id: newId },
        update: {},
        create: { id: newId, name: newId, description: "", configSchema: "{}" },
      });

      await prisma.eventModule.updateMany({
        where: { moduleId: oldId, eventId: { notIn: [...conflictEventIds] } },
        data: { moduleId: newId },
      });
      console.log(`EventModule: ${oldId} → ${newId} (${toMigrate.length}건)`);
    }

    // 충돌로 건너뛴 구 레코드 삭제
    if (conflictEventIds.size > 0) {
      await prisma.eventModule.deleteMany({
        where: { moduleId: oldId, eventId: { in: [...conflictEventIds] } },
      });
      console.log(`EventModule: ${oldId} 중복 ${conflictEventIds.size}건 삭제`);
    }

    // ── ModuleData ────────────────────────────────────────────────────────────
    const mdCount = await prisma.moduleData.updateMany({
      where: { moduleId: oldId },
      data: { moduleId: newId },
    });
    if (mdCount.count > 0) {
      console.log(`ModuleData: ${oldId} → ${newId} (${mdCount.count}건)`);
    }

    // ── TemplateModule ────────────────────────────────────────────────────────
    // newId FeatureModule 확보 후 TemplateModule을 옮기고 구 레코드 삭제
    await prisma.featureModule.upsert({
      where: { id: newId },
      update: {},
      create: { id: newId, name: newId, description: "", configSchema: "{}" },
    });
    // 이미 newId로 된 TemplateModule이 있는 (templateId, newId) 쌍은 건너뜀
    const tmConflicts = await prisma.templateModule.findMany({
      where: { moduleId: newId },
      select: { templateId: true },
    });
    const tmConflictIds = new Set(tmConflicts.map((t) => t.templateId));

    const tmToMigrate = await prisma.templateModule.findMany({
      where: { moduleId: oldId, templateId: { notIn: [...tmConflictIds] } },
    });
    if (tmToMigrate.length > 0) {
      await prisma.templateModule.updateMany({
        where: { moduleId: oldId, templateId: { notIn: [...tmConflictIds] } },
        data: { moduleId: newId },
      });
      console.log(`TemplateModule: ${oldId} → ${newId} (${tmToMigrate.length}건)`);
    }
    // 충돌로 건너뛴 구 TemplateModule 삭제
    if (tmConflictIds.size > 0) {
      await prisma.templateModule.deleteMany({
        where: { moduleId: oldId, templateId: { in: [...tmConflictIds] } },
      });
    }

    // ── FeatureModule (구 레코드 정리) ────────────────────────────────────────
    await prisma.featureModule.deleteMany({ where: { id: oldId } });
  }

  console.log("\n완료!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
