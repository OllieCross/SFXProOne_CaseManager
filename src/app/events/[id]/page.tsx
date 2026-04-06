import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'

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
const DEVICE_STATUS_LABELS: Record<string, string> = {
  Working: 'Working', Faulty: 'Faulty', InRepair: 'In Repair',
  Retired: 'Retired', Lost: 'Lost', RentedToFriend: 'Rented to Friend',
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatDateTime(d: Date) {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex gap-3">
      <span className="text-muted text-sm w-28 shrink-0">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      stagehands: { include: { user: { select: { id: true, name: true } } } },
      cases: { include: { case: { select: { id: true, name: true, qrdata: true } } } },
      devices: { include: { device: { select: { id: true, name: true, status: true } } } },
      items: { include: { item: { select: { id: true, name: true, quantity: true, comment: true } } } },
      consumables: { include: { consumable: { select: { id: true, name: true, unit: true } } } },
    },
  })

  if (!event) notFound()

  const canEdit = ['EDITOR', 'ADMIN'].includes(session.user.role)

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-16">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{event.name}</h1>
            <p className="text-muted text-sm mt-0.5">{event.venueName}{event.location ? ` - ${event.location}` : ''}</p>
          </div>
          {canEdit && (
            <Link href={`/events/${id}/edit`} className="btn-ghost text-sm shrink-0">Edit</Link>
          )}
        </div>

        {/* Info card */}
        <div className="card space-y-2">
          <InfoRow label="Start" value={formatDateTime(event.startDate)} />
          <InfoRow label="Status" value={
            <span className={STATUS_COLORS[event.status] ?? ''}>{EVENT_STATUS_LABELS[event.status] ?? event.status}</span>
          } />
          <InfoRow label="Invoice" value={
            <span className={INVOICE_COLORS[event.invoiceStatus] ?? ''}>{INVOICE_LABELS[event.invoiceStatus] ?? event.invoiceStatus}</span>
          } />
          {event.clientName && <InfoRow label="Client" value={event.clientName} />}
          {event.clientPhone && <InfoRow label="Phone" value={event.clientPhone} />}
          {event.clientEmail && <InfoRow label="Email" value={event.clientEmail} />}
          {event.comments && <InfoRow label="Notes" value={event.comments} />}
        </div>

        {/* Crew */}
        {event.stagehands.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Crew ({event.stagehands.length})</h2>
            <div className="space-y-1">
              {event.stagehands.map(({ user }) => (
                <div key={user.id} className="card py-2 px-3">
                  <p className="text-sm font-medium">{user.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cases */}
        {event.cases.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Cases ({event.cases.length})</h2>
            <div className="space-y-1">
              {event.cases.map(({ case: c }) => (
                <div key={c.id} className="card flex items-center justify-between gap-3 py-2 px-3">
                  <p className="text-sm truncate">{c.name}</p>
                  <Link href={`/case/${c.id}`} className="text-xs text-brand hover:underline shrink-0">View</Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Devices */}
        {event.devices.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Devices ({event.devices.length})</h2>
            <div className="space-y-1">
              {event.devices.map(({ device }) => (
                <div key={device.id} className="card flex items-center justify-between gap-3 py-2 px-3">
                  <div>
                    <p className="text-sm">{device.name}</p>
                    <p className="text-xs text-muted">{DEVICE_STATUS_LABELS[device.status] ?? device.status}</p>
                  </div>
                  <Link href={`/devices/${device.id}`} className="text-xs text-brand hover:underline shrink-0">View</Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Items */}
        {event.items.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Items ({event.items.length})</h2>
            <div className="space-y-1">
              {event.items.map(({ item }) => (
                <div key={item.id} className="card py-2 px-3">
                  <p className="text-sm">{item.name} <span className="text-muted">x{item.quantity}</span></p>
                  {item.comment && <p className="text-xs text-muted">{item.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Consumables */}
        {event.consumables.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Consumables ({event.consumables.length})</h2>
            <div className="space-y-1">
              {event.consumables.map(({ consumable, quantityNeeded, quantityUsed }) => (
                <div key={consumable.id} className="card py-2 px-3 space-y-0.5">
                  <p className="text-sm font-medium">{consumable.name}</p>
                  <div className="flex gap-4 text-xs text-muted">
                    <span>Needed: {quantityNeeded} {consumable.unit}</span>
                    {quantityUsed != null && <span>Used: {quantityUsed} {consumable.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </>
  )
}
