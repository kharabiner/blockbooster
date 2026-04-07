import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

/** 레지스트리와 동기화된 FeatureModule 시드 (configSchema는 UI 힌트용 JSON) */
const MODULES: { id: string; name: string; description: string; configSchema: string }[] = [
  {
    id: "score-input",
    name: "점수 입력",
    description: "부스에 점수를 부여합니다.",
    configSchema: JSON.stringify({
      label:         { type: "string",  default: "점수 입력" },
      min:           { type: "number",  default: 0 },
      max:           { type: "number",  default: 100 },
      allowedEmails: { type: "array",   default: [] },
    }),
  },
  {
    id: "info-board",
    name: "정보 보드",
    description: "운영자가 항목을 정의해 정보를 올립니다.",
    configSchema: JSON.stringify({
      title:      { type: "string",  default: "부스 정보" },
      fields:     { type: "array",   default: ["소개", "링크"] },
      allowEmbed: { type: "boolean", default: false },
    }),
  },
  {
    id: "stamp",
    name: "스탬프",
    description: "부스 방문 시 스탬프를 획득합니다.",
    configSchema: JSON.stringify({
      icon:  { type: "string", default: "⭐" },
      label: { type: "string", default: "방문 완료!" },
    }),
  },
  {
    id: "chat",
    name: "실시간 채팅",
    description: "부스별 실시간 소통",
    configSchema: JSON.stringify({ allowAnonymous: { type: "boolean", default: false } }),
  },
  {
    id: "reaction",
    name: "반응",
    description: "이모지 반응을 남깁니다.",
    configSchema: JSON.stringify({ options: { type: "array", default: ["👍", "🔥", "💡"] } }),
  },
  {
    id: "announcement",
    name: "공지사항",
    description: "이벤트 전체 공지",
    configSchema: JSON.stringify({}),
  },
];

/** 캡스톤 디자인 전시회 — 기본 추천 템플릿 (학부 졸업·종합설계 전시) */
const CAPSTONE_TEMPLATE = {
  name: "캡스톤 디자인 전시회",
  description:
    "팀 프로젝트 소개·심사 점수·방문 스탬프·질의응답·학우 반응까지 한 번에. 교수 심사 이메일은 이벤트 관리에서 점수 입력 모듈 설정에 추가하세요.",
  gridRows: 10,
  gridCols: 14,
  modules: [
    {
      moduleId: "announcement",
      config: {},
    },
    {
      moduleId: "info-board",
      config: {
        title: "프로젝트 정보",
        fields: ["팀명", "프로젝트 소개", "데모·시연 링크", "GitHub / 기술문서"],
        allowEmbed: true,
      },
    },
    {
      moduleId: "score-input",
      config: {
        label: "심사 점수 (종합)",
        min: 0,
        max: 100,
        allowedEmails: [] as string[],
      },
    },
    {
      moduleId: "stamp",
      config: {
        icon: "🎓",
        label: "전시 부스 방문 완료!",
      },
    },
    {
      moduleId: "chat",
      config: {
        allowAnonymous: false,
      },
    },
    {
      moduleId: "reaction",
      config: {
        options: ["👍", "🔥", "💡", "🎉"],
      },
    },
  ],
};

type TemplateSeed = {
  name: string;
  description: string;
  gridRows: number;
  gridCols: number;
  modules: { moduleId: string; config: Record<string, unknown> }[];
};

