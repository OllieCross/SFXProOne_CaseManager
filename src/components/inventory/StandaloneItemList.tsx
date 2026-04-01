import Link from 'next/link'

type StandaloneItem = {
  id: string
  name: string
  quantity: number
  comment: string | null
}

type Props = {
  items: StandaloneItem[]
  canEdit: boolean
}

export default function StandaloneItemList({ items, canEdit }: Props) {
  if (items.length === 0) {
    return <p className="text-muted text-sm">No standalone items yet.</p>
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="card flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{item.name}</p>
            <p className="text-xs text-muted">
              Qty: {item.quantity}
              {item.comment ? ` - ${item.comment}` : ''}
            </p>
          </div>
          {canEdit && (
            <div className="flex gap-2 shrink-0 w-20 justify-end">
              <Link href={`/items/${item.id}/edit`} className="btn-ghost text-sm px-3 py-1.5">Edit</Link>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
