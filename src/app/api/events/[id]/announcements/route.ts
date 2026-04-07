import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

// GET /api/events/[id]/announcements
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const announcements = await prisma.announcement.findMany({
    where: { eventId: id },
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(announcements);
}

const postSchema = z.object({ content: z.string().min(1).max(2000) });

// POST /api/events/[id]/announcements — 주최자만 작성
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "이벤트를 찾을 수 없습니다." }, { status: 404 });
  if (event.organizerId !== session.user.id) {
    return NextResponse.json({ error: "주최자만 공지를 작성할 수 있습니다." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const announcement = await prisma.announcement.create({
    data: { content: parsed.data.content, eventId: id, authorId: session.user.id },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(announcement, { status: 201 });
}

// DELETE /api/events/[id]/announcements?announcementId=xxx
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.organizerId !== session.user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const announcementId = searchParams.get("announcementId");
  if (!announcementId) return NextResponse.json({ error: "announcementId가 필요합니다." }, { status: 400 });

  await prisma.announcement.deleteMany({ where: { id: announcementId, eventId: id } });
  return NextResponse.json({ ok: true });
}
