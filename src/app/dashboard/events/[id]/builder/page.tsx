import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BoothBuilder } from "@/components/builder/BoothBuilder";

type Params = { params: Promise<{ id: string }> };

export default async function BuilderPage({ params }: Params) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      slots: {
        include: { booth: { select: { id: true, name: true } } },
        orderBy: [{ posY: "asc" }, { posX: "asc" }],
      },
    },
  });

  if (!event) notFound();
  if (event.organizerId !== session.user.id) redirect("/dashboard");

  return (
    <BoothBuilder
      eventId={event.id}
      eventTitle={event.title}
      gridRows={event.gridRows}
      gridCols={event.gridCols}
      initialSlots={event.slots}
    />
  );
}
