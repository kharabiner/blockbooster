import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateShortCode } from "@/lib/utils/shortcode";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().optional(),
  location: z.string().optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  gridRows: z.number().int().min(5).max(30).default(10),
  gridCols: z.number().int().min(5).max(30).default(10),
  templateId: z.string().optional(),
});

// GET /api/events — 공개 이벤트 피드
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 12;

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where: { status: { in: ["PUBLISHED", "ONGOING"] } },
      orderBy: { startAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        organizer: { select: { id: true, name: true, image: true } },
        _count: { select: { slots: true } },
      },
    }),
    prisma.event.count({ where: { status: { in: ["PUBLISHED", "ONGOING"] } } }),
  ]);

  return NextResponse.json({ events, total, page, pages: Math.ceil(total / limit) });
}

// POST /api/events — 이벤트 생성
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  let shortCode = generateShortCode();
  while (await prisma.event.findUnique({ where: { shortCode } })) {
    shortCode = generateShortCode();
  }

  // 템플릿에서 그리드 크기 상속
  let gridRows = data.gridRows;
  let gridCols = data.gridCols;
  if (data.templateId) {
    const template = await prisma.template.findUnique({ where: { id: data.templateId } });
    if (template) {
      gridRows = template.gridRows;
      gridCols = template.gridCols;
    }
  }

  const event = await prisma.event.create({
    data: {
      shortCode,
      title: data.title,
      description: data.description,
      location: data.location,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      gridRows,
      gridCols,
      organizerId: session.user.id,
      templateId: data.templateId,
    },
    include: {
      organizer: { select: { id: true, name: true, image: true } },
      template: { select: { id: true, name: true, modules: { include: { module: true } } } },
    },
  });

  return NextResponse.json(event, { status: 201 });
}
