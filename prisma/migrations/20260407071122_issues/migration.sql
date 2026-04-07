-- CreateTable
CREATE TABLE "IssueEntry" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deviceId" TEXT,
    "caseId" TEXT,
    "itemId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IssueEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IssueEntry" ADD CONSTRAINT "IssueEntry_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueEntry" ADD CONSTRAINT "IssueEntry_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueEntry" ADD CONSTRAINT "IssueEntry_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IssueEntry" ADD CONSTRAINT "IssueEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
