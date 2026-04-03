import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

const MODULES = [
  { id: "visitor-rating", name: "방문객 별점", description: "방문객이 부스에 1~5점 별점을 부여합니다.", configSchema: JSON.stringify({ maxStars: { type: "number", default: 5 }, label: { type: "string", default: "이 부스를 평가해주세요" } }) },
  { id: "judge-scoring", name: "심사위원 채점", description: "심사위원이 기준별 점수를 입력해 채점합니다.", configSchema: JSON.stringify({ criteria: { type: "array", default: ["창의성", "완성도", "발표력"] }, maxScore: { type: "number", default: 10 } }) },
  { id: "stamp-rally", name: "스탬프 랠리", description: "부스를 방문하면 스탬프를 획득합니다.", configSchema: JSON.stringify({ stampIcon: { type: "string", default: "⭐" } }) },
  { id: "product-showcase", name: "상품 진열", description: "상품/서비스 목록을 방문객에게 보여줍니다.", configSchema: JSON.stringify({ showPrice: { type: "boolean", default: true } }) },
  { id: "live-chat", name: "실시간 채팅", description: "부스별 실시간 채팅 기능을 제공합니다.", configSchema: JSON.stringify({ allowAnonymous: { type: "boolean", default: false } }) },
  { id: "announcement", name: "공지사항", description: "이벤트 전체에 공지를 전달합니다.", configSchema: JSON.stringify({}) },
];

async function main() {
  console.log("🌱 Seeding database...");

  // 모듈 upsert
  for (const m of MODULES) {
    await prisma.featureModule.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }
  console.log("✅ Feature modules seeded");

  // 개발팀 시스템 계정
  const devEmail = "dev@blockbooster.kr";
  let devUser = await prisma.user.findUnique({ where: { email: devEmail } });
  if (!devUser) {
    devUser = await prisma.user.create({
      data: {
        name: "BlockBooster 팀",
        email: devEmail,
        password: await bcrypt.hash("devpassword123", 12),
      },
    });
  }
  console.log("✅ Dev user ready");

  // 기본 템플릿 생성
  const templates = [
    {
      name: "캡스톤 전시회",
      description: "캡스톤 디자인 발표와 학과 전시에 최적화된 템플릿입니다. 심사위원 채점과 방문객 별점 기능을 포함합니다.",
      isPublic: true,
      gridRows: 10,
      gridCols: 12,
      slotLayout: "[]",
      modules: ["judge-scoring", "visitor-rating"],
    },
    {
      name: "플리마켓",
      description: "플리마켓, 벼룩시장에 적합한 템플릿입니다. 상품 진열과 스탬프 랠리 기능을 포함합니다.",
      isPublic: true,
      gridRows: 8,
      gridCols: 10,
      slotLayout: "[]",
      modules: ["product-showcase", "stamp-rally"],
    },
    {
      name: "박람회 / 컨퍼런스",
      description: "대규모 박람회나 컨퍼런스에 적합합니다. 스탬프 랠리와 별점 평가 기능을 포함합니다.",
      isPublic: true,
      gridRows: 12,
      gridCols: 16,
      slotLayout: "[]",
      modules: ["stamp-rally", "visitor-rating", "announcement"],
    },
    {
      name: "기본 이벤트",
      description: "추가 기능 없이 부스 정보만 제공하는 기본 템플릿입니다.",
      isPublic: true,
      gridRows: 8,
      gridCols: 8,
      slotLayout: "[]",
      modules: [],
    },
  ];

  for (const t of templates) {
    const existing = await prisma.template.findFirst({
      where: { name: t.name, ownerId: devUser.id },
    });
    if (!existing) {
      await prisma.template.create({
        data: {
          name: t.name,
          description: t.description,
          isPublic: t.isPublic,
          gridRows: t.gridRows,
          gridCols: t.gridCols,
          slotLayout: t.slotLayout,
          ownerId: devUser.id,
          modules: {
            create: t.modules.map((moduleId) => ({ moduleId })),
          },
        },
      });
      console.log(`✅ Template "${t.name}" created`);
    }
  }

  console.log("🎉 Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
