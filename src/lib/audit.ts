import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export type AuditAction =
  | 'CASE_CREATED'
  | 'CASE_UPDATED'
  | 'CASE_DELETED'
  | 'IMAGE_UPLOADED'
  | 'IMAGE_DELETED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DELETED'
  | 'ITEM_MOVED'
  | 'ROLE_CHANGED'

export async function logAudit(
  action: AuditAction,
  userId: string,
  targetId?: string,
  meta?: Record<string, unknown>
) {
  await prisma.auditLog.create({
    data: { action, userId, targetId, meta: meta as Prisma.InputJsonValue | undefined },
  })
}
