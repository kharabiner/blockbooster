import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const slotSchema = z.object({
  posX: z.number().int().min(0),
  posY: z.number().int().min(0),
  width: z.number().int().min(1).max(8).default(2),
  height: z.number().int().min(1).max(8).default(2),
  color: z.string().default("#6366f1"),
  label: z.string().optional(),
});

const bulkSchema = z.object({
  slots: z.array(slotSchema),
});

// POST /api/events/[id]/slots — 슬롯 일괄 저장 (빌더에서 호출)
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "이벤트를 찾을 수 없습니다." }, { status: 404 });
  if (event.organizerId !== session.user.id) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const body = await req.json();
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // 연결된 부스가 없는 기존 슬롯 삭제 후 재생성
  await prisma.boothSlot.deleteMany({
    where: { eventId: id, boothId: null },
  });

  const created = await prisma.boothSlot.createMany({
    data: parsed.data.slots.map((s) => ({ ...s, eventId: id })),
  });

  const slots = await prisma.boothSlot.findMany({
    where: { eventId: id },
    include: { booth: { include: { owner: { select: { id: true, name: true, image: true } } } } },
    orderBy: [{ posY: "asc" }, { posX: "asc" }],
  });

  return NextResponse.json({ count: created.count, slots });
}
