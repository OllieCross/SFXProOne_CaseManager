import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rateLimit'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  qrCode: z.string().min(1),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  status: z.enum(['Working', 'Faulty', 'InRepair', 'Retired', 'Lost', 'RentedToFriend']).default('Working'),
  caseId: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const devices = await prisma.device.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      case: { select: { id: true, name: true } },
      _count: { select: { images: true, documents: true, logbook: true } },
    },
  })

  return NextResponse.json(devices)
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

  const { name, qrCode, serialNumber, purchaseDate, status, caseId, notes } = parsed.data

  const existing = await prisma.device.findUnique({ where: { qrCode } })
  if (existing) {
    return NextResponse.json({ error: 'QR code already assigned to another device' }, { status: 409 })
  }

  const device = await prisma.device.create({
    data: {
      name,
      qrCode,
      serialNumber: serialNumber || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      status,
      caseId: caseId || null,
      notes: notes || null,
    },
  })

  await logAudit('DEVICE_CREATED', session.user.id, device.id, { deviceName: device.name })

  return NextResponse.json(device, { status: 201 })
}
