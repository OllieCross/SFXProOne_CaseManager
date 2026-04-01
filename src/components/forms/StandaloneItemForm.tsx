'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  mode: 'create' | 'edit'
  itemId?: string
  initialData?: {
    name: string
    quantity: number
    comment: string
  }
}

export default function StandaloneItemForm({ mode, itemId, initialData }: Props) {
  const router = useRouter()

  const [name, setName] = useState(initialData?.name ?? '')
  const [quantity, setQuantity] = useState(initialData?.quantity ?? 1)
  const [comment, setComment] = useState(initialData?.comment ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name,
      quantity,
      comment: comment || undefined,
    }

    try {
      const res = mode === 'create'
        ? await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/items/${itemId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save item')
      }

      router.push('/editor')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1.5">Item Name *</label>
        <input
          type="text"
          required
          className="input-field"
          placeholder="e.g. Safety goggles"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Quantity</label>
        <input
          type="number"
          min={1}
          step={1}
          className="input-field"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Notes</label>
        <textarea
          rows={3}
          className="input-field resize-none"
          placeholder="Optional notes..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : mode === 'create' ? 'Create Item' : 'Save Changes'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
      </div>
    </form>
  )
}
