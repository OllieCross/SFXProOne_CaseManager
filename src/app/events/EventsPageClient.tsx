'use client'

import Link from 'next/link'

const EVENT_STATUS_LABELS: Record<string, string> = {
  Planned: 'Planned', Confirmed: 'Confirmed', Completed: 'Completed',
  Cancelled: 'Cancelled', NeedsDetails: 'Needs Details',
}
const STATUS_COLORS: Record<string, string> = {
  Planned: 'text-blue-400', Confirmed: 'text-green-400', Completed: 'text-muted',
  Cancelled: 'text-red-400', NeedsDetails: 'text-yellow-400',
}
const INVOICE_LABELS: Record<string, string> = {
  Paid: 'Paid', NotPaid: 'Not Paid', DepositPaid: 'Deposit Paid',
  DepositNotYetPaid: 'Deposit Not Yet Paid', NotPaidInFull: 'Not Paid in Full',
}
const INVOICE_COLORS: Record<string, string> = {
  Paid: 'text-green-400', NotPaid: 'text-red-400', DepositPaid: 'text-yellow-400',
  DepositNotYetPaid: 'text-yellow-400', NotPaidInFull: 'text-orange-400',
}

type EventRow = {
  id: string
  name: string
  venueName: string
  location: string | null
  startDate: string
  status: string
  invoiceStatus: string
  stagehands: { userId: string; userName: string }[]
}

type Props = {
  events: EventRow[]
  canEdit: boolean
  userId: string
  todayISO: string
  tomorrowISO: string
}

function formatStartDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function EventsPageClient({ events, canEdit, userId, todayISO, tomorrowISO }: Props) {
  const todayStart = new Date(todayISO).getTime()
  const tomorrowEnd = new Date(tomorrowISO).getTime()

  function isHighlighted(event: EventRow) {
    const start = new Date(event.startDate).getTime()
    const isUserCrew = event.stagehands.some((s) => s.userId === userId)
    const isTodayOrTomorrow = start >= todayStart && start < tomorrowEnd
    return isUserCrew && isTodayOrTomorrow
  }

  const sorted = [...events].sort((a, b) => {
    const aH = isHighlighted(a) ? 0 : 1
    const bH = isHighlighted(b) ? 0 : 1
    return aH - bH
  })

  return (
    <div className="space-y-3">
      {sorted.map((event) => {
        const highlighted = isHighlighted(event)
        return (
          <div
            key={event.id}
            className="card space-y-2"
            style={highlighted ? {
              boxShadow: '0 0 0 1px rgba(255,255,255,0.85), 0 0 6px 1px rgba(255,255,255,0.3)',
            } : undefined}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium truncate">{event.name}</p>
                <p className="text-sm text-muted truncate">{event.venueName}{event.location ? ` - ${event.location}` : ''}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href={`/events/${event.id}`} className="btn-ghost text-sm px-3 py-1.5">View</Link>
                {canEdit && (
                  <Link href={`/events/${event.id}/edit`} className="btn-ghost text-sm px-3 py-1.5">Edit</Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs flex-wrap">
              <span className="text-muted">{formatStartDateTime(event.startDate)}</span>
              <span className={STATUS_COLORS[event.status] ?? 'text-muted'}>
                {EVENT_STATUS_LABELS[event.status] ?? event.status}
              </span>
              <span className={INVOICE_COLORS[event.invoiceStatus] ?? 'text-muted'}>
                {INVOICE_LABELS[event.invoiceStatus] ?? event.invoiceStatus}
              </span>
            </div>

            {event.stagehands.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {event.stagehands.map((s) => (
                  <span
                    key={s.userId}
                    className="text-xs bg-foreground/10 text-foreground/80 px-2 py-0.5 rounded-full"
                  >
                    {s.userName}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
