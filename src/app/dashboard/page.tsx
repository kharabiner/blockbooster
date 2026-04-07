export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarDays, MapPin, Store, Settings, LayoutGrid,
  Plus, Clock, CheckCircle2, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SearchParams = { params: Promise<Record<string, string>>; searchParams: Promise<{ tab?: string }> };

const EVENT_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT:     { label: "준비중", variant: "secondary" },
  PUBLISHED: { label: "모집중", variant: "default" },
  ONGOING:   { label: "진행중", variant: "default" },
  ENDED:     { label: "종료",   variant: "outline" },
};

const APP_STATUS = {
  PENDING:  { label: "심사중", Icon: Clock,         cls: "text-amber-600 bg-amber-50 border-amber-200" },
  ACCEPTED: { label: "승인됨", Icon: CheckCircle2,  cls: "text-green-600 bg-green-50 border-green-200" },
  REJECTED: { label: "거절됨", Icon: XCircle,       cls: "text-red-500  bg-red-50   border-red-200"   },
};

export default async function DashboardPage({ searchParams }: SearchParams) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { tab } = await searchParams;
  const activeTab = tab === "booths" ? "booths" : "events";

  const [events, booths] = await Promise.all([
    prisma.event.findMany({
      where: { organizerId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { slots: true } },
        template: { select: { name: true } },
      },
    }),
    prisma.booth.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        slots: {
          include: {
            event: { select: { id: true, title: true, startAt: true, status: true } },
          },
        },
        applications: {
          orderBy: { createdAt: "desc" },
          include: {
            slot: {
              include: {
                event: { select: { id: true, title: true, status: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black">대시보드</h1>
        {activeTab === "events" ? (
          <Link href="/dashboard/events/new" className={cn(buttonVariants())}>
            <Plus className="h-4 w-4 mr-1" /> 새 이벤트
          </Link>
        ) : (
          <Link href="/my-booths/new" className={cn(buttonVariants())}>
            <Plus className="h-4 w-4 mr-1" /> 새 부스
          </Link>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 border-b-2 border-foreground/10">
        <Link
          href="/dashboard"
          className={cn(
            "px-4 py-2 text-sm font-black rounded-t-lg transition-colors",
            activeTab === "events"
              ? "bg-foreground text-background"
              : "text-foreground/50 hover:text-foreground"
          )}
        >
          내 이벤트 {events.length > 0 && <span className="ml-1 text-xs opacity-70">({events.length})</span>}
        </Link>
        <Link
          href="/dashboard?tab=booths"
          className={cn(
            "px-4 py-2 text-sm font-black rounded-t-lg transition-colors",
            activeTab === "booths"
              ? "bg-foreground text-background"
              : "text-foreground/50 hover:text-foreground"
          )}
        >
          내 부스 {booths.length > 0 && <span className="ml-1 text-xs opacity-70">({booths.length})</span>}
        </Link>
      </div>

      {/* ── 내 이벤트 탭 ── */}
      {activeTab === "events" && (
        events.length === 0 ? (
          <div className="text-center py-20 border rounded-lg bg-muted/30 text-muted-foreground">
            <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">이벤트가 없습니다</p>
            <p className="text-sm mt-1">첫 이벤트를 만들어보세요!</p>
            <Link href="/dashboard/events/new" className={cn(buttonVariants(), "mt-6 inline-flex")}>
              이벤트 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const s = EVENT_STATUS[event.status] ?? EVENT_STATUS.DRAFT;
              return (
                <Card key={event.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                        {event.template && (
                          <span className="text-xs text-muted-foreground">{event.template.name}</span>
                        )}
                      </div>
                      <h3 className="font-semibold truncate">{event.title}</h3>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {new Date(event.startAt).toLocaleDateString("ko-KR")}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Store className="h-3 w-3" />
                          {event._count.slots}개 슬롯
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/events/${event.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                        보기
                      </Link>
                      <Link href={`/dashboard/events/${event.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                        <Settings className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* ── 내 부스 탭 ── */}
      {activeTab === "booths" && (
        booths.length === 0 ? (
          <div className="text-center py-20 border rounded-lg bg-muted/30 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">부스가 없습니다</p>
            <p className="text-sm mt-1">첫 부스를 만들어보세요!</p>
            <Link href="/my-booths/new" className={cn(buttonVariants(), "mt-6 inline-flex")}>
              부스 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {booths.map((booth) => {
              const pendingApps    = booth.applications.filter((a) => a.status === "PENDING");
              const acceptedApps   = booth.applications.filter((a) => a.status === "ACCEPTED");
              const rejectedApps   = booth.applications.filter((a) => a.status === "REJECTED");
              const connectedSlots = booth.slots;

              return (
                <Card key={booth.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <Store className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold">{booth.name}</h3>
                          {booth.category && (
                            <Badge variant="secondary" className="text-xs">{booth.category}</Badge>
                          )}
                        </div>
                        {booth.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{booth.description}</p>
                        )}
                      </div>
                      <Link
                        href={`/my-booths/${booth.id}/edit`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-shrink-0")}
                      >
                        편집
                      </Link>
                    </div>

                    {connectedSlots.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">운영 중인 이벤트</p>
                        <div className="flex flex-wrap gap-2">
                          {connectedSlots.map((slot) => (
                            <Link
                              key={slot.id}
                              href={`/events/${slot.event.id}`}
                              className="inline-flex items-center gap-1 text-xs border rounded-full px-2.5 py-1 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                            >
                              <CalendarDays className="h-3 w-3" />
                              {slot.event.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {booth.applications.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">슬롯 신청 현황</p>
                        <div className="space-y-1.5">
                          {[...pendingApps, ...acceptedApps, ...rejectedApps].map((app) => {
                            const st = APP_STATUS[app.status as keyof typeof APP_STATUS] ?? APP_STATUS.PENDING;
                            const Icon = st.Icon;
                            return (
                              <div
                                key={app.id}
                                className={cn("flex items-center gap-2 text-xs border rounded-lg px-3 py-2", st.cls)}
                              >
                                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="flex-1 truncate font-medium">{app.slot.event.title}</span>
                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border-current", st.cls)}>
                                  {st.label}
                                </Badge>
                                {app.status === "PENDING" && (
                                  <Link href={`/events/${app.slot.event.id}`} className="ml-1 underline opacity-70 hover:opacity-100">
                                    이벤트 보기
                                  </Link>
                                )}
                                {app.status === "ACCEPTED" && (
                                  <Link href={`/events/${app.slot.event.id}/booths/${app.slotId}`} className="ml-1 underline opacity-70 hover:opacity-100">
                                    부스 보기
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {connectedSlots.length === 0 && booth.applications.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        아직 신청한 이벤트가 없습니다.{" "}
                        <Link href="/" className="underline">이벤트 피드</Link>에서 신청해보세요.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
