import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  unit: z.string().min(1).max(50),
  stockQuantity: z.number().min(0).default(0),
  warningThreshold: z.number().min(0).optional().nullable(),
  criticalThreshold: z.number().min(0).optional().nullable(),
  notes: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const consumables = await prisma.consumable.findMany({
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(consumables)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const consumable = await prisma.consumable.create({ data: parsed.data })
  await logAudit('CONSUMABLE_CREATED', session.user.id, consumable.id, { name: consumable.name })

  return NextResponse.json(consumable, { status: 201 })
}
