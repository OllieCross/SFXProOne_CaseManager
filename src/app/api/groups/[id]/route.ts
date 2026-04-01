import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

const updateSchema = z.object({
  name: z.string().min(1).max(100),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      cases: { include: { case: { select: { id: true, name: true } } } },
      devices: { include: { device: { select: { id: true, name: true, status: true } } } },
      items: { include: { item: { select: { id: true, name: true, quantity: true } } } },
      consumables: { include: { consumable: { select: { id: true, name: true, unit: true } } } },
    },
  })

  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(group)
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

  const group = await prisma.group.update({ where: { id }, data: { name: parsed.data.name } })
  await logAudit('GROUP_UPDATED', session.user.id, id, { name: group.name })

  return NextResponse.json(group)
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const group = await prisma.group.findUnique({ where: { id }, select: { name: true } })
  await prisma.group.delete({ where: { id } })
  await logAudit('GROUP_DELETED', session.user.id, id, { name: group?.name })

  return NextResponse.json({ ok: true })
}
