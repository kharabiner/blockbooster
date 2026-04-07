export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { InviteAcceptForm } from "./InviteAcceptForm";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/button-variants";
import { CalendarDays, MapPin, Store, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Params = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: Params) {
  const { token } = await params;
  const session = await auth();

  const invitation = await prisma.slotInvitation.findUnique({
    where: { token },
    include: {
      slot: {
        include: {
          event: {
            include: { organizer: { select: { name: true } } },
          },
        },
      },
    },
  });

  // 유효하지 않은 토큰
  if (!invitation) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
        <h1 className="text-xl font-black mb-2">유효하지 않은 초대 링크입니다</h1>
        <p className="text-muted-foreground text-sm mb-6">링크가 올바른지 확인하거나 주최자에게 다시 요청해주세요.</p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>홈으로</Link>
      </div>
    );
  }

  // 만료된 토큰
  const isExpired = new Date() > invitation.expiresAt || invitation.status === "EXPIRED";
  if (isExpired) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-400" />
        <h1 className="text-xl font-black mb-2">만료된 초대 링크입니다</h1>
        <p className="text-muted-foreground text-sm mb-6">초대 링크가 만료되었습니다. 주최자에게 새 링크를 요청해주세요.</p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>홈으로</Link>
      </div>
    );
  }

  // 이미 수락됨
  if (invitation.status === "ACCEPTED" || invitation.slot.boothId) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
        <h1 className="text-xl font-black mb-2">이미 수락된 초대입니다</h1>
        <p className="text-muted-foreground text-sm mb-6">이 슬롯은 이미 부스가 연결되었습니다.</p>
        <Link href={`/events/${invitation.slot.event.id}`} className={cn(buttonVariants())}>
          이벤트 보기
        </Link>
      </div>
    );
  }

  // 로그인 안 된 경우 로그인 페이지로
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/invite/${token}`);
  }

  const event = invitation.slot.event;
  const slot = invitation.slot;

  // 로그인한 사용자의 기존 부스 목록
  const existingBooths = await prisma.booth.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      {/* 초대 헤더 */}
      <div className="text-center mb-8">
        <div
          className="w-14 h-14 rounded-2xl mx-auto mb-4 border-2 border-black/15 shadow-[3px_3px_0px_rgba(0,0,0,0.3)]"
          style={{ backgroundColor: slot.color }}
        />
        <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 font-black">부스 초대</Badge>
        <h1 className="text-2xl font-black mb-1">{slot.label ?? "빈 슬롯"}</h1>
        <p className="text-muted-foreground text-sm">
          <span className="font-semibold text-foreground">{event.organizer.name}</span>님이 이 슬롯에 초대했습니다.
        </p>
      </div>

      {/* 이벤트 정보 카드 */}
      <div className="border-2 border-foreground/15 rounded-2xl p-5 mb-6 space-y-3 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
        <h2 className="font-black text-lg">{event.title}</h2>
        <div className="space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 flex-shrink-0" />
            <span>
              {new Date(event.startAt).toLocaleDateString("ko-KR", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 flex-shrink-0" />
            <span>슬롯: {slot.label ?? `(${slot.posX}, ${slot.posY})`}</span>
          </div>
        </div>
      </div>

      {/* 수락 폼 */}
      <div className="border-2 border-foreground/15 rounded-2xl p-5 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
        <h3 className="font-black text-sm mb-4">어떤 부스로 참가할까요?</h3>
        <InviteAcceptForm
          token={token}
          existingBooths={existingBooths}
          eventId={event.id}
        />
      </div>
    </div>
  );
}
