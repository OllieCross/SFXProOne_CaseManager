import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({ groupId: z.string().min(1) })

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: eventId } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const group = await prisma.group.findUnique({
    where: { id: parsed.data.groupId },
    include: {
      cases: true,
      devices: true,
      items: true,
      consumables: true,
    },
  })
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

  // Add all group members to the event (upsert so duplicates are safe)
  await Promise.all([
    ...group.cases.map((gc) =>
      prisma.eventCase.upsert({
        where: { eventId_caseId: { eventId, caseId: gc.caseId } },
        create: { eventId, caseId: gc.caseId },
        update: {},
      })
    ),
    ...group.devices.map((gd) =>
      prisma.eventDevice.upsert({
        where: { eventId_deviceId: { eventId, deviceId: gd.deviceId } },
        create: { eventId, deviceId: gd.deviceId },
        update: {},
      })
    ),
    ...group.items.map((gi) =>
      prisma.eventItem.upsert({
        where: { eventId_itemId: { eventId, itemId: gi.itemId } },
        create: { eventId, itemId: gi.itemId },
        update: {},
      })
    ),
    ...group.consumables.map((gc) =>
      prisma.eventConsumable.upsert({
        where: { eventId_consumableId: { eventId, consumableId: gc.consumableId } },
        create: { eventId, consumableId: gc.consumableId, quantityNeeded: gc.quantityNeeded },
        update: { quantityNeeded: gc.quantityNeeded },
      })
    ),
  ])

  return NextResponse.json({ ok: true })
}
