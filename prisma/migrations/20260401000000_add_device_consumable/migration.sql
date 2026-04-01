-- Add new columns to Case
ALTER TABLE "Case" ADD COLUMN "warehouseLocation" TEXT;
ALTER TABLE "Case" ADD COLUMN "notes" TEXT;

-- New enums
CREATE TYPE "DeviceStatus" AS ENUM ('Working', 'Faulty', 'InRepair', 'Retired', 'Lost', 'RentedToFriend');

-- Device
CREATE TABLE "Device" (
    "id"           TEXT NOT NULL,
    "name"         TEXT NOT NULL,
    "qrCode"       TEXT NOT NULL,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "status"       "DeviceStatus" NOT NULL DEFAULT 'Working',
    "caseId"       TEXT,
    "notes"        TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Device_qrCode_key" ON "Device"("qrCode");

ALTER TABLE "Device" ADD CONSTRAINT "Device_caseId_fkey"
    FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- LogbookEntry
CREATE TABLE "LogbookEntry" (
    "id"        TEXT NOT NULL,
    "deviceId"  TEXT NOT NULL,
    "date"      TIMESTAMP(3) NOT NULL,
    "comment"   TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogbookEntry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_deviceId_fkey"
    FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LogbookEntry" ADD CONSTRAINT "LogbookEntry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DeviceImage
CREATE TABLE "DeviceImage" (
    "id"        TEXT NOT NULL,
    "deviceId"  TEXT NOT NULL,
    "fileKey"   TEXT NOT NULL,
    "fileName"  TEXT NOT NULL,
    "fileSize"  INTEGER NOT NULL,
    "mimeType"  TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeviceImage_fileKey_key" ON "DeviceImage"("fileKey");

ALTER TABLE "DeviceImage" ADD CONSTRAINT "DeviceImage_deviceId_fkey"
    FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DeviceDocument
CREATE TABLE "DeviceDocument" (
    "id"        TEXT NOT NULL,
    "deviceId"  TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "type"      "DocType" NOT NULL,
    "fileKey"   TEXT NOT NULL,
    "fileName"  TEXT NOT NULL,
    "fileSize"  INTEGER NOT NULL,
    "mimeType"  TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DeviceDocument_fileKey_key" ON "DeviceDocument"("fileKey");

ALTER TABLE "DeviceDocument" ADD CONSTRAINT "DeviceDocument_deviceId_fkey"
    FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Consumable
CREATE TABLE "Consumable" (
    "id"            TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "unit"          TEXT NOT NULL,
    "stockQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes"         TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consumable_pkey" PRIMARY KEY ("id")
);
