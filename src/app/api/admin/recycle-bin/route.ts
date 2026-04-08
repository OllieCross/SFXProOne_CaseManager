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

// POST - purge all items in the recycle bin
export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const deleted = { not: null } as const

  // Purge media files from MinIO and DB
  const [allImages, allDocuments, allDeviceImages, allDeviceDocuments] = await Promise.all([
    prisma.image.findMany({ where: { deletedAt: deleted }, select: { id: true, fileKey: true } }),
    prisma.document.findMany({ where: { deletedAt: deleted }, select: { id: true, fileKey: true } }),
    prisma.deviceImage.findMany({ where: { deletedAt: deleted }, select: { id: true, fileKey: true } }),
    prisma.deviceDocument.findMany({ where: { deletedAt: deleted }, select: { id: true, fileKey: true } }),
  ])

  for (const img of [...allImages, ...allDeviceImages]) {
    try { await deleteFile(img.fileKey) } catch { /* ignore */ }
  }
  for (const doc of [...allDocuments, ...allDeviceDocuments]) {
    try { await deleteFile(doc.fileKey) } catch { /* ignore */ }
  }

  await Promise.all([
    prisma.image.deleteMany({ where: { id: { in: allImages.map(i => i.id) } } }),
    prisma.document.deleteMany({ where: { id: { in: allDocuments.map(d => d.id) } } }),
    prisma.deviceImage.deleteMany({ where: { id: { in: allDeviceImages.map(i => i.id) } } }),
    prisma.deviceDocument.deleteMany({ where: { id: { in: allDeviceDocuments.map(d => d.id) } } }),
    prisma.case.deleteMany({ where: { deletedAt: deleted } }),
    prisma.device.deleteMany({ where: { deletedAt: deleted } }),
    prisma.item.deleteMany({ where: { deletedAt: deleted } }),
    prisma.consumable.deleteMany({ where: { deletedAt: deleted } }),
  ])

  return NextResponse.json({ ok: true })
}
