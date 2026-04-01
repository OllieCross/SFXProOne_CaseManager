import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  quantityUsed: z.number().min(0),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; consumableId: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: eventId, consumableId } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const ec = await prisma.eventConsumable.update({
    where: { eventId_consumableId: { eventId, consumableId } },
    data: { quantityUsed: parsed.data.quantityUsed },
  })

  return NextResponse.json(ec)
}
