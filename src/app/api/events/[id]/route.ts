import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  venueName: z.string().min(1).max(200).optional(),
  location: z.string().optional().nullable(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  clientPhone: z.string().optional().nullable(),
  clientEmail: z.string().email().optional().nullable().or(z.literal('')),
  comments: z.string().optional().nullable(),
  status: z.enum(['Planned', 'Confirmed', 'Completed', 'Cancelled', 'NeedsDetails']).optional(),
  invoiceStatus: z.enum(['Paid', 'NotPaid', 'DepositPaid', 'DepositNotYetPaid', 'NotPaidInFull']).optional(),
})

const eventInclude = {
  stagehands: { include: { user: { select: { id: true, name: true, email: true } } } },
  cases: { include: { case: { select: { id: true, name: true, qrdata: true } } } },
  devices: { include: { device: { select: { id: true, name: true, status: true } } } },
  items: { include: { item: { select: { id: true, name: true, quantity: true } } } },
  consumables: { include: { consumable: { select: { id: true, name: true, unit: true } } } },
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const event = await prisma.event.findUnique({ where: { id }, include: eventInclude })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(event)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { startDate, endDate, clientEmail, ...rest } = parsed.data
  const event = await prisma.event.update({
    where: { id },
    data: {
      ...rest,
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
      ...(clientEmail !== undefined ? { clientEmail: clientEmail || null } : {}),
    },
    include: eventInclude,
  })

  const auditAction = parsed.data.status === 'Completed' ? 'EVENT_COMPLETED' as const : 'EVENT_UPDATED' as const
  await logAudit(auditAction, session.user.id, id, { name: event.name })

  // If event was just completed, decrement consumable stock
  if (parsed.data.status === 'Completed') {
    const consumables = await prisma.eventConsumable.findMany({ where: { eventId: id } })
    for (const ec of consumables) {
      if (ec.quantityUsed != null) {
        await prisma.consumable.update({
          where: { id: ec.consumableId },
          data: { stockQuantity: { decrement: ec.quantityUsed } },
        })
      }
    }
  }

  return NextResponse.json(event)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await prisma.event.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
