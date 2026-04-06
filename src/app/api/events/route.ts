import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rateLimit'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  venueName: z.string().min(1).max(200),
  location: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  comments: z.string().optional(),
  status: z.enum(['Planned', 'Confirmed', 'Completed', 'Cancelled', 'NeedsDetails']).default('Planned'),
  invoiceStatus: z.enum(['Paid', 'NotPaid', 'DepositPaid', 'DepositNotYetPaid', 'NotPaidInFull']).default('NotPaid'),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const events = await prisma.event.findMany({
    orderBy: { startDate: 'desc' },
    include: {
      stagehands: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { cases: true, devices: true, items: true, consumables: true } },
    },
  })

  return NextResponse.json(events)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { allowed } = await checkRateLimit(`create:${session.user.id}`, 30, 60)
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { clientEmail, ...rest } = parsed.data
  const event = await prisma.event.create({
    data: {
      ...rest,
      startDate: new Date(rest.startDate),
      endDate: new Date(rest.endDate),
      clientEmail: clientEmail || null,
    },
  })
  await logAudit('EVENT_CREATED', session.user.id, event.id, { name: event.name })

  return NextResponse.json(event, { status: 201 })
}
