import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/minio'

// GET - list all soft-deleted items
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [cases, devices, items, consumables, images, documents, deviceImages, deviceDocuments] = await Promise.all([
    prisma.case.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, select: { id: true, name: true, deletedAt: true } }),
    prisma.device.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, select: { id: true, name: true, deletedAt: true } }),
    prisma.item.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, select: { id: true, name: true, deletedAt: true } }),
    prisma.consumable.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, select: { id: true, name: true, deletedAt: true } }),
    prisma.image.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, include: { case: { select: { name: true } } } }),
    prisma.document.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, include: { case: { select: { name: true } } } }),
    prisma.deviceImage.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, include: { device: { select: { name: true } } } }),
    prisma.deviceDocument.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, include: { device: { select: { name: true } } } }),
  ])

  return NextResponse.json({ cases, devices, items, consumables, images, documents, deviceImages, deviceDocuments })
}

// POST - purge expired items (older than 7 days)
export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Purge media files from MinIO and DB
  const [expiredImages, expiredDocuments, expiredDeviceImages, expiredDeviceDocuments] = await Promise.all([
    prisma.image.findMany({ where: { deletedAt: { lte: cutoff } }, select: { id: true, fileKey: true } }),
    prisma.document.findMany({ where: { deletedAt: { lte: cutoff } }, select: { id: true, fileKey: true } }),
    prisma.deviceImage.findMany({ where: { deletedAt: { lte: cutoff } }, select: { id: true, fileKey: true } }),
    prisma.deviceDocument.findMany({ where: { deletedAt: { lte: cutoff } }, select: { id: true, fileKey: true } }),
  ])

  for (const img of [...expiredImages, ...expiredDeviceImages]) {
    try { await deleteFile(img.fileKey) } catch { /* ignore */ }
  }
  for (const doc of [...expiredDocuments, ...expiredDeviceDocuments]) {
    try { await deleteFile(doc.fileKey) } catch { /* ignore */ }
  }

  await Promise.all([
    prisma.image.deleteMany({ where: { id: { in: expiredImages.map(i => i.id) } } }),
    prisma.document.deleteMany({ where: { id: { in: expiredDocuments.map(d => d.id) } } }),
    prisma.deviceImage.deleteMany({ where: { id: { in: expiredDeviceImages.map(i => i.id) } } }),
    prisma.deviceDocument.deleteMany({ where: { id: { in: expiredDeviceDocuments.map(d => d.id) } } }),
    // Purge parent entities (cascade handles their media if also deleted)
    prisma.case.deleteMany({ where: { deletedAt: { lte: cutoff } } }),
    prisma.device.deleteMany({ where: { deletedAt: { lte: cutoff } } }),
    prisma.item.deleteMany({ where: { deletedAt: { lte: cutoff } } }),
    prisma.consumable.deleteMany({ where: { deletedAt: { lte: cutoff } } }),
  ])

  return NextResponse.json({ ok: true, purgedBefore: cutoff.toISOString() })
}
