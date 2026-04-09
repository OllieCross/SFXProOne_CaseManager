import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.auditLog.deleteMany({})
  return NextResponse.json({ ok: true })
}
