'use client'

import Link from 'next/link'

type Consumable = {
  id: string
  name: string
  unit: string
  stockQuantity: number
  notes: string | null
}

type Props = {
  consumables: Consumable[]
  canEdit: boolean
}

export default function ConsumableList({ consumables, canEdit }: Props) {
  if (consumables.length === 0) {
    return <p className="text-muted text-sm">No consumables yet.</p>
  }

  return (
    <div className="space-y-2">
      {consumables.map((c) => (
        <div key={c.id} className="card flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{c.name}</p>
            <p className="text-muted text-xs mt-0.5">
              {c.stockQuantity} {c.unit} in stock
              {c.notes && <> &middot; {c.notes}</>}
            </p>
          </div>
          {canEdit && (
            <div className="flex items-center justify-end gap-2 w-20 shrink-0">
              <Link href={`/consumables/${c.id}/edit`} className="btn-primary text-xs py-1.5 px-3">
                Edit
              </Link>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
