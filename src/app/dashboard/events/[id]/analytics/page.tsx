export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Store,
  Eye,
  Star,
  Stamp,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";

type Params = { params: Promise<{ id: string }> };

export default async function EventAnalyticsPage({ params }: Params) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event || event.organizerId !== session.user.id) notFound();

  // Fetch analytics from own API
  const res = await fetch(
    `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/events/${id}/analytics`,
    {
      headers: { Cookie: `next-auth.session-token=` },
      cache: "no-store",
    }
  );

  // Fallback: query directly on server
  const { prisma: db } = await import("@/lib/prisma");
  const slots = await db.boothSlot.findMany({
    where: { eventId: id },
    include: {
      booth: { select: { name: true, category: true } },
      visits: true,
      moduleData: true,
    },
  });

  const totalVisits = slots.reduce((s, slot) => s + slot.visits.length, 0);
  const connectedSlots = slots.filter((s) => s.booth).length;

  const uniqueVisitorIds = new Set(
    slots.flatMap((s) => s.visits.filter((v) => v.visitorId).map((v) => v.visitorId))
  );

  const slotStats = slots
    .filter((s) => s.booth)
    .map((slot) => ({
      slotId: slot.id,
      boothName: slot.booth!.name,
      category: slot.booth!.category,
      visitCount: slot.visits.length,
      color: slot.color,
    }))
    .sort((a, b) => b.visitCount - a.visitCount);

  // 시간대별 방문
  const hourlyVisits: number[] = Array(24).fill(0);
  slots.forEach((slot) =>
    slot.visits.forEach((v) => {
      hourlyVisits[new Date(v.createdAt).getHours()]++;
    })
  );

  // 별점 집계
  const ratingMap: Record<string, { name: string; total: number; count: number }> = {};
  slots.forEach((slot) => {
    slot.moduleData
      .filter((d) => d.moduleId === "visitor-rating")
      .forEach((d) => {
        const parsed = JSON.parse(d.data) as { stars?: number };
        const stars = parsed.stars ?? 0;
        if (!ratingMap[slot.id]) ratingMap[slot.id] = { name: slot.booth?.name ?? "", total: 0, count: 0 };
        ratingMap[slot.id].total += stars;
        ratingMap[slot.id].count++;
      });
  });
  const ratingStats = Object.values(ratingMap)
    .map((r) => ({ boothName: r.name, avgRating: Math.round((r.total / r.count) * 10) / 10, count: r.count }))
    .sort((a, b) => b.avgRating - a.avgRating);

  // 채점 집계
  const scoringMap: Record<string, { name: string; totals: number[]; count: number }> = {};
  slots.forEach((slot) => {
    slot.moduleData
      .filter((d) => d.moduleId === "judge-scoring")
      .forEach((d) => {
        const parsed = JSON.parse(d.data) as { scores?: number[] };
        const scores = parsed.scores ?? [];
        const total = scores.reduce((a: number, b: number) => a + b, 0);
        if (!scoringMap[slot.id]) scoringMap[slot.id] = { name: slot.booth?.name ?? "", totals: [], count: 0 };
        scoringMap[slot.id].totals.push(total);
        scoringMap[slot.id].count++;
      });
  });
  const scoringStats = Object.values(scoringMap)
    .map((s) => ({
      boothName: s.name,
      avgTotal: s.totals.length ? Math.round((s.totals.reduce((a, b) => a + b, 0) / s.totals.length) * 10) / 10 : 0,
      count: s.count,
    }))
    .sort((a, b) => b.avgTotal - a.avgTotal);

  const stampCount = slots.reduce(
    (s, slot) => s + slot.moduleData.filter((d) => d.moduleId === "stamp-rally").length,
    0
  );

  const analyticsData = {
    totalVisits,
    connectedSlots,
    totalSlots: slots.length,
    uniqueVisitors: uniqueVisitorIds.size,
    slotStats,
    hourlyVisits,
    ratingStats,
    scoringStats,
    stampCount,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href={`/dashboard/events/${id}`}
        className={cn(buttonVariants({ variant: "ghost" }), "mb-6 -ml-2 inline-flex")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        이벤트 관리
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">방문자 통계 대시보드</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Eye className="h-5 w-5 text-blue-500" />} label="총 방문" value={analyticsData.totalVisits} />
        <StatCard icon={<Users className="h-5 w-5 text-green-500" />} label="순 방문자" value={analyticsData.uniqueVisitors} />
        <StatCard icon={<Store className="h-5 w-5 text-indigo-500" />} label="운영 부스" value={`${analyticsData.connectedSlots}/${analyticsData.totalSlots}`} />
        <StatCard icon={<Stamp className="h-5 w-5 text-amber-500" />} label="스탬프 수집" value={analyticsData.stampCount} />
      </div>

      {/* 부스별 방문 순위 */}
      {analyticsData.slotStats.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              부스별 방문 순위
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.slotStats.slice(0, 10).map((s, idx) => (
                <div key={s.slotId} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-5">{idx + 1}</span>
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.boothName}</p>
                    {s.category && <p className="text-xs text-muted-foreground">{s.category}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div
                      className="h-2 rounded-full bg-indigo-200"
                      style={{
                        width: Math.max(8, (s.visitCount / (analyticsData.slotStats[0]?.visitCount || 1)) * 80),
                      }}
                    >
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-8 text-right">{s.visitCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 시간대별 방문 차트 */}
      <AnalyticsCharts
        hourlyVisits={analyticsData.hourlyVisits}
        ratingStats={analyticsData.ratingStats}
        scoringStats={analyticsData.scoringStats}
      />

      {/* 별점 순위 */}
      {analyticsData.ratingStats.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              별점 순위
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData.ratingStats.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground w-5">{idx + 1}</span>
                    <span className="text-sm">{r.boothName}</span>
                    <Badge variant="secondary" className="text-xs">{r.count}명</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {r.avgRating}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 심사위원 채점 순위 */}
      {analyticsData.scoringStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              채점 순위
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData.scoringStats.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground w-5">{idx + 1}</span>
                    <span className="text-sm">{s.boothName}</span>
                    <Badge variant="secondary" className="text-xs">{s.count}명</Badge>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600">{s.avgTotal}점</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {analyticsData.totalVisits === 0 && analyticsData.slotStats.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Eye className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>아직 방문 데이터가 없습니다.</p>
          <p className="text-sm mt-1">이벤트가 시작되면 통계가 표시됩니다.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
