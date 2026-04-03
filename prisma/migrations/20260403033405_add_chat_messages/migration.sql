-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slotId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    CONSTRAINT "ChatMessage_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "BoothSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ChatMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
