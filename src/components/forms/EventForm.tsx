'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type MemberType = 'stagehand' | 'case' | 'device' | 'item' | 'consumable'

type UserOption = { id: string; name: string; email: string }
type CaseOption = { id: string; name: string }
type DeviceOption = { id: string; name: string; status: string }
type ItemOption = { id: string; name: string; quantity: number }
type ConsumableOption = { id: string; name: string; unit: string }
type GroupOption = { id: string; name: string }

type EventMember =
  | { type: 'stagehand'; id: string; name: string; email: string }
  | { type: 'case'; id: string; name: string }
  | { type: 'device'; id: string; name: string; status: string }
  | { type: 'item'; id: string; name: string; quantity: number }
  | { type: 'consumable'; id: string; name: string; unit: string; quantityNeeded: number }

type Props = {
  mode: 'create' | 'edit'
  eventId?: string
  initialData?: {
    name: string
    venueName: string
    location: string
    startDate: string
    endDate: string
    clientPhone: string
    clientEmail: string
    comments: string
    status: string
    invoiceStatus: string
    members: EventMember[]
  }
  allUsers: UserOption[]
  allCases: CaseOption[]
  allDevices: DeviceOption[]
  allItems: ItemOption[]
  allConsumables: ConsumableOption[]
  allGroups: GroupOption[]
}

const STATUS_LABELS: Record<string, string> = {
  Working: 'Working', Faulty: 'Faulty', InRepair: 'In Repair',
  Retired: 'Retired', Lost: 'Lost', RentedToFriend: 'Rented to Friend',
}

const EVENT_STATUSES = ['Planned', 'Confirmed', 'Completed', 'Cancelled', 'NeedsDetails'] as const
const INVOICE_STATUSES = ['Paid', 'NotPaid', 'DepositPaid', 'DepositNotYetPaid', 'NotPaidInFull'] as const

const EVENT_STATUS_LABELS: Record<string, string> = {
  Planned: 'Planned', Confirmed: 'Confirmed', Completed: 'Completed',
  Cancelled: 'Cancelled', NeedsDetails: 'Needs Details',
}
const INVOICE_STATUS_LABELS: Record<string, string> = {
  Paid: 'Paid', NotPaid: 'Not Paid', DepositPaid: 'Deposit Paid',
  DepositNotYetPaid: 'Deposit Not Yet Paid', NotPaidInFull: 'Not Paid in Full',
}

// Format datetime-local input value
function toDatetimeLocal(iso: string) {
  if (!iso) return ''
  return iso.slice(0, 16)
}

