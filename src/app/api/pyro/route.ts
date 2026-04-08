import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rateLimit'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  brand: z.string().optional(),
  category: z.enum(['T1', 'T2', 'F1', 'F2', 'F3', 'F4', 'P1', 'P2', 'Other']).default('Other'),
  stockQuantity: z.number().int().min(0).default(0),
  warningThreshold: z.number().int().min(0).optional(),
  criticalThreshold: z.number().int().min(0).optional(),
  notes: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const pyros = await prisma.pyro.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(pyros)
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

  const pyro = await prisma.pyro.create({ data: parsed.data })

  await logAudit('PYRO_CREATED', session.user.id, pyro.id, { pyroName: pyro.name })

  return NextResponse.json(pyro, { status: 201 })
}
