import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import RoleSelector from '@/components/admin/RoleSelector'
import CreateUserButton from '@/components/admin/CreateUserButton'
import DeleteUserButton from '@/components/admin/DeleteUserButton'
import ClearAuditLogsButton from '@/components/admin/ClearAuditLogsButton'
import LocalTime from '@/components/ui/LocalTime'
import { formatDate } from '@/lib/utils'

const ACTION_LABEL: Record<string, string> = {
  CASE_CREATED:             'Created case',
  CASE_UPDATED:             'Updated case',
  CASE_DELETED:             'Deleted case',
  IMAGE_UPLOADED:           'Uploaded image',
  IMAGE_DELETED:            'Deleted image',
  DOCUMENT_UPLOADED:        'Uploaded document',
  DOCUMENT_DELETED:         'Deleted document',
  ITEM_CREATED:             'Created item',
  ITEM_UPDATED:             'Updated item',
  ITEM_DELETED:             'Deleted item',
  ITEM_MOVED:               'Moved item',
  ROLE_CHANGED:             'Changed role',
  DEVICE_CREATED:           'Created device',
  DEVICE_UPDATED:           'Updated device',
  DEVICE_DELETED:           'Deleted device',
  LOGBOOK_ENTRY_ADDED:      'Added logbook entry',
  CONSUMABLE_CREATED:       'Created consumable',
  CONSUMABLE_UPDATED:       'Updated consumable',
  CONSUMABLE_STOCK_ADJUSTED:'Adjusted consumable stock',
  GROUP_CREATED:            'Created group',
  GROUP_UPDATED:            'Updated group',
  GROUP_DELETED:            'Deleted group',
  EVENT_CREATED:            'Created event',
  EVENT_UPDATED:            'Updated event',
  EVENT_COMPLETED:          'Completed event',
  TANK_CREATED:             'Created tank',
  TANK_UPDATED:             'Updated tank',
  TANK_DELETED:             'Deleted tank',
  TANK_LOGBOOK_ENTRY_ADDED: 'Added tank logbook entry',
  PYRO_CREATED:             'Created pyro effect',
  PYRO_UPDATED:             'Updated pyro effect',
  PYRO_DELETED:             'Deleted pyro effect',
  PYRO_STOCK_ADJUSTED:      'Adjusted pyro stock',
}

function auditDetail(action: string, meta: Record<string, unknown> | null): string {
  if (!meta) return ''
  switch (action) {
    case 'CASE_CREATED':
    case 'CASE_UPDATED':
    case 'CASE_DELETED':
      return (meta.caseName as string) ?? ''
    case 'IMAGE_UPLOADED':
    case 'IMAGE_DELETED':
      return (meta.fileName as string) ?? ''
    case 'DOCUMENT_UPLOADED':
    case 'DOCUMENT_DELETED':
      return (meta.title as string) ?? (meta.fileName as string) ?? ''
    case 'ITEM_CREATED':
    case 'ITEM_UPDATED':
    case 'ITEM_DELETED':
    case 'ITEM_MOVED':
      return (meta.itemName as string) ?? ''
    case 'ROLE_CHANGED':
      return `${meta.targetName}: ${meta.oldRole} -> ${meta.newRole}`
    case 'DEVICE_CREATED':
    case 'DEVICE_UPDATED':
    case 'DEVICE_DELETED':
      return (meta.deviceName as string) ?? ''
    case 'LOGBOOK_ENTRY_ADDED':
      return (meta.comment as string) ?? ''
    case 'CONSUMABLE_CREATED':
    case 'CONSUMABLE_UPDATED':
    case 'CONSUMABLE_STOCK_ADJUSTED':
      return (meta.name as string) ?? ''
    case 'GROUP_CREATED':
    case 'GROUP_UPDATED':
    case 'GROUP_DELETED':
      return (meta.name as string) ?? ''
    case 'EVENT_CREATED':
    case 'EVENT_UPDATED':
    case 'EVENT_COMPLETED':
      return (meta.name as string) ?? ''
    case 'TANK_CREATED':
    case 'TANK_UPDATED':
    case 'TANK_DELETED':
    case 'TANK_LOGBOOK_ENTRY_ADDED':
      return (meta.name as string) ?? ''
    case 'PYRO_CREATED':
    case 'PYRO_UPDATED':
    case 'PYRO_DELETED':
    case 'PYRO_STOCK_ADJUSTED':
      return (meta.name as string) ?? ''
    default:
      return ''
  }
}

