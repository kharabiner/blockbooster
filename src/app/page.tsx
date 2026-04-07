export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { CalendarDays, MapPin, Store, Plus, LayoutTemplate, Zap, Target, Layers, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: "준비중",  color: "bg-zinc-100  text-zinc-600  border-zinc-400" },
  PUBLISHED: { label: "모집중",  color: "bg-blue-100  text-blue-800  border-blue-400" },
  ONGOING:   { label: "진행중",  color: "bg-green-100 text-green-800 border-green-500" },
  ENDED:     { label: "종료",    color: "bg-zinc-100  text-zinc-400  border-zinc-300" },
};

// 5색 블록 팔레트 — Yellow / Red / Green / Blue / Purple / Orange
const CARD_COLORS = [
  "from-amber-300   to-yellow-400",
  "from-red-400     to-rose-500",
  "from-emerald-400 to-green-500",
  "from-blue-400    to-sky-500",
  "from-violet-400  to-purple-500",
  "from-orange-400  to-amber-500",
];

export default async function HomePage() {
  const events = await prisma.event.findMany({
    where: { status: { in: ["ONGOING", "PUBLISHED"] } },
    orderBy: { startAt: "desc" },
    take: 12,
    include: {
      organizer: { select: { name: true } },
      template: { select: { name: true } },
      slots: { select: { id: true, boothId: true } },
    },
  });

  const draftEvents = events.length === 0
    ? await prisma.event.findMany({ take: 6, orderBy: { createdAt: "desc" }, include: { organizer: { select: { name: true } }, template: { select: { name: true } }, slots: { select: { id: true, boothId: true } } } })
    : [];

  const displayEvents = events.length > 0 ? events : draftEvents;

  return (
    <div className="min-h-screen">
      {/* 히어로 */}
      <section className="relative border-b-2 border-foreground overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-amber-50" />
        <div className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.12) 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative container mx-auto px-4 py-16 sm:py-24 text-center">
          {/* 블록 장식 — 크기 다른 레고 블록들 */}
          <div className="flex justify-center items-end gap-1.5 mb-8">
            {[
              { color: "#7C3AED", w: 40, h: 32,  shadow: "#4c1d95" },
              { color: "#F59E0B", w: 32, h: 48,  shadow: "#92400e" },
              { color: "#EF4444", w: 40, h: 40,  shadow: "#7f1d1d" },
              { color: "#22C55E", w: 40, h: 48,  shadow: "#064e3b" },
              { color: "#3B82F6", w: 48, h: 64,  shadow: "#1e3a8a" },
              { color: "#F97316", w: 40, h: 40,  shadow: "#7c2d12" },
            ].map(({ color, w, h, shadow }, i) => (
              <div
                key={i}
                className="border-2 border-black/15 rounded-md flex-shrink-0"
                style={{ backgroundColor: color, width: w, height: h, boxShadow: `3px 3px 0px ${shadow}` }}
              />
            ))}
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-foreground mb-4 leading-tight">
            이벤트를<br />
            <span className="text-violet-600">블록처럼</span> 만들어요
          </h1>
          <p className="text-base text-foreground/60 mb-8 max-w-md mx-auto font-semibold">
            부스 이벤트를 레고처럼 조립하세요.<br />
            캡스톤 전시·졸업작품 전시에 맞는 템플릿부터, 점수·정보·스탬프·채팅을 원하는 대로.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/events/new" className={cn(buttonVariants({ size: "lg" }), "text-base font-black")}>
              <Plus className="h-5 w-5" />
              이벤트 만들기
            </Link>
            <Link href="/templates" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "text-base font-black")}>
              <LayoutTemplate className="h-5 w-5" />
              템플릿 구경하기
            </Link>
          </div>
        </div>
      </section>

      {/* 기능 소개 블록 */}
      <section className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Target className="h-5 w-5 text-amber-600" />,   color: "bg-amber-50  border-amber-300",   title: "템플릿으로 시작", desc: "캡스톤, 플리마켓, 박람회 — 원하는 형식을 골라 바로 시작" },
            { icon: <Layers className="h-5 w-5 text-violet-600" />,  color: "bg-violet-50 border-violet-300",  title: "기능 모듈 조합", desc: "점수 입력, 정보 보드, 스탬프, 반응, 채팅 — 필요한 것만 블록처럼" },
            { icon: <BarChart2 className="h-5 w-5 text-emerald-600" />, color: "bg-emerald-50 border-emerald-300", title: "실시간 통계", desc: "방문자 현황, 점수 순위, 스탬프 수집을 한눈에" },
          ].map((item) => (
            <div key={item.title} className={`flex items-start gap-3 p-4 rounded-xl border-2 ${item.color} shadow-[3px_3px_0px_rgba(0,0,0,0.6)]`}>
              <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
              <div>
                <p className="font-black text-sm">{item.title}</p>
                <p className="text-xs text-foreground/70 mt-0.5 font-semibold">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 이벤트 피드 */}
      <section className="container mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            {events.length > 0 ? "지금 열린 이벤트" : "최근 이벤트"}
          </h2>
          <Link href="/dashboard/events/new" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <Plus className="h-4 w-4" />
            만들기
          </Link>
        </div>

        {displayEvents.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-foreground/30 rounded-2xl bg-muted/30">
            <div className="flex justify-center gap-1 mb-4">
              {["bg-violet-400","bg-amber-400","bg-red-400"].map((c,i) => (
                <div key={i} className={`w-6 h-6 ${c} rounded border border-black/20`} style={{boxShadow:"2px 2px 0 rgba(0,0,0,0.3)"}} />
              ))}
            </div>
            <p className="font-black text-lg mb-2">아직 이벤트가 없어요</p>
            <p className="text-sm text-muted-foreground font-semibold mb-6">첫 번째 이벤트를 만들어보세요!</p>
            <Link href="/dashboard/events/new" className={cn(buttonVariants())}>
              이벤트 만들기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayEvents.map((event, idx) => {
              const st = STATUS_LABEL[event.status] ?? STATUS_LABEL.DRAFT;
              const connected = event.slots.filter((s) => s.boothId).length;
              const gradColor = CARD_COLORS[idx % CARD_COLORS.length];
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group block rounded-xl overflow-hidden border-2 border-foreground bg-card shadow-[4px_4px_0px_rgba(0,0,0,0.85)] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.85)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all"
                >
                  {/* 컬러 헤더 */}
                  <div className={`h-24 bg-gradient-to-br ${gradColor} relative flex items-end p-3`}>
                    <span className={cn("text-xs font-black px-2 py-0.5 rounded-full border-2", st.color)}>
                      {st.label}
                    </span>
                    {event.template && (
                      <span className="ml-2 text-xs font-bold bg-black/20 text-white rounded-full px-2 py-0.5">
                        {event.template.name}
                      </span>
                    )}
                  </div>

                  {/* 본문 */}
                  <div className="p-4">
                    <h3 className="font-black text-base leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <div className="space-y-1 text-xs text-muted-foreground font-semibold">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
                        {new Date(event.startAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
                        {" ~ "}
                        {new Date(event.endAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
                      </div>
                      {(event as { location?: string }).location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          {(event as { location?: string }).location}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 flex-shrink-0" />
                        부스 {connected}/{event.slots.length}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 font-semibold">
                      by {event.organizer.name}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
