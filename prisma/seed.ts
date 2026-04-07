import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MODULES = [
  { id: "visitor-rating", name: "방문객 별점", description: "방문객이 부스에 1~5점 별점을 부여합니다.", configSchema: JSON.stringify({ maxStars: { type: "number", default: 5 }, label: { type: "string", default: "이 부스를 평가해주세요" } }) },
  { id: "judge-scoring", name: "심사위원 채점", description: "심사위원이 기준별 점수를 입력해 채점합니다.", configSchema: JSON.stringify({ criteria: { type: "array", default: ["창의성", "완성도", "발표력"] }, maxScore: { type: "number", default: 10 } }) },
  { id: "stamp-rally", name: "스탬프 랠리", description: "부스를 방문하면 스탬프를 획득합니다.", configSchema: JSON.stringify({ stampIcon: { type: "string", default: "⭐" } }) },
  { id: "product-showcase", name: "상품 진열", description: "상품/서비스 목록을 방문객에게 보여줍니다.", configSchema: JSON.stringify({ showPrice: { type: "boolean", default: true } }) },
  { id: "live-chat", name: "실시간 채팅", description: "부스별 실시간 채팅 기능을 제공합니다.", configSchema: JSON.stringify({ allowAnonymous: { type: "boolean", default: false } }) },
  { id: "announcement", name: "공지사항", description: "이벤트 전체에 공지를 전달합니다.", configSchema: JSON.stringify({}) },
];

async function upsertUser(email: string, name: string) {
  const pw = await bcrypt.hash("devpassword123", 12);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, password: pw },
  });
}

async function main() {
  console.log("🌱 Seeding database...");

  // 모듈 upsert
  for (const m of MODULES) {
    await prisma.featureModule.upsert({ where: { id: m.id }, update: m, create: m });
  }
  console.log("✅ Feature modules seeded");

  // ── 계정 생성 ──────────────────────────────────────
  const organizer = await upsertUser("organizer@blockbooster.kr", "이벤트 주최자");
  const boothUser  = await upsertUser("booth@blockbooster.kr",     "부스 운영자");
  console.log("✅ Dev users ready");

  // ── 기본 템플릿 ────────────────────────────────────
  const TEMPLATES = [
    { name: "캡스톤 전시회",    description: "심사위원 채점과 방문객 별점 기능을 포함합니다.", modules: ["judge-scoring", "visitor-rating"], gridRows: 10, gridCols: 12 },
    { name: "플리마켓",         description: "상품 진열과 스탬프 랠리 기능을 포함합니다.",    modules: ["product-showcase", "stamp-rally"],  gridRows: 8,  gridCols: 10 },
    { name: "박람회 / 컨퍼런스", description: "스탬프 랠리와 별점 평가, 공지 기능을 포함합니다.", modules: ["stamp-rally", "visitor-rating", "announcement"], gridRows: 12, gridCols: 16 },
    { name: "기본 이벤트",      description: "추가 기능 없이 부스 정보만 제공합니다.",        modules: [],                                  gridRows: 8,  gridCols: 8  },
  ];

  for (const t of TEMPLATES) {
    const existing = await prisma.template.findFirst({ where: { name: t.name, ownerId: organizer.id } });
    if (!existing) {
      await prisma.template.create({
        data: {
          name: t.name, description: t.description,
          isPublic: true, gridRows: t.gridRows, gridCols: t.gridCols, slotLayout: "[]",
          ownerId: organizer.id,
          modules: { create: t.modules.map((moduleId) => ({ moduleId })) },
        },
      });
    }
  }
  console.log("✅ Templates seeded");

  // ── 데모 이벤트 (주최자 계정) ──────────────────────
  let event = await prisma.event.findFirst({ where: { organizerId: organizer.id } });
  if (!event) {
    const { nanoid } = await import("nanoid");
    event = await prisma.event.create({
      data: {
        title: "2026 캡스톤 디자인 전시회",
        description: "컴퓨터공학과 캡스톤 디자인 프로젝트 전시 및 심사 이벤트입니다.",
        location: "공학관 1층 로비",
        shortCode: nanoid(8),
        startAt: new Date("2026-05-01T10:00:00"),
        endAt:   new Date("2026-05-01T18:00:00"),
        status: "PUBLISHED",
        gridRows: 6,
        gridCols: 8,
        organizerId: organizer.id,
      },
    });
    // 슬롯 4개 배치
    const slotDefs = [
      { posX: 0, posY: 0, width: 2, height: 2, color: "#7C3AED", label: "A팀" },
      { posX: 2, posY: 0, width: 2, height: 2, color: "#3B82F6", label: "B팀" },
      { posX: 4, posY: 0, width: 2, height: 2, color: "#22C55E", label: "C팀" },
      { posX: 0, posY: 2, width: 2, height: 2, color: "#F59E0B", label: "D팀" },
    ];
    for (const s of slotDefs) {
      await prisma.boothSlot.create({ data: { ...s, eventId: event.id } });
    }
    console.log("✅ Demo event + slots created");
  }

  // ── 데모 부스 (부스 운영자 계정) ──────────────────
  let booth = await prisma.booth.findFirst({ where: { ownerId: boothUser.id } });
  if (!booth) {
    const { nanoid } = await import("nanoid");
    booth = await prisma.booth.create({
      data: {
        name: "스마트 홈 IoT 프로젝트",
        description: "라즈베리파이 기반 스마트 홈 자동화 시스템 프로젝트입니다.",
        category: "IoT / 임베디드",
        shortCode: nanoid(8),
        ownerId: boothUser.id,
      },
    });
    console.log("✅ Demo booth created");
  }

  // ── 슬롯 신청 (부스 → 이벤트 첫 번째 빈 슬롯) ────
  const emptySlot = await prisma.boothSlot.findFirst({
    where: { eventId: event.id, boothId: null },
  });
  if (emptySlot) {
    const alreadyApplied = await prisma.slotApplication.findFirst({
      where: { slotId: emptySlot.id, boothId: booth.id },
    });
    if (!alreadyApplied) {
      await prisma.slotApplication.create({
        data: {
          slotId: emptySlot.id,
          boothId: booth.id,
          applicantId: boothUser.id,
          message: "안녕하세요! 저희 IoT 프로젝트 부스를 신청합니다.",
          status: "PENDING",
        },
      });
      console.log("✅ Slot application created");
    }
  }

  console.log("🎉 Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
