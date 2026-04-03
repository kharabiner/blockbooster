import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowLeft, Settings, ExternalLink, QrCode, BarChart2, Store, Clock, CheckCircle2, XCircle } from "lucide-react";
import { EventStatusControl } from "@/components/events/EventStatusControl";
import { SlotApplicationsList } from "@/components/events/SlotApplicationsList";

type Params = { params: Promise<{ id: string }> };

const APP_STATUS = {
  PENDING:  { label: "검토 중",  Icon: Clock,         cls: "text-amber-700 bg-amber-50 border-amber-300" },
  ACCEPTED: { label: "승인됨",   Icon: CheckCircle2,  cls: "text-green-700 bg-green-50 border-green-300" },
  REJECTED: { label: "거절됨",   Icon: XCircle,       cls: "text-red-600   bg-red-50   border-red-300" },
};

export default async function EventManagePage({ params }: Params) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      template: { select: { name: true } },
      slots: {
        include: {
          booth: { include: { owner: { select: { name: true } } } },
          applications: {
            include: {
              booth: { include: { owner: { select: { name: true } } } },
              applicant: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: [{ posY: "asc" }, { posX: "asc" }],
      },
    },
  });

  if (!event) notFound();
  if (event.organizerId !== session.user.id) redirect("/dashboard");

  // 모든 신청 (슬롯 정보 포함)
  const allApps = event.slots.flatMap((slot) =>
    slot.applications.map((app) => ({ ...app, slot }))
  );
  const pendingApps  = allApps.filter((a) => a.status === "PENDING");
  const acceptedApps = allApps.filter((a) => a.status === "ACCEPTED");
  const rejectedApps = allApps.filter((a) => a.status === "REJECTED");

  const hasAnyApps = allApps.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 -ml-2 inline-flex")}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        대시보드
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-black">{event.title}</h1>
          {event.template && (
            <p className="text-sm text-muted-foreground font-semibold mt-1">{event.template.name} 템플릿</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/events/${event.id}`} target="_blank" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <ExternalLink className="h-4 w-4" />보기
          </Link>
          <Link href={`/dashboard/events/${event.id}/builder`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <Settings className="h-4 w-4" />빌더
          </Link>
          <Link href={`/dashboard/events/${event.id}/qr`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <QrCode className="h-4 w-4" />QR
          </Link>
          <Link href={`/dashboard/events/${event.id}/analytics`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <BarChart2 className="h-4 w-4" />통계
          </Link>
        </div>
      </div>

      {/* 상태 변경 */}
      <Card className="mb-5">
        <CardHeader><CardTitle className="text-sm font-black">이벤트 상태</CardTitle></CardHeader>
        <CardContent>
          <EventStatusControl eventId={event.id} currentStatus={event.status} />
        </CardContent>
      </Card>

      {/* 슬롯 현황 */}
      <Card className="mb-5">
        <CardHeader><CardTitle className="text-sm font-black">슬롯 현황</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-muted/60 border-2 border-foreground/20">
              <p className="text-2xl font-black">{event.slots.length}</p>
              <p className="text-xs text-muted-foreground font-semibold">전체 슬롯</p>
            </div>
            <div className="p-3 rounded-xl bg-green-100 border-2 border-green-400">
              <p className="text-2xl font-black text-green-700">{event.slots.filter((s) => s.booth).length}</p>
              <p className="text-xs text-green-700 font-semibold">연결됨</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-100 border-2 border-orange-400">
              <p className="text-2xl font-black text-orange-700">{event.slots.filter((s) => !s.booth).length}</p>
              <p className="text-xs text-orange-700 font-semibold">빈 자리</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 신청 관리 — 항상 표시 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-black flex items-center gap-2">
            <Store className="h-4 w-4 text-indigo-500" />
            부스 신청 현황
            {pendingApps.length > 0 && (
              <Badge className="bg-amber-400 text-amber-900 border-amber-600 font-black">
                {pendingApps.length}건 검토 필요
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasAnyApps ? (
            <div className="text-center py-10 text-muted-foreground">
              <Store className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-sm">아직 신청이 없습니다</p>
              <p className="text-xs mt-1">이벤트를 공개하면 부스 운영자들이 신청할 수 있습니다</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* 검토 중 */}
              {pendingApps.length > 0 && (
                <div>
                  <p className="text-xs font-black text-amber-700 mb-2 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> 검토 중 ({pendingApps.length})
                  </p>
                  <SlotApplicationsList applications={pendingApps} />
                </div>
              )}

              {/* 승인됨 */}
              {acceptedApps.length > 0 && (
                <div>
                  <p className="text-xs font-black text-green-700 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> 승인됨 ({acceptedApps.length})
                  </p>
                  <div className="space-y-2">
                    {acceptedApps.map((app) => {
                      const st = APP_STATUS.ACCEPTED;
                      return (
                        <div key={app.id} className={cn("flex items-center gap-3 border rounded-xl px-3 py-2.5 text-sm", st.cls)}>
                          <div className="w-7 h-7 rounded-lg bg-green-200 flex items-center justify-center flex-shrink-0">
                            <Store className="h-4 w-4 text-green-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black truncate">{app.booth.name}</p>
                            <p className="text-xs opacity-70 font-semibold truncate">
                              슬롯: {app.slot.label ?? `(${app.slot.posX}, ${app.slot.posY})`} · by {app.applicant.name}
                            </p>
                          </div>
                          <Badge className="text-[10px] bg-green-200 text-green-800 border-green-400 font-black">승인됨</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 거절됨 */}
              {rejectedApps.length > 0 && (
                <div>
                  <p className="text-xs font-black text-red-600 mb-2 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" /> 거절됨 ({rejectedApps.length})
                  </p>
                  <div className="space-y-2">
                    {rejectedApps.map((app) => (
                      <div key={app.id} className="flex items-center gap-3 border border-red-200 rounded-xl px-3 py-2 text-sm bg-red-50 opacity-60">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate text-red-800">{app.booth.name}</p>
                          <p className="text-xs text-red-600 font-semibold truncate">
                            슬롯: {app.slot.label ?? `(${app.slot.posX}, ${app.slot.posY})`}
                          </p>
                        </div>
                        <Badge className="text-[10px] bg-red-100 text-red-700 border-red-300 font-black">거절됨</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
