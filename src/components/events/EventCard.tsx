import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, MapPin, LayoutGrid } from "lucide-react";

type EventCardProps = {
  event: {
    id: string;
    shortCode: string;
    title: string;
    description?: string | null;
    thumbnail?: string | null;
    location?: string | null;
    startAt: string | Date;
    endAt: string | Date;
    status: string;
    organizer: {
      name?: string | null;
      image?: string | null;
    };
    _count: { slots: number };
  };
};

const STATUS_LABEL: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "준비중", variant: "secondary" },
  PUBLISHED: { label: "모집중", variant: "default" },
  ONGOING: { label: "진행중", variant: "default" },
  ENDED: { label: "종료", variant: "outline" },
};

export function EventCard({ event }: EventCardProps) {
  const statusInfo = STATUS_LABEL[event.status] ?? STATUS_LABEL.DRAFT;
  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);

  const dateStr = `${startDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })} — ${endDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}`;

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer h-full flex flex-col">
        {/* 썸네일 */}
        <div className="relative aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
          {event.thumbnail ? (
            <img
              src={event.thumbnail}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <LayoutGrid className="h-12 w-12 text-indigo-300" />
            </div>
          )}
          <Badge
            variant={statusInfo.variant}
            className="absolute top-2 left-2 text-xs"
          >
            {statusInfo.label}
          </Badge>
        </div>

        <CardContent className="flex flex-col gap-2 p-4 flex-1">
          <h3 className="font-semibold text-base line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {event.title}
          </h3>

          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
          )}

          <div className="mt-auto space-y-1.5 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{dateStr}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={event.organizer.image ?? ""} />
                  <AvatarFallback className="text-[10px]">
                    {event.organizer.name?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{event.organizer.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{event._count.slots}개 부스</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
