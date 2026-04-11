-- Add tankId to IssueEntry
ALTER TABLE "IssueEntry" ADD COLUMN "tankId" TEXT;
ALTER TABLE "IssueEntry" ADD CONSTRAINT "IssueEntry_tankId_fkey" FOREIGN KEY ("tankId") REFERENCES "Tank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
