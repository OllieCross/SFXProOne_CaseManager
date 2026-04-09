'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Props {
  eventId: string
  eventName: string
}

export default function DeleteEventButton({ eventId, eventName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/events/${eventId}`, { method: 'DELETE' })
    setOpen(false)
    router.push('/events')
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-danger w-full"
      >
        Delete Event
      </button>
      {open && (
        <ConfirmModal
          title="Delete event"
          message={`Are you sure you want to delete "${eventName}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setOpen(false)}
          loading={loading}
        />
      )}
    </>
  )
}
