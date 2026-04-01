import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

const createSchema = z.object({
  name: z.string().min(1).max(100),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const groups = await prisma.group.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { cases: true, devices: true, items: true, consumables: true } },
    },
  })

  return NextResponse.json(groups)
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

  const group = await prisma.group.create({ data: { name: parsed.data.name } })
  await logAudit('GROUP_CREATED', session.user.id, group.id, { name: group.name })

  return NextResponse.json(group, { status: 201 })
}
