-- CreateTable
CREATE TABLE IF NOT EXISTS "EventModule" (
    "id" TEXT NOT NULL,
    "config" TEXT NOT NULL DEFAULT '{}',
    "eventId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "EventModule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "EventModule_eventId_moduleId_key" ON "EventModule"("eventId", "moduleId");

-- AddForeignKey
ALTER TABLE "EventModule" ADD CONSTRAINT "EventModule_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventModule" ADD CONSTRAINT "EventModule_moduleId_fkey"
    FOREIGN KEY ("moduleId") REFERENCES "FeatureModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
