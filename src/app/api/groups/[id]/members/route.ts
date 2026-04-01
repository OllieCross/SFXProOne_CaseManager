import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Body shape for adding/removing a single member
const schema = z.object({
  action: z.enum(['add', 'remove']),
  type: z.enum(['case', 'device', 'item', 'consumable']),
  memberId: z.string().min(1),
  quantityNeeded: z.number().min(0).optional(), // only for consumables
})

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: groupId } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { action, type, memberId, quantityNeeded } = parsed.data

  if (action === 'add') {
    switch (type) {
      case 'case':
        await prisma.groupCase.upsert({
          where: { groupId_caseId: { groupId, caseId: memberId } },
          create: { groupId, caseId: memberId },
          update: {},
        })
        break
      case 'device':
        await prisma.groupDevice.upsert({
          where: { groupId_deviceId: { groupId, deviceId: memberId } },
          create: { groupId, deviceId: memberId },
          update: {},
        })
        break
      case 'item':
        await prisma.groupItem.upsert({
          where: { groupId_itemId: { groupId, itemId: memberId } },
          create: { groupId, itemId: memberId },
          update: {},
        })
        break
      case 'consumable':
        await prisma.groupConsumable.upsert({
          where: { groupId_consumableId: { groupId, consumableId: memberId } },
          create: { groupId, consumableId: memberId, quantityNeeded: quantityNeeded ?? 1 },
          update: { quantityNeeded: quantityNeeded ?? 1 },
        })
        break
    }
  } else {
    switch (type) {
      case 'case':
        await prisma.groupCase.deleteMany({ where: { groupId, caseId: memberId } })
        break
      case 'device':
        await prisma.groupDevice.deleteMany({ where: { groupId, deviceId: memberId } })
        break
      case 'item':
        await prisma.groupItem.deleteMany({ where: { groupId, itemId: memberId } })
        break
      case 'consumable':
        await prisma.groupConsumable.deleteMany({ where: { groupId, consumableId: memberId } })
        break
    }
  }

  return NextResponse.json({ ok: true })
}
