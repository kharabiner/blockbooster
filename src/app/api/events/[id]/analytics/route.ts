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

  // 점수 입력 집계 (score-input, 구 visitor-rating / judge-scoring 호환)
  const scoreMap: Record<string, { name: string; totals: number[]; count: number }> = {};
  const scoreModuleIds = new Set(["score-input", "visitor-rating", "judge-scoring"]);
  event.slots.forEach((slot) => {
    slot.moduleData
      .filter((d) => scoreModuleIds.has(d.moduleId))
      .forEach((d) => {
        const raw = JSON.parse(d.data) as { score?: number; stars?: number; scores?: number[] };
        let val = 0;
        if (typeof raw.score === "number") val = raw.score;
        else if (typeof raw.stars === "number") val = raw.stars;
        else if (Array.isArray(raw.scores)) val = raw.scores.reduce((a, b) => a + b, 0);
        if (!scoreMap[slot.id]) {
          scoreMap[slot.id] = { name: slot.booth?.name ?? "Unknown", totals: [], count: 0 };
        }
        scoreMap[slot.id].totals.push(val);
        scoreMap[slot.id].count++;
      });
  });

  const scoreStats = Object.values(scoreMap)
    .map((s) => ({
      boothName: s.name,
      avgScore: s.totals.length
        ? Math.round((s.totals.reduce((a, b) => a + b, 0) / s.totals.length) * 10) / 10
        : 0,
      count: s.count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);

  const stampCount = event.slots.reduce(
    (s, slot) =>
      s +
      slot.moduleData.filter((d) => d.moduleId === "stamp" || d.moduleId === "stamp-rally").length,
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
    scoreStats,
    stampCount,
  });
}
