-- Add quantityNeeded to EventItem
ALTER TABLE "EventItem" ADD COLUMN "quantityNeeded" INTEGER NOT NULL DEFAULT 1;

-- Allow user deletion by making FK fields nullable and setting ON DELETE behaviour

-- AuditLog: nullable userId, SET NULL on delete
ALTER TABLE "AuditLog" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Case.createdById: nullable, SET NULL on delete
ALTER TABLE "Case" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "Case" DROP CONSTRAINT "Case_createdById_fkey";
ALTER TABLE "Case" ADD CONSTRAINT "Case_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Case.updatedById: already nullable, fix FK to SET NULL
ALTER TABLE "Case" DROP CONSTRAINT IF EXISTS "Case_updatedById_fkey";
ALTER TABLE "Case" ADD CONSTRAINT "Case_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- LogbookEntry.userId: nullable, SET NULL on delete
ALTER TABLE "LogbookEntry" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "LogbookEntry" DROP CONSTRAINT "LogbookEntry_userId_fkey";
ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- EventStagehand.userId: CASCADE delete (removes crew entry when user deleted)
ALTER TABLE "EventStagehand" DROP CONSTRAINT "EventStagehand_userId_fkey";
ALTER TABLE "EventStagehand" ADD CONSTRAINT "EventStagehand_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- IssueEntry.userId: nullable, SET NULL on delete
ALTER TABLE "IssueEntry" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "IssueEntry" DROP CONSTRAINT "IssueEntry_userId_fkey";
ALTER TABLE "IssueEntry" ADD CONSTRAINT "IssueEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Tank.createdById: nullable, SET NULL on delete
ALTER TABLE "Tank" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "Tank" DROP CONSTRAINT "Tank_createdById_fkey";
ALTER TABLE "Tank" ADD CONSTRAINT "Tank_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Tank.updatedById: already nullable, fix FK to SET NULL
ALTER TABLE "Tank" DROP CONSTRAINT IF EXISTS "Tank_updatedById_fkey";
ALTER TABLE "Tank" ADD CONSTRAINT "Tank_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- TankLogbookEntry.userId: nullable, SET NULL on delete
ALTER TABLE "TankLogbookEntry" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "TankLogbookEntry" DROP CONSTRAINT "TankLogbookEntry_userId_fkey";
ALTER TABLE "TankLogbookEntry" ADD CONSTRAINT "TankLogbookEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
