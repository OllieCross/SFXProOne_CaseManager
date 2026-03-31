import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

type RouteParams = { params: Promise<{ id: string }> }

const schema = z.object({
  title: z.string().min(1).max(100),
  type: z.enum(['Manual', 'Certificate', 'Other', 'Bill', 'Order', 'Invoice', 'ServiceReport']),
  fileKey: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
})

// POST /api/cases/[id]/documents - record a document after it has been uploaded to MinIO
export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

  const document = await prisma.document.create({
    data: { caseId: id, ...parsed.data },
  })

  await prisma.case.update({
    where: { id },
    data: { updatedById: session.user.id },
  })

  await logAudit('DOCUMENT_UPLOADED', session.user.id, id, { title: parsed.data.title, fileName: parsed.data.fileName })

  return NextResponse.json(document, { status: 201 })
}
