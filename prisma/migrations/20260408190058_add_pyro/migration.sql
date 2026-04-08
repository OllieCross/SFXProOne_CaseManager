-- CreateEnum
CREATE TYPE "PyroCategory" AS ENUM ('T1', 'T2', 'F1', 'F2', 'F3', 'F4', 'P1', 'P2', 'Other');

-- CreateTable
CREATE TABLE "Pyro" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "category" "PyroCategory" NOT NULL DEFAULT 'Other',
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "warningThreshold" INTEGER,
    "criticalThreshold" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Pyro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PyroImage" (
    "id" TEXT NOT NULL,
    "pyroId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PyroImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PyroDocument" (
    "id" TEXT NOT NULL,
    "pyroId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "DocType" NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PyroDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventPyro" (
    "eventId" TEXT NOT NULL,
    "pyroId" TEXT NOT NULL,
    "quantityNeeded" INTEGER NOT NULL,

    CONSTRAINT "EventPyro_pkey" PRIMARY KEY ("eventId","pyroId")
);

-- CreateIndex
CREATE UNIQUE INDEX "PyroImage_fileKey_key" ON "PyroImage"("fileKey");

-- CreateIndex
CREATE UNIQUE INDEX "PyroDocument_fileKey_key" ON "PyroDocument"("fileKey");

-- AddForeignKey
ALTER TABLE "PyroImage" ADD CONSTRAINT "PyroImage_pyroId_fkey" FOREIGN KEY ("pyroId") REFERENCES "Pyro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PyroDocument" ADD CONSTRAINT "PyroDocument_pyroId_fkey" FOREIGN KEY ("pyroId") REFERENCES "Pyro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPyro" ADD CONSTRAINT "EventPyro_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPyro" ADD CONSTRAINT "EventPyro_pyroId_fkey" FOREIGN KEY ("pyroId") REFERENCES "Pyro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
