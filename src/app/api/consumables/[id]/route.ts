import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  unit: z.string().min(1).max(50).optional(),
  stockQuantity: z.number().min(0).optional(),
  warningThreshold: z.number().min(0).optional().nullable(),
  criticalThreshold: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const consumable = await prisma.consumable.findUnique({ where: { id } })
  if (!consumable) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(consumable)
}

export async function PATCH(req: Request, { params }: Params) {
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

  const before = await prisma.consumable.findUnique({ where: { id }, select: { stockQuantity: true } })
  const consumable = await prisma.consumable.update({ where: { id }, data: parsed.data })

  const action = parsed.data.stockQuantity !== undefined && before?.stockQuantity !== parsed.data.stockQuantity
    ? 'CONSUMABLE_STOCK_ADJUSTED' as const
    : 'CONSUMABLE_UPDATED' as const
  await logAudit(action, session.user.id, id, { name: consumable.name })

  return NextResponse.json(consumable)
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const consumable = await prisma.consumable.findUnique({ where: { id }, select: { name: true } })
  if (!consumable) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.consumable.update({ where: { id }, data: { deletedAt: new Date() } })
  await logAudit('CONSUMABLE_UPDATED', session.user.id, id, { name: consumable.name, deleted: true })

  return NextResponse.json({ ok: true })
}
