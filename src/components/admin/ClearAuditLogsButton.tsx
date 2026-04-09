'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function ClearAuditLogsButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleClear() {
    setLoading(true)
    await fetch('/api/admin/audit-logs', { method: 'DELETE' })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-danger text-sm"
      >
        Clear Logs
      </button>
      {open && (
        <ConfirmModal
          title="Clear audit logs"
          message="Are you sure you want to delete all audit log entries? This cannot be undone."
          confirmLabel="Clear All"
          onConfirm={handleClear}
          onCancel={() => setOpen(false)}
          loading={loading}
        />
      )}
    </>
  )
}
