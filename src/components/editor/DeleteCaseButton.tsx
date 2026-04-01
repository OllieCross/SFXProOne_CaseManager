'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ui/ConfirmModal'

type Props = { caseId: string; caseName: string }

export default function DeleteCaseButton({ caseId, caseName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/cases/${caseId}`, { method: 'DELETE' })
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
      >
        Delete
      </button>
      {open && (
        <ConfirmModal
          title="Delete case"
          message={`Are you sure you want to delete "${caseName}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setOpen(false)}
          loading={loading}
        />
      )}
    </>
  )
}
