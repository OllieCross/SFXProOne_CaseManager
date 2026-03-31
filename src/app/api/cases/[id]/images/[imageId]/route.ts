import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteFile } from '@/lib/minio'
import { logAudit } from '@/lib/audit'

type RouteParams = { params: Promise<{ id: string; imageId: string }> }

// DELETE /api/cases/[id]/images/[imageId]
export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, imageId } = await params

  const image = await prisma.image.findUnique({ where: { id: imageId } })
  if (!image || image.caseId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await deleteFile(image.fileKey)
  await prisma.image.delete({ where: { id: imageId } })
  await logAudit('IMAGE_DELETED', session.user.id, id, { fileName: image.fileName })

  return new NextResponse(null, { status: 204 })
}
