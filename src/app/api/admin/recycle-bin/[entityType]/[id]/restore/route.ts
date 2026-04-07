import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ entityType: string; id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { entityType, id } = await params

  switch (entityType) {
    case 'case':
      await prisma.case.update({ where: { id }, data: { deletedAt: null } })
      break
    case 'device':
      await prisma.device.update({ where: { id }, data: { deletedAt: null } })
      break
    case 'item':
      await prisma.item.update({ where: { id }, data: { deletedAt: null } })
      break
    case 'consumable':
      await prisma.consumable.update({ where: { id }, data: { deletedAt: null } })
      break
    case 'image':
      await prisma.image.update({ where: { id }, data: { deletedAt: null } })
      break
    case 'document':
      await prisma.document.update({ where: { id }, data: { deletedAt: null } })
      break
    case 'deviceImage':
      await prisma.deviceImage.update({ where: { id }, data: { deletedAt: null } })
      break
    case 'deviceDocument':
      await prisma.deviceDocument.update({ where: { id }, data: { deletedAt: null } })
      break
    default:
      return NextResponse.json({ error: 'Unknown entity type' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
