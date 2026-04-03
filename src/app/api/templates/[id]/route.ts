import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      modules: { include: { module: true } },
      _count: { select: { events: true } },
    },
  });
  if (!template) return NextResponse.json({ error: "템플릿을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(template);
}

// POST /api/templates/[id]/clone — 템플릿 복제 후 이벤트 생성 시작
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const template = await prisma.template.findUnique({
    where: { id },
    include: { modules: true },
  });
  if (!template) return NextResponse.json({ error: "템플릿을 찾을 수 없습니다." }, { status: 404 });

  // 내 것이거나 공개된 경우만 복제 가능
  if (!template.isPublic && template.ownerId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const cloned = await prisma.template.create({
    data: {
      name: `${template.name} (복사본)`,
      description: template.description,
      isPublic: false,
      gridRows: template.gridRows,
      gridCols: template.gridCols,
      slotLayout: template.slotLayout,
      ownerId: session.user.id,
      modules: {
        create: template.modules.map((m) => ({
          moduleId: m.moduleId,
          config: m.config,
        })),
      },
    },
  });

  return NextResponse.json(cloned, { status: 201 });
}
