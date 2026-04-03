import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Store, Settings, LayoutGrid } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "준비중", variant: "secondary" },
  PUBLISHED: { label: "모집중", variant: "default" },
  ONGOING: { label: "진행중", variant: "default" },
  ENDED: { label: "종료", variant: "outline" },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const events = await prisma.event.findMany({
    where: { organizerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { slots: true } },
      template: { select: { name: true } },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">내 이벤트</h1>
          <p className="text-sm text-muted-foreground mt-1">내가 주최하는 이벤트를 관리합니다</p>
        </div>
        <Link href="/dashboard/events/new" className={cn(buttonVariants())}>
          새 이벤트
        </Link>
      </div>

      {events.length === 0 ? (
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
            const statusInfo = STATUS_LABEL[event.status] ?? STATUS_LABEL.DRAFT;
            return (
              <Card key={event.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={statusInfo.variant} className="text-xs">
                        {statusInfo.label}
                      </Badge>
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
                    <Link
                      href={`/events/${event.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      보기
                    </Link>
                    <Link
                      href={`/dashboard/events/${event.id}/builder`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      <Settings className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
