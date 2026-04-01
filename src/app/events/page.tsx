import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { prisma } from '@/lib/prisma'

const EVENT_STATUS_LABELS: Record<string, string> = {
  Planned: 'Planned', Confirmed: 'Confirmed', Completed: 'Completed',
  Cancelled: 'Cancelled', NeedsDetails: 'Needs Details',
}

const STATUS_COLORS: Record<string, string> = {
  Planned: 'text-blue-400',
  Confirmed: 'text-green-400',
  Completed: 'text-muted',
  Cancelled: 'text-red-400',
  NeedsDetails: 'text-yellow-400',
}

const INVOICE_LABELS: Record<string, string> = {
  Paid: 'Paid', NotPaid: 'Not Paid', DepositPaid: 'Deposit Paid',
  DepositNotYetPaid: 'Deposit Not Yet Paid', NotPaidInFull: 'Not Paid in Full',
}

const INVOICE_COLORS: Record<string, string> = {
  Paid: 'text-green-400',
  NotPaid: 'text-red-400',
  DepositPaid: 'text-yellow-400',
  DepositNotYetPaid: 'text-yellow-400',
  NotPaidInFull: 'text-orange-400',
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function EventsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const canEdit = ['EDITOR', 'ADMIN'].includes(session.user.role)

  const events = await prisma.event.findMany({
    orderBy: { startDate: 'desc' },
    include: {
      stagehands: { include: { user: { select: { id: true, name: true } } } },
      _count: { select: { cases: true, devices: true, consumables: true } },
    },
  })

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-16">
        <h1 className="text-xl font-bold">Events</h1>

        {canEdit && (
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/events/new" className="btn-primary text-sm">+ New Event</Link>
            <Link href="/groups" className="btn-primary text-sm">Groups</Link>
          </div>
        )}

        {events.length === 0 ? (
          <p className="text-muted text-sm">No events yet.</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="card space-y-2">
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
                  <span className="text-muted">
                    {formatDate(event.startDate)} - {formatDate(event.endDate)}
                  </span>
                  <span className={STATUS_COLORS[event.status] ?? 'text-muted'}>
                    {EVENT_STATUS_LABELS[event.status] ?? event.status}
                  </span>
                  <span className={INVOICE_COLORS[event.invoiceStatus] ?? 'text-muted'}>
                    {INVOICE_LABELS[event.invoiceStatus] ?? event.invoiceStatus}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
                  {event.stagehands.length > 0 && (
                    <span>{event.stagehands.map((s) => s.user.name).join(', ')}</span>
                  )}
                  <span>
                    {[
                      event._count.cases > 0 ? `${event._count.cases} cases` : '',
                      event._count.devices > 0 ? `${event._count.devices} devices` : '',
                      event._count.consumables > 0 ? `${event._count.consumables} consumables` : '',
                    ].filter(Boolean).join(' · ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
