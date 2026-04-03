import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getAllModules } from "@/lib/modules/registry";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
  gridRows: z.number().int().min(5).max(30).default(10),
  gridCols: z.number().int().min(5).max(30).default(10),
  slotLayout: z.array(z.any()).default([]),
  modules: z
    .array(
      z.object({
        moduleId: z.string(),
        config: z.record(z.string(), z.any()).default({}),
      })
    )
    .default([]),
});

// GET /api/templates — 공개 템플릿 목록
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";
  const session = await auth();

  const templates = await prisma.template.findMany({
    where: mine && session?.user?.id ? { ownerId: session.user.id } : { isPublic: true },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      modules: { include: { module: true } },
      _count: { select: { events: true } },
    },
  });

  return NextResponse.json(templates);
}

// POST /api/templates — 템플릿 생성
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, description, isPublic, gridRows, gridCols, slotLayout, modules } = parsed.data;

  // 레지스트리에 없는 모듈 필터
  const allModules = getAllModules();
  const validModuleIds = new Set(allModules.map((m) => m.id));

  // DB에 모듈 upsert (레지스트리 동기화)
  await Promise.all(
    allModules.map((m) =>
      prisma.featureModule.upsert({
        where: { id: m.id },
        update: { name: m.name, description: m.description, configSchema: JSON.stringify(m.configSchema) },
        create: { id: m.id, name: m.name, description: m.description, configSchema: JSON.stringify(m.configSchema) },
      })
    )
  );

  const template = await prisma.template.create({
    data: {
      name,
      description,
      isPublic,
      gridRows,
      gridCols,
      slotLayout: JSON.stringify(slotLayout),
      ownerId: session.user.id,
      modules: {
        create: modules
          .filter((m) => validModuleIds.has(m.moduleId))
          .map((m) => ({
            moduleId: m.moduleId,
            config: JSON.stringify(m.config),
          })),
      },
    },
    include: {
      modules: { include: { module: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(template, { status: 201 });
}
