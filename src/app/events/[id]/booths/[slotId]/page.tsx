export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Store, ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import { BoothModules } from "@/components/modules/BoothModules";

type Params = { params: Promise<{ id: string; slotId: string }> };

export default async function BoothDetailPage({ params }: Params) {
  const { id: eventId, slotId } = await params;
  const session = await auth();

  const slot = await prisma.boothSlot.findUnique({
    where: { id: slotId },
    include: {
      booth: {
        include: {
          owner: { select: { id: true, name: true, image: true } },
        },
      },
      event: {
        include: {
          template: {
            include: { modules: { include: { module: true } } },
          },
        },
      },
    },
  });

  if (!slot || slot.eventId !== eventId) notFound();

  const isOperator = slot.booth?.ownerId === session?.user?.id;
  const isOrganizer = slot.event.organizerId === session?.user?.id;

  // 이벤트에 활성화된 모듈 목록
  const activeModules = slot.event.template?.modules ?? [];

  // 방문 기록
  await prisma.visit.create({
    data: { boothSlotId: slotId, visitorId: session?.user?.id ?? null },
  }).catch(() => {}); // 중복 무시

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* 뒤로 가기 */}
      <Link
        href={`/events/${eventId}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 -ml-2 inline-flex")}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        이벤트로 돌아가기
      </Link>

      {slot.booth ? (
        <>
          {/* 부스 헤더 */}
          <div className="mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: slot.color }}
            >
              <Store className="h-8 w-8 text-white" />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">{slot.booth.name}</h1>
                {slot.booth.category && (
                  <Badge variant="secondary">{slot.booth.category}</Badge>
                )}
              </div>
              {(isOperator || isOrganizer) && (
                <Badge variant="outline" className="text-xs">
                  {isOperator ? "운영자" : "주최자"}
                </Badge>
              )}
            </div>

            {slot.booth.description && (
              <p className="mt-3 text-muted-foreground">{slot.booth.description}</p>
            )}

            <div className="flex items-center gap-2 mt-4">
              <Avatar className="h-7 w-7">
                <AvatarImage src={slot.booth.owner.image ?? ""} />
                <AvatarFallback className="text-xs">
                  {slot.booth.owner.name?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{slot.booth.owner.name}</span>
            </div>

            {slot.label && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>위치: {slot.label}</span>
              </div>
            )}
          </div>

          {activeModules.length > 0 && (
            <>
              <Separator className="mb-6" />
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                  기능
                </h2>
                <BoothModules
                  slotId={slotId}
                  modules={activeModules.map((tm) => ({
                    moduleId: tm.moduleId,
                    config: JSON.parse(tm.config),
                  }))}
                  isOperator={isOperator}
                />
              </section>
            </>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <Store className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">아직 부스가 연결되지 않은 자리입니다</p>
          {session && (
            <Link
              href={`/events/${eventId}/slots/${slotId}/apply`}
              className={cn(buttonVariants(), "mt-6 inline-flex")}
            >
              이 자리에 신청하기
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
