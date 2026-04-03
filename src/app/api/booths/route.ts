import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateShortCode } from "@/lib/utils/shortcode";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().optional(),
});

// GET /api/booths — 내 부스 목록
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const booths = await prisma.booth.findMany({
    where: { ownerId: session.user.id },
    include: {
      slots: {
        include: {
          event: { select: { id: true, title: true, shortCode: true, startAt: true } },
        },
      },
      _count: { select: { slots: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(booths);
}

// POST /api/booths — 부스 생성
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  let shortCode = generateShortCode();
  while (await prisma.booth.findUnique({ where: { shortCode } })) {
    shortCode = generateShortCode();
  }

  const booth = await prisma.booth.create({
    data: {
      ...parsed.data,
      shortCode,
      ownerId: session.user.id,
    },
  });

  return NextResponse.json(booth, { status: 201 });
}
