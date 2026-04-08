import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  brand: z.string().optional().nullable(),
  category: z.enum(['T1', 'T2', 'F1', 'F2', 'F3', 'F4', 'P1', 'P2', 'Other']).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  warningThreshold: z.number().int().min(0).optional().nullable(),
  criticalThreshold: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const pyro = await prisma.pyro.findUnique({
    where: { id },
    include: {
      images: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
    },
  })

  if (!pyro) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(pyro)
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

  const pyro = await prisma.pyro.update({ where: { id }, data: parsed.data })

  await logAudit('PYRO_UPDATED', session.user.id, pyro.id, { pyroName: pyro.name })

  return NextResponse.json(pyro)
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const pyro = await prisma.pyro.findUnique({ where: { id }, select: { name: true } })
  await prisma.pyro.update({ where: { id }, data: { deletedAt: new Date() } })

  await logAudit('PYRO_DELETED', session.user.id, id, { pyroName: pyro?.name })

  return NextResponse.json({ ok: true })
}
