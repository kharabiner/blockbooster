import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const postSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const announcements = await prisma.announcement.findMany({
    where: { eventId: id },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
    take: 20,
  });
  return NextResponse.json(announcements);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.organizerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = postSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      eventId: id,
      authorId: session.user.id,
      content: body.data.content,
    },
    include: { author: { select: { name: true } } },
  });

  return NextResponse.json(announcement, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { announcementId } = await req.json();

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.organizerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.announcement.delete({ where: { id: announcementId } });
  return NextResponse.json({ ok: true });
}
