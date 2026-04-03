import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      slots: {
        include: {
          booth: { select: { name: true, category: true } },
          visits: { orderBy: { createdAt: "asc" } },
          moduleData: true,
        },
      },
    },
  });

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.organizerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const totalVisits = event.slots.reduce((s, slot) => s + slot.visits.length, 0);

  const slotStats = event.slots
    .filter((s) => s.booth)
    .map((slot) => ({
      slotId: slot.id,
      boothName: slot.booth!.name,
      category: slot.booth!.category,
      visitCount: slot.visits.length,
      uniqueVisitors: new Set(slot.visits.filter((v) => v.visitorId).map((v) => v.visitorId)).size,
      label: slot.label,
      color: slot.color,
    }))
    .sort((a, b) => b.visitCount - a.visitCount);

  const hourlyVisits: number[] = Array(24).fill(0);
  event.slots.forEach((slot) => {
    slot.visits.forEach((v) => {
      hourlyVisits[new Date(v.createdAt).getHours()]++;
    });
  });

  // 별점 집계 — moduleData에서 직접 계산
  const ratingMap: Record<string, { name: string; total: number; count: number }> = {};
  event.slots.forEach((slot) => {
    slot.moduleData
      .filter((d) => d.moduleId === "visitor-rating")
      .forEach((d) => {
        const data = JSON.parse(d.data) as { stars?: number };
        const stars = data.stars ?? 0;
        if (!ratingMap[slot.id]) {
          ratingMap[slot.id] = { name: slot.booth?.name ?? "Unknown", total: 0, count: 0 };
        }
        ratingMap[slot.id].total += stars;
        ratingMap[slot.id].count++;
      });
  });

  const ratingStats = Object.values(ratingMap)
    .map((r) => ({
      boothName: r.name,
      avgRating: Math.round((r.total / r.count) * 10) / 10,
      count: r.count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating);

  // 채점 집계
  const scoringMap: Record<string, { name: string; totals: number[]; count: number }> = {};
  event.slots.forEach((slot) => {
    slot.moduleData
      .filter((d) => d.moduleId === "judge-scoring")
      .forEach((d) => {
        const data = JSON.parse(d.data) as { scores?: number[] };
        const scores = data.scores ?? [];
        const total = scores.reduce((a: number, b: number) => a + b, 0);
        if (!scoringMap[slot.id]) {
          scoringMap[slot.id] = { name: slot.booth?.name ?? "Unknown", totals: [], count: 0 };
        }
        scoringMap[slot.id].totals.push(total);
        scoringMap[slot.id].count++;
      });
  });

  const scoringStats = Object.values(scoringMap)
    .map((s) => ({
      boothName: s.name,
      avgTotal: s.totals.length
        ? Math.round((s.totals.reduce((a, b) => a + b, 0) / s.totals.length) * 10) / 10
        : 0,
      count: s.count,
    }))
    .sort((a, b) => b.avgTotal - a.avgTotal);

  const stampCount = event.slots.reduce(
    (s, slot) => s + slot.moduleData.filter((d) => d.moduleId === "stamp-rally").length,
    0
  );

  return NextResponse.json({
    eventTitle: event.title,
    totalSlots: event.slots.length,
    connectedSlots: event.slots.filter((s) => s.booth).length,
    totalVisits,
    uniqueVisitors: new Set(
      event.slots.flatMap((s) => s.visits.filter((v) => v.visitorId).map((v) => v.visitorId))
    ).size,
    slotStats,
    hourlyVisits,
    ratingStats,
    scoringStats,
    stampCount,
  });
}
