import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ shortCode: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { shortCode } = await params;

  const event = await prisma.event.findUnique({ where: { shortCode } });
  if (event) {
    return NextResponse.redirect(new URL(`/events/${event.id}`, _req.url));
  }

  const booth = await prisma.booth.findUnique({ where: { shortCode } });
  if (booth) {
    return NextResponse.redirect(new URL(`/booths/${booth.id}`, _req.url));
  }

  return NextResponse.redirect(new URL("/", _req.url));
}
