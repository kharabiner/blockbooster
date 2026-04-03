import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BoothMap } from "@/components/events/BoothMap";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, MapPin, Store } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ShareButton } from "@/components/events/ShareButton";
import { AnnouncementSection } from "@/components/events/AnnouncementSection";

type Params = { params: Promise<{ id: string }> };

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "준비중", variant: "secondary" },
  PUBLISHED: { label: "모집중", variant: "default" },
  ONGOING: { label: "진행중", variant: "default" },
  ENDED: { label: "종료", variant: "outline" },
};

export default async function EventPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true, image: true } },
      template: {
        include: { modules: { include: { module: true } } },
      },
      slots: {
        include: {
          booth: {
            include: { owner: { select: { id: true, name: true, image: true } } },
          },
        },
        orderBy: [{ posY: "asc" }, { posX: "asc" }],
      },
      announcements: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!event) notFound();

  const isOrganizer = session?.user?.id === event.organizerId;
  const statusInfo = STATUS_LABEL[event.status] ?? STATUS_LABEL.DRAFT;
  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);
  const connectedSlots = event.slots.filter((s) => s.booth);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              {event.template && (
                <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                  {event.template.name}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-3">{event.title}</h1>
            {event.description && (
              <p className="text-muted-foreground">{event.description}</p>
            )}
          </div>
          <ShareButton shortCode={event.shortCode} title={event.title} />
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            <span>
              {startDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
              {" — "}
              {endDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Store className="h-4 w-4" />
            <span>
              {connectedSlots.length}/{event.slots.length} 부스 운영
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Avatar className="h-7 w-7">
            <AvatarImage src={event.organizer.image ?? ""} />
            <AvatarFallback className="text-xs">
              {event.organizer.name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">주최: {event.organizer.name}</span>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* 부스 맵 */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">부스 배치도</h2>
        {event.slots.length === 0 ? (
          <div className="rounded-lg border bg-muted/30 p-12 text-center text-muted-foreground">
            <Store className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>아직 부스가 배치되지 않았습니다.</p>
          </div>
        ) : (
          <BoothMap
            eventId={event.id}
            gridRows={event.gridRows}
            gridCols={event.gridCols}
            slots={event.slots}
          />
        )}
      </section>

      {/* 부스 목록 */}
      {connectedSlots.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">부스 목록</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {connectedSlots.map((slot) => (
              <a
                key={slot.id}
                href={`/events/${event.id}/booths/${slot.id}`}
                className="flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: slot.color }}
                >
                  <Store className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{slot.booth!.name}</p>
                  {slot.booth!.category && (
                    <p className="text-xs text-muted-foreground">{slot.booth!.category}</p>
                  )}
                  {slot.booth!.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {slot.booth!.description}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 공지사항 */}
      <AnnouncementSection eventId={event.id} isOrganizer={isOrganizer} />
    </div>
  );
}
