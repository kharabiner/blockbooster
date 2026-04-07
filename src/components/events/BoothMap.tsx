"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/lib/button-variants";
import { Store, ExternalLink, Link2, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Slot = {
  id: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  color: string;
  label?: string | null;
  booth?: {
    id: string;
    name: string;
    description?: string | null;
    category?: string | null;
    owner: { name?: string | null; image?: string | null };
  } | null;
};

type BoothMapProps = {
  eventId: string;
  gridRows: number;
  gridCols: number;
  slots: Slot[];
  isOrganizer?: boolean;
};

const CELL_SIZE = 48;

export function BoothMap({ eventId, gridRows, gridCols, slots, isOrganizer = false }: BoothMapProps) {
  const [selected, setSelected] = useState<Slot | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  async function handleCreateInvite(slotId: string) {
    setInviteLoading(true);
    try {
      const res = await fetch(`/api/slots/${slotId}/invite`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "초대 링크 생성에 실패했습니다.");
        return;
      }
      await navigator.clipboard.writeText(data.inviteUrl);
      toast.success("초대 링크가 클립보드에 복사되었습니다!");
    } catch {
      toast.error("클립보드 복사에 실패했습니다. 링크를 직접 복사해주세요.");
    } finally {
      setInviteLoading(false);
    }
  }

  const gridWidth = gridCols * CELL_SIZE;
  const gridHeight = gridRows * CELL_SIZE;

  return (
    <>
      <div className="overflow-auto rounded-lg border bg-muted/30 p-4">
        <div
          className="relative mx-auto"
          style={{
            width: gridWidth,
            height: gridHeight,
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          }}
        >
          {slots.map((slot) => {
            const hasBooth = !!slot.booth;
            return (
              <button
                key={slot.id}
                onClick={() => setSelected(slot)}
                className="absolute rounded-md border-2 border-white/60 shadow-sm hover:shadow-md hover:brightness-95 transition-all cursor-pointer flex flex-col items-center justify-center text-white text-xs font-medium overflow-hidden"
                style={{
                  left: slot.posX * CELL_SIZE + 2,
                  top: slot.posY * CELL_SIZE + 2,
                  width: slot.width * CELL_SIZE - 4,
                  height: slot.height * CELL_SIZE - 4,
                  backgroundColor: slot.color || "#94a3b8",
                  opacity: hasBooth ? 1 : 0.45,
                }}
              >
                {hasBooth ? (
                  <>
                    <Store className="h-4 w-4 mb-0.5 opacity-80" />
                    <span className="line-clamp-1 px-1 text-center">
                      {slot.booth?.name ?? slot.label}
                    </span>
                  </>
                ) : (
                  <span className="text-white/80 drop-shadow">{slot.label ?? "빈 자리"}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl">
          {selected && (
            <>
              <SheetHeader className="text-left pb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: selected.color }}
                >
                  <Store className="h-5 w-5 text-white" />
                </div>
                <SheetTitle>
                  {selected.booth ? selected.booth.name : (selected.label ?? "빈 자리")}
                </SheetTitle>
              </SheetHeader>

              {selected.booth ? (
                <div className="space-y-4">
                  {selected.booth.category && (
                    <Badge variant="secondary">{selected.booth.category}</Badge>
                  )}
                  {selected.booth.description && (
                    <p className="text-sm text-muted-foreground">{selected.booth.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selected.booth.owner.image ?? ""} />
                      <AvatarFallback className="text-xs">
                        {selected.booth.owner.name?.[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{selected.booth.owner.name}</span>
                  </div>
                  <Link
                    href={`/events/${eventId}/booths/${selected.id}`}
                    className={cn(buttonVariants(), "w-full justify-center")}
                  >
                    부스 상세 보기
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">아직 부스가 연결되지 않은 자리입니다.</p>
                  {isOrganizer ? (
                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        onClick={() => handleCreateInvite(selected.id)}
                        disabled={inviteLoading}
                        className={cn(buttonVariants(), "w-full justify-center font-black")}
                      >
                        {inviteLoading
                          ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          : <Link2 className="h-4 w-4 mr-2" />
                        }
                        초대 링크 생성 · 복사
                      </button>
                      <Link
                        href={`/dashboard/events/${eventId}`}
                        className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}
                      >
                        신청 현황 관리
                      </Link>
                    </div>
                  ) : (
                    <Link
                      href={`/events/${eventId}/slots/${selected.id}/apply`}
                      className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}
                    >
                      이 자리에 신청하기
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