export default function EventForm({
  mode, eventId, initialData, allUsers, allCases, allDevices, allItems, allConsumables, allGroups,
}: Props) {
  const router = useRouter()

  const [name, setName] = useState(initialData?.name ?? '')
  const [venueName, setVenueName] = useState(initialData?.venueName ?? '')
  const [location, setLocation] = useState(initialData?.location ?? '')
  const [startDate, setStartDate] = useState(toDatetimeLocal(initialData?.startDate ?? ''))
  const [endDate, setEndDate] = useState(toDatetimeLocal(initialData?.endDate ?? ''))
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone ?? '')
  const [clientEmail, setClientEmail] = useState(initialData?.clientEmail ?? '')
  const [comments, setComments] = useState(initialData?.comments ?? '')
  const [status, setStatus] = useState(initialData?.status ?? 'Planned')
  const [invoiceStatus, setInvoiceStatus] = useState(initialData?.invoiceStatus ?? 'NotPaid')
  const [members, setMembers] = useState<EventMember[]>(initialData?.members ?? [])

  // Add-member panel state
  const [addType, setAddType] = useState<MemberType>('stagehand')
  const [addId, setAddId] = useState('')
  const [addQty, setAddQty] = useState(1)

  const [groupId, setGroupId] = useState('')
  const [addingGroup, setAddingGroup] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // ---------- Helpers ----------

  function isMember(type: MemberType, id: string) {
    return members.some((m) => m.type === type && m.id === id)
  }

  async function patchMember(action: 'add' | 'remove', type: MemberType, memberId: string, quantityNeeded?: number) {
    if (!eventId) return
    await fetch(`/api/events/${eventId}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, type, memberId, quantityNeeded }),
    })
  }

  function addMember() {
    if (!addId) return
    if (isMember(addType, addId)) return

    let member: EventMember

    if (addType === 'stagehand') {
      const opt = allUsers.find((u) => u.id === addId)
      if (!opt) return
      member = { type: 'stagehand', id: opt.id, name: opt.name, email: opt.email }
    } else if (addType === 'case') {
      const opt = allCases.find((c) => c.id === addId)
      if (!opt) return
      member = { type: 'case', id: opt.id, name: opt.name }
    } else if (addType === 'device') {
      const opt = allDevices.find((d) => d.id === addId)
      if (!opt) return
      member = { type: 'device', id: opt.id, name: opt.name, status: opt.status }
    } else if (addType === 'item') {
      const opt = allItems.find((i) => i.id === addId)
      if (!opt) return
      member = { type: 'item', id: opt.id, name: opt.name, quantity: opt.quantity }
    } else {
      const opt = allConsumables.find((c) => c.id === addId)
      if (!opt) return
      member = { type: 'consumable', id: opt.id, name: opt.name, unit: opt.unit, quantityNeeded: addQty }
    }

    setMembers((prev) => [...prev, member])
    if (mode === 'edit') patchMember('add', addType, addId, addType === 'consumable' ? addQty : undefined)
    setAddId('')
    setAddQty(1)
  }

  function removeMember(type: MemberType, id: string) {
    setMembers((prev) => prev.filter((m) => !(m.type === type && m.id === id)))
    if (mode === 'edit') patchMember('remove', type, id)
  }

  async function handleAddGroup() {
    if (!groupId || !eventId) return
    setAddingGroup(true)
    try {
      const res = await fetch(`/api/events/${eventId}/add-group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      })
      if (!res.ok) throw new Error('Failed to add group')
      // Reload page to get fresh members
      router.refresh()
      window.location.reload()
    } catch {
      setError('Failed to add group')
    } finally {
      setAddingGroup(false)
      setGroupId('')
    }
  }

  // ---------- Submit ----------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name, venueName,
      location: location || undefined,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      clientPhone: clientPhone || undefined,
      clientEmail: clientEmail || undefined,
      comments: comments || undefined,
      status,
      invoiceStatus,
    }

    try {
      let id = eventId

      if (mode === 'create') {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Failed to create event')
        }
        const created = await res.json()
        id = created.id

        // Add all members
        await Promise.all(
          members.map((m) =>
            fetch(`/api/events/${id}/members`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'add',
                type: m.type,
                memberId: m.id,
                quantityNeeded: m.type === 'consumable' ? m.quantityNeeded : undefined,
              }),
            })
          )
        )
      } else {
        const res = await fetch(`/api/events/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Failed to update event')
        }
      }

      router.push(`/events/${id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  // ---------- Filtered options ----------

  function availableOptions() {
    if (addType === 'stagehand') return allUsers.filter((u) => !isMember('stagehand', u.id))
    if (addType === 'case') return allCases.filter((c) => !isMember('case', c.id))
    if (addType === 'device') return allDevices.filter((d) => !isMember('device', d.id))
    if (addType === 'item') return allItems.filter((i) => !isMember('item', i.id))
    return allConsumables.filter((c) => !isMember('consumable', c.id))
  }

  const stagehands = members.filter((m): m is Extract<EventMember, { type: 'stagehand' }> => m.type === 'stagehand')
  const caseMembers = members.filter((m): m is Extract<EventMember, { type: 'case' }> => m.type === 'case')
  const deviceMembers = members.filter((m): m is Extract<EventMember, { type: 'device' }> => m.type === 'device')
  const itemMembers = members.filter((m): m is Extract<EventMember, { type: 'item' }> => m.type === 'item')
  const consumableMembers = members.filter((m): m is Extract<EventMember, { type: 'consumable' }> => m.type === 'consumable')

  // ---------- Render ----------

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Details */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Details</h2>

        <div>
          <label className="block text-sm font-medium mb-1.5">Event Name *</label>
          <input type="text" required className="input-field" placeholder="e.g. New Year Gala 2027"
            value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Venue Name *</label>
          <input type="text" required className="input-field" placeholder="e.g. Opera House Main Stage"
            value={venueName} onChange={(e) => setVenueName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Location</label>
          <input type="text" className="input-field" placeholder="e.g. Vienna, Austria"
            value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Start *</label>
            <input type="datetime-local" required className="input-field"
              value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">End *</label>
            <input type="datetime-local" required className="input-field"
              value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </section>

      {/* Client */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Client</h2>

        <div>
          <label className="block text-sm font-medium mb-1.5">Phone</label>
          <input type="tel" className="input-field" placeholder="+43 123 456 789"
            value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input type="email" className="input-field" placeholder="client@example.com"
            value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
        </div>
      </section>

      {/* Status */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Status</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Event Status</label>
            <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
              {EVENT_STATUSES.map((s) => (
                <option key={s} value={s}>{EVENT_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Invoice Status</label>
            <select className="input-field" value={invoiceStatus} onChange={(e) => setInvoiceStatus(e.target.value)}>
              {INVOICE_STATUSES.map((s) => (
                <option key={s} value={s}>{INVOICE_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Comments / Notes</label>
          <textarea rows={3} className="input-field resize-none" placeholder="Internal notes..."
            value={comments} onChange={(e) => setComments(e.target.value)} />
        </div>
      </section>

      {/* Add Group (edit mode only) */}
      {mode === 'edit' && allGroups.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Add Group Template</h2>
          <div className="card flex gap-2">
            <select className="input-field flex-1" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">-- Select group --</option>
              {allGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddGroup}
              disabled={!groupId || addingGroup}
              className="btn-primary text-sm shrink-0"
            >
              {addingGroup ? 'Adding...' : 'Add Group'}
            </button>
          </div>
        </section>
      )}

      {/* Add member panel */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
          {mode === 'edit' ? 'Add Inventory / Crew' : 'Inventory & Crew'}
        </h2>
        <div className="card space-y-3">
          <div className="flex gap-2 flex-wrap">
            {(['stagehand', 'case', 'device', 'item', 'consumable'] as MemberType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setAddType(t); setAddId('') }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${addType === t ? 'border-brand text-brand' : 'border-white/10 text-muted hover:text-foreground'}`}
              >
                {t === 'stagehand' ? 'Stagehand' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <select className="input-field flex-1" value={addId} onChange={(e) => setAddId(e.target.value)}>
              <option value="">-- Select {addType} --</option>
              {(availableOptions() as Array<{ id: string; name: string; status?: string; email?: string }>).map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                  {opt.email ? ` (${opt.email})` : ''}
                  {opt.status ? ` (${STATUS_LABELS[opt.status] ?? opt.status})` : ''}
                </option>
              ))}
            </select>

            {addType === 'consumable' && (
              <input
                type="number"
                min={0.01}
                step="0.01"
                className="input-field w-24"
                placeholder="Qty"
                value={addQty}
                onChange={(e) => setAddQty(parseFloat(e.target.value) || 1)}
              />
            )}

            <button
              type="button"
              onClick={addMember}
              disabled={!addId}
              className="btn-primary text-sm shrink-0"
            >
              Add
            </button>
          </div>
        </div>
      </section>

      {/* Current members */}
      {members.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
            Crew & Inventory ({members.length})
          </h2>

          {stagehands.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted">Stagehands</p>
              {stagehands.map((m) => (
                <MemberRow key={m.id} label={`${m.name} (${m.email})`} onRemove={() => removeMember('stagehand', m.id)} />
              ))}
            </div>
          )}

          {caseMembers.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted">Cases</p>
              {caseMembers.map((m) => (
                <MemberRow key={m.id} label={m.name} onRemove={() => removeMember('case', m.id)} />
              ))}
            </div>
          )}

          {deviceMembers.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted">Devices</p>
              {deviceMembers.map((m) => (
                <MemberRow key={m.id} label={`${m.name} (${STATUS_LABELS[m.status] ?? m.status})`} onRemove={() => removeMember('device', m.id)} />
              ))}
            </div>
          )}

          {itemMembers.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted">Items</p>
              {itemMembers.map((m) => (
                <MemberRow key={m.id} label={`${m.name} (x${m.quantity})`} onRemove={() => removeMember('item', m.id)} />
              ))}
            </div>
          )}

          {consumableMembers.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted">Consumables</p>
              {consumableMembers.map((m) => (
                <MemberRow key={m.id} label={`${m.name} - ${m.quantityNeeded} ${m.unit}`} onRemove={() => removeMember('consumable', m.id)} />
              ))}
            </div>
          )}
        </section>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Save Changes'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
      </div>
    </form>
  )
}

function MemberRow({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="card flex items-center justify-between gap-3 py-2 px-3">
      <span className="text-sm truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-red-400/60 hover:text-red-400 text-xs transition-colors shrink-0"
      >
        Remove
      </button>
    </div>
  )
}
