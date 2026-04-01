-- New enums
CREATE TYPE "EventStatus" AS ENUM ('Planned', 'Confirmed', 'Completed', 'Cancelled', 'NeedsDetails');
CREATE TYPE "InvoiceStatus" AS ENUM ('Paid', 'NotPaid', 'DepositPaid', 'DepositNotYetPaid', 'NotPaidInFull');

-- Group
CREATE TABLE "Group" (
    "id"        TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- GroupCase
CREATE TABLE "GroupCase" (
    "groupId" TEXT NOT NULL,
    "caseId"  TEXT NOT NULL,

    CONSTRAINT "GroupCase_pkey" PRIMARY KEY ("groupId", "caseId")
);

ALTER TABLE "GroupCase" ADD CONSTRAINT "GroupCase_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupCase" ADD CONSTRAINT "GroupCase_caseId_fkey"
    FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GroupDevice
CREATE TABLE "GroupDevice" (
    "groupId"  TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,

    CONSTRAINT "GroupDevice_pkey" PRIMARY KEY ("groupId", "deviceId")
);

ALTER TABLE "GroupDevice" ADD CONSTRAINT "GroupDevice_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupDevice" ADD CONSTRAINT "GroupDevice_deviceId_fkey"
    FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GroupItem
CREATE TABLE "GroupItem" (
    "groupId" TEXT NOT NULL,
    "itemId"  TEXT NOT NULL,

    CONSTRAINT "GroupItem_pkey" PRIMARY KEY ("groupId", "itemId")
);

ALTER TABLE "GroupItem" ADD CONSTRAINT "GroupItem_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupItem" ADD CONSTRAINT "GroupItem_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GroupConsumable
CREATE TABLE "GroupConsumable" (
    "groupId"        TEXT NOT NULL,
    "consumableId"   TEXT NOT NULL,
    "quantityNeeded" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "GroupConsumable_pkey" PRIMARY KEY ("groupId", "consumableId")
);

ALTER TABLE "GroupConsumable" ADD CONSTRAINT "GroupConsumable_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupConsumable" ADD CONSTRAINT "GroupConsumable_consumableId_fkey"
    FOREIGN KEY ("consumableId") REFERENCES "Consumable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Event
CREATE TABLE "Event" (
    "id"            TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "venueName"     TEXT NOT NULL,
    "location"      TEXT,
    "startDate"     TIMESTAMP(3) NOT NULL,
    "endDate"       TIMESTAMP(3) NOT NULL,
    "clientPhone"   TEXT,
    "clientEmail"   TEXT,
    "comments"      TEXT,
    "status"        "EventStatus" NOT NULL DEFAULT 'Planned',
    "invoiceStatus" "InvoiceStatus" NOT NULL DEFAULT 'NotPaid',
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- EventStagehand
CREATE TABLE "EventStagehand" (
    "eventId" TEXT NOT NULL,
    "userId"  TEXT NOT NULL,

    CONSTRAINT "EventStagehand_pkey" PRIMARY KEY ("eventId", "userId")
);

ALTER TABLE "EventStagehand" ADD CONSTRAINT "EventStagehand_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventStagehand" ADD CONSTRAINT "EventStagehand_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- EventCase
CREATE TABLE "EventCase" (
    "eventId" TEXT NOT NULL,
    "caseId"  TEXT NOT NULL,

    CONSTRAINT "EventCase_pkey" PRIMARY KEY ("eventId", "caseId")
);

ALTER TABLE "EventCase" ADD CONSTRAINT "EventCase_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventCase" ADD CONSTRAINT "EventCase_caseId_fkey"
    FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EventDevice
CREATE TABLE "EventDevice" (
    "eventId"  TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,

    CONSTRAINT "EventDevice_pkey" PRIMARY KEY ("eventId", "deviceId")
);

ALTER TABLE "EventDevice" ADD CONSTRAINT "EventDevice_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventDevice" ADD CONSTRAINT "EventDevice_deviceId_fkey"
    FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EventItem
CREATE TABLE "EventItem" (
    "eventId" TEXT NOT NULL,
    "itemId"  TEXT NOT NULL,

    CONSTRAINT "EventItem_pkey" PRIMARY KEY ("eventId", "itemId")
);

ALTER TABLE "EventItem" ADD CONSTRAINT "EventItem_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventItem" ADD CONSTRAINT "EventItem_itemId_fkey"
    FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EventConsumable
CREATE TABLE "EventConsumable" (
    "eventId"        TEXT NOT NULL,
    "consumableId"   TEXT NOT NULL,
    "quantityNeeded" DOUBLE PRECISION NOT NULL,
    "quantityUsed"   DOUBLE PRECISION,

    CONSTRAINT "EventConsumable_pkey" PRIMARY KEY ("eventId", "consumableId")
);

ALTER TABLE "EventConsumable" ADD CONSTRAINT "EventConsumable_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventConsumable" ADD CONSTRAINT "EventConsumable_consumableId_fkey"
    FOREIGN KEY ("consumableId") REFERENCES "Consumable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
