import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const postSchema = z.object({
  content: z.string().min(1).max(500),
  guestName: z.string().max(20).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await params;
  const { searchParams } = new URL(req.url);
  const after = searchParams.get("after");

  const messages = await prisma.chatMessage.findMany({
    where: {
      slotId,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    include: {
      author: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await params;
  const session = await auth();

  const body = postSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid content" }, { status: 400 });
  }

  // 익명 허용 여부는 모듈 config에서 체크 (여기선 모두 허용)
  const { content, guestName } = body.data;

  const slot = await prisma.boothSlot.findUnique({ where: { id: slotId } });
  if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });

  const message = await prisma.chatMessage.create({
    data: {
      slotId,
      content,
      authorId: session?.user?.id ?? null,
      authorName: session?.user?.name ?? guestName ?? "익명",
    },
    include: {
      author: { select: { name: true, image: true } },
    },
  });

  return NextResponse.json(message, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slotId } = await params;
  const { messageId } = await req.json();

  const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });
  if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 본인 메시지 또는 이벤트 주최자만 삭제 가능
  const slot = await prisma.boothSlot.findUnique({
    where: { id: slotId },
    include: { event: { select: { organizerId: true } } },
  });

  const canDelete =
    message.authorId === session.user.id ||
    slot?.event?.organizerId === session.user.id;

  if (!canDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.chatMessage.delete({ where: { id: messageId } });
  return NextResponse.json({ ok: true });
}
