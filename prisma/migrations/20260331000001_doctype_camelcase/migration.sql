-- Rename existing DocType enum values to CamelCase
ALTER TYPE "DocType" RENAME VALUE 'MANUAL' TO 'Manual';
ALTER TYPE "DocType" RENAME VALUE 'CERTIFICATE' TO 'Certificate';
ALTER TYPE "DocType" RENAME VALUE 'OTHER' TO 'Other';

-- Add new DocType enum values
ALTER TYPE "DocType" ADD VALUE 'Bill';
ALTER TYPE "DocType" ADD VALUE 'Order';
ALTER TYPE "DocType" ADD VALUE 'Invoice';
ALTER TYPE "DocType" ADD VALUE 'ServiceReport';