export default async function AdminPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/scan')

  const [users, auditLogs] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { user: { select: { name: true } } },
    }),
  ])

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-10">
        <section>
          <div className="mb-5">
            <h1 className="text-xl font-bold mb-1">Admin Panel</h1>
            <p className="text-sm text-gray-400">Manage users and their access roles.</p>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <CreateUserButton />
            <Link href="/admin/recycle-bin" className="btn-ghost text-sm flex items-center gap-1.5 ml-auto">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
              Recycle Bin
            </Link>
          </div>

          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-foreground/10 text-left text-gray-400">
                  <th className="px-3 py-2.5 font-medium">Name</th>
                  <th className="px-3 py-2.5 font-medium">Joined</th>
                  <th className="px-3 py-2.5 font-medium">Role</th>
                  <th className="px-3 py-2.5 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr
                    key={user.id}
                    className={i < users.length - 1 ? 'border-b border-foreground/5' : ''}
                  >
                    <td className="px-3 py-2.5 font-medium">{user.name}</td>
                    <td className="px-3 py-2.5 text-gray-400 text-xs">{formatDate(user.createdAt)}</td>
                    <td className="px-3 py-2.5">
                      <RoleSelector
                        userId={user.id}
                        currentRole={user.role}
                        isSelf={user.id === session.user.id}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {user.id !== session.user.id && (
                        <DeleteUserButton userId={user.id} userName={user.name ?? user.email} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3 mb-1">
            <h2 className="text-lg font-semibold">Audit Log</h2>
            <ClearAuditLogsButton />
          </div>
          <p className="text-sm text-gray-400 mb-4">Last 100 events, most recent first.</p>

          {auditLogs.length === 0 ? (
            <div className="card flex items-center justify-center py-12 text-gray-500 text-sm">
              No events recorded yet.
            </div>
          ) : (() => {
            const today = new Date(); today.setHours(0,0,0,0)
            const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
            function dayLabel(d: Date) {
              const day = new Date(d); day.setHours(0,0,0,0)
              if (day.getTime() === today.getTime()) return 'Today'
              if (day.getTime() === yesterday.getTime()) return 'Yesterday'
              const dd = day.getDate().toString().padStart(2, '0')
              const mm = (day.getMonth() + 1).toString().padStart(2, '0')
              return `${dd}/${mm}/${day.getFullYear()}`
            }
            let lastLabel = ''
            return (
              <div className="space-y-1">
                {auditLogs.map((log) => {
                  const label = dayLabel(log.createdAt)
                  const showLabel = label !== lastLabel
                  lastLabel = label
                  const detail = auditDetail(log.action, log.meta as Record<string, unknown> | null)
                  return (
                    <>
                      {showLabel && (
                        <p key={`label-${label}`} className="text-xs font-semibold text-muted uppercase tracking-wider pt-3 pb-1 px-1">
                          {label}
                        </p>
                      )}
                      <div key={log.id} className="card py-2.5 px-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{ACTION_LABEL[log.action] ?? log.action}</p>
                          <p className="text-xs text-muted shrink-0"><LocalTime iso={log.createdAt.toISOString()} /></p>
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {log.user?.name ?? 'Deleted user'}{detail ? ` · ${detail}` : ''}
                        </p>
                      </div>
                    </>
                  )
                })}
              </div>
            )
          })()}
        </section>
      </main>
    </>
  )
}
