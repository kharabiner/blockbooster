export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SlotApplyForm } from "@/components/events/SlotApplyForm";
import { buttonVariants } from "@/lib/button-variants";
import { ArrowLeft, MapPin, Store } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Params = { params: Promise<{ id: string; slotId: string }> };

export default async function SlotApplyPage({ params }: Params) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=" + encodeURIComponent((await params).slotId));

  const { id, slotId } = await params;

  const [slot, userBooths] = await Promise.all([
    prisma.boothSlot.findUnique({
      where: { id: slotId },
      include: {
        event: { select: { id: true, title: true, status: true, location: true } },
        booth: { select: { name: true } },
      },
    }),
    prisma.booth.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true, category: true, description: true, shortCode: true },
    }),
  ]);

  if (!slot || slot.eventId !== id) notFound();
  if (slot.boothId) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg text-center">
        <Store className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h1 className="text-xl font-semibold mb-2">이미 운영 중인 슬롯</h1>
        <p className="text-muted-foreground mb-6">
          이 슬롯은 이미 <strong>{slot.booth?.name}</strong> 부스가 연결되어 있습니다.
        </p>
        <Link href={`/events/${id}`} className={cn(buttonVariants())}>
          이벤트로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <Link href={`/events/${id}`} className={cn(buttonVariants({ variant: "ghost" }), "mb-6 -ml-2 inline-flex")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {slot.event.title}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">슬롯 신청</h1>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-2">
          {slot.label && <Badge variant="outline">{slot.label}</Badge>}
          {slot.event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {slot.event.location}
            </span>
          )}
        </div>
      </div>

      {userBooths.length === 0 ? (
        <div className="border rounded-xl p-8 text-center space-y-4">
          <Store className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">신청할 부스가 없습니다. 먼저 부스를 만들어주세요.</p>
          <Link href="/my-booths/new" className={cn(buttonVariants())}>
            부스 만들기
          </Link>
        </div>
      ) : (
        <SlotApplyForm slotId={slotId} eventId={id} booths={userBooths} />
      )}
    </div>
  );
}
