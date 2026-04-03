-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FeatureModule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "configSchema" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "slotLayout" TEXT NOT NULL DEFAULT '[]',
    "gridRows" INTEGER NOT NULL DEFAULT 10,
    "gridCols" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Template_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplateModule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "config" TEXT NOT NULL DEFAULT '{}',
    "templateId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    CONSTRAINT "TemplateModule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TemplateModule_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "FeatureModule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shortCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "location" TEXT,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "gridRows" INTEGER NOT NULL DEFAULT 10,
    "gridCols" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "organizerId" TEXT NOT NULL,
    "templateId" TEXT,
    CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Event_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "mediaUrls" TEXT NOT NULL DEFAULT '[]',
    "shortCode" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Booth_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BoothSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "posX" INTEGER NOT NULL,
    "posY" INTEGER NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 2,
    "height" INTEGER NOT NULL DEFAULT 2,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "label" TEXT,
    "eventId" TEXT NOT NULL,
    "boothId" TEXT,
    CONSTRAINT "BoothSlot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BoothSlot_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SlotApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "slotId" TEXT NOT NULL,
    "boothId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    CONSTRAINT "SlotApplication_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "BoothSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SlotApplication_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SlotApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SlotInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slotId" TEXT NOT NULL,
    CONSTRAINT "SlotInvitation_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "BoothSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModuleData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL DEFAULT '{}',
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "boothSlotId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    CONSTRAINT "ModuleData_boothSlotId_fkey" FOREIGN KEY ("boothSlotId") REFERENCES "BoothSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModuleData_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "FeatureModule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "visitorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "boothSlotId" TEXT NOT NULL,
    CONSTRAINT "Visit_boothSlotId_fkey" FOREIGN KEY ("boothSlotId") REFERENCES "BoothSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    CONSTRAINT "Announcement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateModule_templateId_moduleId_key" ON "TemplateModule"("templateId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_shortCode_key" ON "Event"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "Booth_shortCode_key" ON "Booth"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "SlotInvitation_token_key" ON "SlotInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleData_boothSlotId_moduleId_userId_key" ON "ModuleData"("boothSlotId", "moduleId", "userId");
