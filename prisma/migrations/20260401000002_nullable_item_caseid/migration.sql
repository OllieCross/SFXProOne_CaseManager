-- Make Item.caseId nullable (standalone items)
ALTER TABLE "Item" DROP CONSTRAINT IF EXISTS "Item_caseId_fkey";
ALTER TABLE "Item" ALTER COLUMN "caseId" DROP NOT NULL;
ALTER TABLE "Item" ADD CONSTRAINT "Item_caseId_fkey"
    FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;
