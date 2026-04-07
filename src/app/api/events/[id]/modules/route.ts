import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getModule, getAllModules } from "@/lib/modules/registry";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

async function getEventAndCheckOrganizer(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return null;
  if (event.organizerId !== userId) return null;
  return event;
}

// GET /api/events/[id]/modules — 이벤트 모듈 목록
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const modules = await prisma.eventModule.findMany({
    where: { eventId: id },
    include: { module: true },
  });
  return NextResponse.json(
    modules.map((m) => {
      // DB name 대신 레지스트리 한국어 이름을 우선 사용
      const def = getModule(m.moduleId);
      return {
        ...m,
        config: JSON.parse(m.config),
        module: {
          ...m.module,
          name: def?.name ?? m.module.name,
          description: def?.description ?? m.module.description,
        },
      };
    })
  );
}

const upsertSchema = z.object({
  moduleId: z.string(),
  config: z.record(z.string(), z.unknown()).default({}),
});

// POST /api/events/[id]/modules — 모듈 활성화 또는 설정 업데이트
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const event = await getEventAndCheckOrganizer(id, session.user.id);
  if (!event) return NextResponse.json({ error: "이벤트를 찾을 수 없거나 권한이 없습니다." }, { status: 403 });

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const moduleDef = getModule(parsed.data.moduleId);
  if (!moduleDef) return NextResponse.json({ error: "존재하지 않는 모듈입니다." }, { status: 404 });

  // FeatureModule DB 동기화
  await prisma.featureModule.upsert({
    where: { id: moduleDef.id },
    update: { name: moduleDef.name, description: moduleDef.description, configSchema: JSON.stringify(moduleDef.configSchema) },
    create: { id: moduleDef.id, name: moduleDef.name, description: moduleDef.description, configSchema: JSON.stringify(moduleDef.configSchema) },
  });

  const eventModule = await prisma.eventModule.upsert({
    where: { eventId_moduleId: { eventId: id, moduleId: parsed.data.moduleId } },
    update: { config: JSON.stringify(parsed.data.config) },
    create: { eventId: id, moduleId: parsed.data.moduleId, config: JSON.stringify(parsed.data.config) },
    include: { module: true },
  });

  return NextResponse.json({ ...eventModule, config: JSON.parse(eventModule.config) }, { status: 200 });
}

// DELETE /api/events/[id]/modules?moduleId=xxx — 모듈 비활성화
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const event = await getEventAndCheckOrganizer(id, session.user.id);
  if (!event) return NextResponse.json({ error: "이벤트를 찾을 수 없거나 권한이 없습니다." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get("moduleId");
  if (!moduleId) return NextResponse.json({ error: "moduleId가 필요합니다." }, { status: 400 });

  await prisma.eventModule.deleteMany({ where: { eventId: id, moduleId } });
  return NextResponse.json({ ok: true });
}
