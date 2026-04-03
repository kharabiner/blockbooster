import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

type Params = { params: Promise<{ slotId: string; appId: string }> };

const actionSchema = z.object({
  action: z.enum(["ACCEPTED", "REJECTED"]),
});

// PATCH /api/slots/[slotId]/applications/[appId] — 주최자가 신청 수락/거절
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { slotId, appId } = await params;

  const application = await prisma.slotApplication.findUnique({
    where: { id: appId },
    include: { slot: { include: { event: true } } },
  });
  if (!application) return NextResponse.json({ error: "신청을 찾을 수 없습니다." }, { status: 404 });
  if (application.slot.event.organizerId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.slotApplication.update({
    where: { id: appId },
    data: { status: parsed.data.action },
  });

  // 수락 시 슬롯에 부스 연결 + 다른 신청 거절
  if (parsed.data.action === "ACCEPTED") {
    await prisma.boothSlot.update({
      where: { id: slotId },
      data: { boothId: application.boothId },
    });
    await prisma.slotApplication.updateMany({
      where: { slotId, id: { not: appId }, status: "PENDING" },
      data: { status: "REJECTED" },
    });
  }

  return NextResponse.json(updated);
}
