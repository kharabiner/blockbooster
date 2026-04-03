import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

// GET /api/events/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true, image: true } },
      template: {
        include: {
          modules: { include: { module: true } },
        },
      },
      slots: {
        include: {
          booth: {
            include: { owner: { select: { id: true, name: true, image: true } } },
          },
        },
        orderBy: [{ posY: "asc" }, { posX: "asc" }],
      },
      announcements: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { slots: true } },
    },
  });

  if (!event) return NextResponse.json({ error: "이벤트를 찾을 수 없습니다." }, { status: 404 });

  return NextResponse.json(event);
}

const updateSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ONGOING", "ENDED"]).optional(),
  thumbnail: z.string().url().optional(),
});

// PATCH /api/events/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "이벤트를 찾을 수 없습니다." }, { status: 404 });
  if (event.organizerId !== session.user.id) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...data,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: data.endAt ? new Date(data.endAt) : undefined,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/events/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "이벤트를 찾을 수 없습니다." }, { status: 404 });
  if (event.organizerId !== session.user.id) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
