import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";

type Params = { params: Promise<{ slotId: string }> };

// POST /api/slots/[slotId]/invite — 주최자가 빈 슬롯 초대 링크 생성
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { slotId } = await params;

  const slot = await prisma.boothSlot.findUnique({
    where: { id: slotId },
    include: { event: true },
  });
  if (!slot) return NextResponse.json({ error: "슬롯을 찾을 수 없습니다." }, { status: 404 });
  if (slot.event.organizerId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  if (slot.boothId) {
    return NextResponse.json({ error: "이미 부스가 연결된 슬롯입니다." }, { status: 409 });
  }

  // 기존 유효한 초대가 있으면 재사용, 없으면 새로 생성
  const existing = await prisma.slotInvitation.findFirst({
    where: { slotId, status: "PENDING", expiresAt: { gt: new Date() } },
  });

  const invitation = existing ?? await prisma.slotInvitation.create({
    data: {
      slotId,
      email: "",
      token: nanoid(24),
      status: "PENDING",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return NextResponse.json({ inviteUrl: `${baseUrl}/invite/${invitation.token}` }, { status: 201 });
}
