'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ui/ConfirmModal'

type MemberType = 'case' | 'device' | 'item' | 'consumable'

type CaseOption = { id: string; name: string }
type DeviceOption = { id: string; name: string; status: string }
type ItemOption = { id: string; name: string; quantity: number }
type ConsumableOption = { id: string; name: string; unit: string }

type GroupMember =
  | { type: 'case'; id: string; name: string }
  | { type: 'device'; id: string; name: string; status: string }
  | { type: 'item'; id: string; name: string; quantity: number }
  | { type: 'consumable'; id: string; name: string; unit: string; quantityNeeded: number }

type Props = {
  mode: 'create' | 'edit'
  groupId?: string
  initialData?: {
    name: string
    members: GroupMember[]
  }
  allCases: CaseOption[]
  allDevices: DeviceOption[]
  allItems: ItemOption[]
  allConsumables: ConsumableOption[]
}

const STATUS_LABELS: Record<string, string> = {
  Working: 'Working', Faulty: 'Faulty', InRepair: 'In Repair',
  Retired: 'Retired', Lost: 'Lost', RentedToFriend: 'Rented',
}

export default function GroupForm({ mode, groupId, initialData, allCases, allDevices, allItems, allConsumables }: Props) {
  const router = useRouter()

  const [name, setName] = useState(initialData?.name ?? '')
  const [members, setMembers] = useState<GroupMember[]>(initialData?.members ?? [])

  // Add-member panel state
  const [addType, setAddType] = useState<MemberType>('case')
  const [addId, setAddId] = useState('')
  const [addQtyRaw, setAddQtyRaw] = useState('1')
  const [addQtyError, setAddQtyError] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!groupId) return
    setDeleting(true)
    await fetch(`/api/groups/${groupId}`, { method: 'DELETE' })
    router.push('/groups')
    router.refresh()
  }

  // ---------- Helpers ----------

  function isMember(type: MemberType, id: string) {
    return members.some((m) => m.type === type && m.id === id)
  }

  async function patchMember(action: 'add' | 'remove', type: MemberType, memberId: string, quantityNeeded?: number) {
    if (!groupId) return
    await fetch(`/api/groups/${groupId}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, type, memberId, quantityNeeded }),
    })
  }

  function addMember() {
    if (!addId) return
    if (isMember(addType, addId)) return

    let member: GroupMember

    if (addType === 'case') {
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
      const qty = parseInt(addQtyRaw)
      if (!Number.isInteger(qty) || qty < 1) {
        setAddQtyError('Enter a valid whole number.')
        return
      }
      if (qty > opt.quantity) {
        setAddQtyError(`Only ${opt.quantity} available.`)
        return
      }
      member = { type: 'item', id: opt.id, name: opt.name, quantity: qty }
    } else {
      const opt = allConsumables.find((c) => c.id === addId)
      if (!opt) return
      const normalized = addQtyRaw.replace(',', '.')
      const qty = Number(normalized)
      if (!Number.isFinite(qty) || qty <= 0 || !/^\d+([.,]\d{1,2})?$/.test(addQtyRaw.trim())) {
        setAddQtyError('Enter a valid number (e.g. 1, 1.5, 0.25).')
        return
      }
      member = { type: 'consumable', id: opt.id, name: opt.name, unit: opt.unit, quantityNeeded: qty }
    }

    const parsedQty = addType === 'item' ? parseInt(addQtyRaw) : addType === 'consumable' ? Number(addQtyRaw.replace(',', '.')) : undefined
    setMembers((prev) => [...prev, member])
    if (mode === 'edit') patchMember('add', addType, addId, parsedQty)
    setAddId('')
    setAddQtyRaw('1')
    setAddQtyError('')
  }

  function removeMember(type: MemberType, id: string) {
    setMembers((prev) => prev.filter((m) => !(m.type === type && m.id === id)))
    if (mode === 'edit') patchMember('remove', type, id)
  }

  // ---------- Submit ----------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      let id = groupId

      if (mode === 'create') {
        const res = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Failed to create group')
        }
        const created = await res.json()
        id = created.id

        // Add all members
        await Promise.all(
          members.map((m) =>
            fetch(`/api/groups/${id}/members`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'add',
                type: m.type,
                memberId: m.id,
                quantityNeeded: m.type === 'consumable' ? m.quantityNeeded : m.type === 'item' ? m.quantity : undefined,
              }),
            })
          )
        )
      } else {
        const res = await fetch(`/api/groups/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? 'Failed to update group')
        }
      }

      router.push('/groups')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  // ---------- Render ----------

  const availableOptions = () => {
    if (addType === 'case') return allCases.filter((c) => !isMember('case', c.id))
    if (addType === 'device') return allDevices.filter((d) => !isMember('device', d.id))
    if (addType === 'item') return allItems.filter((i) => !isMember('item', i.id))
    return allConsumables.filter((c) => !isMember('consumable', c.id))
  }

  const caseMembers = members.filter((m): m is Extract<GroupMember, { type: 'case' }> => m.type === 'case')
  const deviceMembers = members.filter((m): m is Extract<GroupMember, { type: 'device' }> => m.type === 'device')
  const itemMembers = members.filter((m): m is Extract<GroupMember, { type: 'item' }> => m.type === 'item')
  const consumableMembers = members.filter((m): m is Extract<GroupMember, { type: 'consumable' }> => m.type === 'consumable')

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Name */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Details</h2>
        <div>
          <label className="block text-sm font-medium mb-1.5">Group Name *</label>
          <input
            type="text"
            required
            className="input-field"
            placeholder="e.g. Small Lights Package"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </section>

      {/* Add member panel */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Add Members</h2>
        <div className="card space-y-3">
          <div className="flex gap-2 flex-wrap">
            {(['case', 'device', 'item', 'consumable'] as MemberType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setAddType(t); setAddId(''); setAddQtyRaw('1'); setAddQtyError('') }}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${addType === t ? 'border-brand text-brand' : 'border-foreground/10 text-muted hover:text-foreground'}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <select
              className="input-field"
              value={addId}
              onChange={(e) => setAddId(e.target.value)}
            >
              <option value="">-- Select {addType} --</option>
              {availableOptions().map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                  {'status' in opt ? ` (${STATUS_LABELS[opt.status as string] ?? String(opt.status)})` : ''}
                  {'quantity' in opt ? ` (${(opt as ItemOption).quantity}pcs)` : ''}
                </option>
              ))}
            </select>

            {(addType === 'item' || addType === 'consumable') && (
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  inputMode={addType === 'consumable' ? 'decimal' : 'numeric'}
                  className={`input-field ${addQtyError ? 'border-red-500' : ''}`}
                  placeholder="Qty"
                  value={addQtyRaw}
                  onChange={(e) => { setAddQtyRaw(e.target.value); setAddQtyError('') }}
                />
                {addQtyError && <p className="text-red-400 text-xs">{addQtyError}</p>}
              </div>
            )}

            <button
              type="button"
              onClick={addMember}
              disabled={!addId}
              className="btn-primary text-sm w-full h-[42px]"
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
            Members ({members.length})
          </h2>

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
                <MemberRow key={m.id} label={`${m.name} - ${STATUS_LABELS[m.status] ?? m.status}`} onRemove={() => removeMember('device', m.id)} />
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

      <div className="flex gap-3 flex-wrap">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : mode === 'create' ? 'Create Group' : 'Save Changes'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
        {mode === 'edit' && (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="ml-auto bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Delete Group
          </button>
        )}
      </div>

      {showDelete && (
        <ConfirmModal
          title="Delete group"
          message={`Are you sure you want to delete "${initialData?.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          loading={deleting}
        />
      )}
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
