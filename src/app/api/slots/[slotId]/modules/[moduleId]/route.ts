import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getModule } from "@/lib/modules/registry";

type Params = { params: Promise<{ slotId: string; moduleId: string }> };

// GET /api/slots/[slotId]/modules/[moduleId] — 모듈 데이터 조회
export async function GET(req: NextRequest, { params }: Params) {
  const { slotId, moduleId } = await params;
  const session = await auth();

  // 모듈 정의 확인
  const moduleDef = getModule(moduleId);
  if (!moduleDef) return NextResponse.json({ error: "존재하지 않는 모듈입니다." }, { status: 404 });

  // 슬롯 확인
  const slot = await prisma.boothSlot.findUnique({ where: { id: slotId } });
  if (!slot) return NextResponse.json({ error: "슬롯을 찾을 수 없습니다." }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const aggregate = searchParams.get("aggregate") === "true";

  if (aggregate) {
    // 집계 데이터 (전체 유저 데이터 합산)
    const allData = await prisma.moduleData.findMany({
      where: { boothSlotId: slotId, moduleId },
    });
    return NextResponse.json({ items: allData.map((d) => ({ ...d, data: JSON.parse(d.data) })), count: allData.length });
  }

  // 내 데이터만
  const userId = session?.user?.id ?? null;
  const myData = userId
    ? await prisma.moduleData.findUnique({
        where: { boothSlotId_moduleId_userId: { boothSlotId: slotId, moduleId, userId } },
      })
    : null;

  return NextResponse.json(myData ? { ...myData, data: JSON.parse(myData.data) } : null);
}

// POST /api/slots/[slotId]/modules/[moduleId] — 모듈 데이터 저장
export async function POST(req: NextRequest, { params }: Params) {
  const { slotId, moduleId } = await params;
  const session = await auth();

  const moduleDef = getModule(moduleId);
  if (!moduleDef) return NextResponse.json({ error: "존재하지 않는 모듈입니다." }, { status: 404 });

  const slot = await prisma.boothSlot.findUnique({ where: { id: slotId } });
  if (!slot) return NextResponse.json({ error: "슬롯을 찾을 수 없습니다." }, { status: 404 });

  // allowedEmails 접근제어: EventModule config에 이메일 목록이 있으면 서버에서 강제
  const eventModule = await prisma.eventModule.findFirst({
    where: { eventId: slot.eventId, moduleId },
  });
  if (eventModule) {
    const cfg = JSON.parse(eventModule.config) as Record<string, unknown>;
    const allowedEmails = (cfg.allowedEmails as string[] | undefined) ?? [];
    if (allowedEmails.length > 0) {
      if (!session?.user?.email || !allowedEmails.includes(session.user.email)) {
        return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
      }
    }
  }

  const body = await req.json();
  const userId = session?.user?.id ?? null;

  const data = await prisma.moduleData.upsert({
    where: {
      boothSlotId_moduleId_userId: {
        boothSlotId: slotId,
        moduleId,
        userId: userId ?? "",
      },
    },
    update: { data: JSON.stringify(body), userId },
    create: {
      boothSlotId: slotId,
      moduleId,
      userId,
      data: JSON.stringify(body),
    },
  });

  return NextResponse.json({ ...data, data: JSON.parse(data.data) });
}
