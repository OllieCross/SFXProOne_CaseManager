-- Add quantityNeeded to GroupItem
ALTER TABLE "GroupItem" ADD COLUMN "quantityNeeded" INTEGER NOT NULL DEFAULT 1;
