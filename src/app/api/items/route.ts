import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).default(1),
  comment: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await prisma.item.findMany({
    where: { caseId: null },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(items)
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

  const item = await prisma.item.create({
    data: {
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      comment: parsed.data.comment,
      // caseId left null = standalone item
    },
  })

  return NextResponse.json(item, { status: 201 })
}
