import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

type Params = { params: Promise<{ slotId: string }> };

const applySchema = z.object({
  boothId: z.string(),
  message: z.string().optional(),
});

// POST /api/slots/[slotId]/apply — 부스 운영자가 슬롯에 신청
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { slotId } = await params;
  const slot = await prisma.boothSlot.findUnique({
    where: { id: slotId },
    include: { event: true },
  });
  if (!slot) return NextResponse.json({ error: "슬롯을 찾을 수 없습니다." }, { status: 404 });
  if (slot.boothId) return NextResponse.json({ error: "이미 연결된 슬롯입니다." }, { status: 409 });

  const body = await req.json();
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const booth = await prisma.booth.findUnique({ where: { id: parsed.data.boothId } });
  if (!booth) return NextResponse.json({ error: "부스를 찾을 수 없습니다." }, { status: 404 });
  if (booth.ownerId !== session.user.id) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const existing = await prisma.slotApplication.findFirst({
    where: { slotId, boothId: parsed.data.boothId, status: "PENDING" },
  });
  if (existing) return NextResponse.json({ error: "이미 신청한 슬롯입니다." }, { status: 409 });

  const application = await prisma.slotApplication.create({
    data: {
      slotId,
      boothId: parsed.data.boothId,
      applicantId: session.user.id,
      message: parsed.data.message,
    },
  });

  return NextResponse.json(application, { status: 201 });
}
