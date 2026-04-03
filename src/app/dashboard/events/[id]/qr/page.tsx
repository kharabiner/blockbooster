import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QRCodeDisplay } from "@/components/events/QRCodeDisplay";
import { buttonVariants } from "@/lib/button-variants";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export default async function EventQRPage({ params }: Params) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      slots: {
        where: { boothId: { not: null } },
        include: { booth: { select: { name: true, shortCode: true } } },
        orderBy: [{ posY: "asc" }, { posX: "asc" }],
      },
    },
  });

  if (!event || event.organizerId !== session.user.id) notFound();

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link href={`/dashboard/events/${id}`} className={cn(buttonVariants({ variant: "ghost" }), "mb-6 -ml-2 inline-flex")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        이벤트 관리
      </Link>

      <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
      <p className="text-muted-foreground mb-8">QR 코드를 인쇄해 부스 안내판에 부착하세요.</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-indigo-500" />
            이벤트 QR
          </h2>
          <QRCodeDisplay
            label={event.title}
            url={`${baseUrl}/e/${event.shortCode}`}
            shortCode={event.shortCode}
          />
        </section>

        {event.slots.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">부스별 QR</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {event.slots.map((slot) => (
                <QRCodeDisplay
                  key={slot.id}
                  label={slot.booth?.name ?? slot.label ?? "부스"}
                  url={`${baseUrl}/events/${event.id}/booths/${slot.id}`}
                  shortCode={slot.booth?.shortCode ?? slot.id.slice(0, 8)}
                  compact
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
