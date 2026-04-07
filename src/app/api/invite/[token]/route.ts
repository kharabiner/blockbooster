import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";
import { z } from "zod";

type Params = { params: Promise<{ token: string }> };

// GET /api/invite/[token] — 토큰 유효성 검사 + 슬롯/이벤트 정보 반환
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;

  const invitation = await prisma.slotInvitation.findUnique({
    where: { token },
    include: {
      slot: {
        include: {
          event: {
            include: { organizer: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "유효하지 않은 초대 링크입니다." }, { status: 404 });
  }
  if (invitation.status === "ACCEPTED") {
    return NextResponse.json({ error: "이미 수락된 초대입니다." }, { status: 409 });
  }
  if (new Date() > invitation.expiresAt) {
    await prisma.slotInvitation.update({ where: { token }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "만료된 초대 링크입니다." }, { status: 410 });
  }
  if (invitation.slot.boothId) {
    return NextResponse.json({ error: "이미 다른 부스가 연결된 슬롯입니다." }, { status: 409 });
  }

  return NextResponse.json({
    slotId: invitation.slot.id,
    slotLabel: invitation.slot.label,
    slotColor: invitation.slot.color,
    eventId: invitation.slot.event.id,
    eventTitle: invitation.slot.event.title,
    eventLocation: invitation.slot.event.location,
    eventStartAt: invitation.slot.event.startAt,
    organizerName: invitation.slot.event.organizer.name,
  });
}

const acceptSchema = z.object({
  boothName: z.string().min(1).optional(),
  boothId: z.string().optional(),
}).refine((d) => d.boothName || d.boothId, {
  message: "boothName 또는 boothId 중 하나는 필요합니다.",
});

// POST /api/invite/[token]/accept → /api/invite/[token] POST
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { token } = await params;

  const invitation = await prisma.slotInvitation.findUnique({
    where: { token },
    include: { slot: { include: { event: true } } },
  });

  if (!invitation) {
    return NextResponse.json({ error: "유효하지 않은 초대 링크입니다." }, { status: 404 });
  }
  if (invitation.status === "ACCEPTED") {
    return NextResponse.json({ error: "이미 수락된 초대입니다." }, { status: 409 });
  }
  if (new Date() > invitation.expiresAt) {
    await prisma.slotInvitation.update({ where: { token }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "만료된 초대 링크입니다." }, { status: 410 });
  }
  if (invitation.slot.boothId) {
    return NextResponse.json({ error: "이미 다른 부스가 연결된 슬롯입니다." }, { status: 409 });
  }

  const body = await req.json();
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let boothId: string;

  if (parsed.data.boothId) {
    // 기존 부스 사용 — 소유권 확인
    const booth = await prisma.booth.findUnique({ where: { id: parsed.data.boothId } });
    if (!booth || booth.ownerId !== session.user.id) {
      return NextResponse.json({ error: "부스를 찾을 수 없거나 권한이 없습니다." }, { status: 403 });
    }
    boothId = booth.id;
  } else {
    // 새 부스 생성
    const newBooth = await prisma.booth.create({
      data: {
        name: parsed.data.boothName!,
        shortCode: nanoid(8),
        ownerId: session.user.id,
      },
    });
    boothId = newBooth.id;
  }

  const slotId = invitation.slotId;

  // 슬롯 연결 + 기존 pending 신청 거절 + 초대 수락 처리 (트랜잭션)
  await prisma.$transaction([
    prisma.boothSlot.update({
      where: { id: slotId },
      data: { boothId },
    }),
    prisma.slotApplication.create({
      data: {
        slotId,
        boothId,
        applicantId: session.user.id,
        message: "초대를 통해 자동 수락되었습니다.",
        status: "ACCEPTED",
      },
    }),
    prisma.slotApplication.updateMany({
      where: { slotId, status: "PENDING" },
      data: { status: "REJECTED" },
    }),
    prisma.slotInvitation.update({
      where: { token },
      data: { status: "ACCEPTED" },
    }),
  ]);

  return NextResponse.json({
    eventId: invitation.slot.event.id,
    boothId,
  });
}