const OTHER_TEMPLATES: TemplateSeed[] = [
  {
    name: "플리마켓",
    description: "정보 보드로 상품 소개, 스탬프로 방문 인증.",
    gridRows: 8,
    gridCols: 10,
    modules: [
      { moduleId: "info-board", config: { title: "판매 정보", fields: ["상품명", "가격", "소개"], allowEmbed: false } },
      { moduleId: "stamp", config: { icon: "🛒", label: "방문 완료" } },
      { moduleId: "reaction", config: { options: ["❤️", "👍"] } },
    ],
  },
  {
    name: "박람회 / 컨퍼런스",
    description: "스탬프 랠리, 방문객 점수(1~5), 공지.",
    gridRows: 12,
    gridCols: 16,
    modules: [
      { moduleId: "announcement", config: {} },
      { moduleId: "stamp", config: { icon: "⭐", label: "부스 방문" } },
      {
        moduleId: "score-input",
        config: { label: "이 부스 어땠나요?", min: 1, max: 5, allowedEmails: [] },
      },
    ],
  },
  {
    name: "미니멀",
    description: "모듈 없이 부스 배치만. 이후 관리 화면에서 모듈을 추가하세요.",
    gridRows: 8,
    gridCols: 8,
    modules: [],
  },
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

  for (const m of MODULES) {
    await prisma.featureModule.upsert({ where: { id: m.id }, update: m, create: m });
  }
  console.log("✅ Feature modules seeded");

  const organizer = await upsertUser("organizer@blockbooster.kr", "이벤트 주최자");
  const boothUser = await upsertUser("booth@blockbooster.kr", "부스 운영자");
  console.log("✅ Dev users ready");

  await prisma.template.deleteMany({ where: { isPublic: true } });

  // 생성 순서: 캡스톤을 마지막에 넣어서 templates 목록(createdAt desc)에서 맨 위에 노출
  const allTemplates: TemplateSeed[] = [...OTHER_TEMPLATES, CAPSTONE_TEMPLATE];

  for (const t of allTemplates) {
    await prisma.template.create({
      data: {
        name: t.name,
        description: t.description,
        isPublic: true,
        gridRows: t.gridRows,
        gridCols: t.gridCols,
        slotLayout: "[]",
        ownerId: organizer.id,
        modules: {
          create: t.modules.map((row) => ({
            moduleId: row.moduleId,
            config: JSON.stringify(row.config),
          })),
        },
      },
    });
  }
  console.log("✅ Templates seeded (캡스톤 디자인 전시회 = 기본 추천)");

  let event = await prisma.event.findFirst({ where: { organizerId: organizer.id } });
  if (!event) {
    const { nanoid } = await import("nanoid");
    const capstoneDb = await prisma.template.findFirst({
      where: { name: CAPSTONE_TEMPLATE.name, isPublic: true },
    });

    event = await prisma.event.create({
      data: {
        title: "2026 캡스톤 디자인 전시회",
        description:
          "컴퓨터공학과 종합설계(캡스톤) 프로젝트 전시·심사. 각 팀은 정보 보드에 프로젝트를 등록하고, 심사위원은 점수를 입력합니다.",
        location: "공학관 1층 로비",
        shortCode: nanoid(8),
        startAt: new Date("2026-05-01T10:00:00"),
        endAt: new Date("2026-05-01T18:00:00"),
        status: "PUBLISHED",
        gridRows: CAPSTONE_TEMPLATE.gridRows,
        gridCols: CAPSTONE_TEMPLATE.gridCols,
        organizerId: organizer.id,
        templateId: capstoneDb?.id ?? null,
        ...(capstoneDb
          ? {}
          : {
              modules: {
                create: CAPSTONE_TEMPLATE.modules.map((row) => ({
                  moduleId: row.moduleId,
                  config: JSON.stringify(row.config),
                })),
              },
            }),
      },
    });

    // 템플릿만 연결된 경우에도 부스 페이지에서 모듈이 보이도록 EventModule 복사
    if (capstoneDb) {
      const existing = await prisma.eventModule.count({ where: { eventId: event.id } });
      if (existing === 0) {
        for (const row of CAPSTONE_TEMPLATE.modules) {
          await prisma.eventModule.create({
            data: {
              eventId: event.id,
              moduleId: row.moduleId,
              config: JSON.stringify(row.config),
            },
          });
        }
      }
    }

    const slotDefs = [
      { posX: 0, posY: 0, width: 2, height: 2, color: "#7C3AED", label: "A팀" },
      { posX: 2, posY: 0, width: 2, height: 2, color: "#3B82F6", label: "B팀" },
      { posX: 4, posY: 0, width: 2, height: 2, color: "#22C55E", label: "C팀" },
      { posX: 0, posY: 2, width: 2, height: 2, color: "#F59E0B", label: "D팀" },
    ];
    for (const s of slotDefs) {
      await prisma.boothSlot.create({ data: { ...s, eventId: event.id } });
    }
    console.log("✅ Demo event + slots + 캡스톤 모듈");
  }

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

  const emptySlot = await prisma.boothSlot.findFirst({
    where: { eventId: event!.id, boothId: null },
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
