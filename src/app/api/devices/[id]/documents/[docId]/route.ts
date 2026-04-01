import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/minio'

type Params = { params: Promise<{ id: string; docId: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { docId } = await params
  const doc = await prisma.deviceDocument.findUnique({ where: { id: docId } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await deleteFile(doc.fileKey)
  await prisma.deviceDocument.delete({ where: { id: docId } })

  return NextResponse.json({ ok: true })
}
