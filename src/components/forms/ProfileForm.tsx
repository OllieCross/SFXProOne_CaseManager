'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfileForm({
  initialName,
  hasPassword,
}: {
  initialName: string
  hasPassword: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    const body: Record<string, string> = {}
    if (name !== initialName) body.name = name
    if (newPassword) {
      body.currentPassword = currentPassword
      body.newPassword = newPassword
    }

    if (Object.keys(body).length === 0) {
      setError('No changes to save')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to save changes')
        return
      }
      setSuccess('Changes saved. Please sign out and back in to see your updated name.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Display Name</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="input-field"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            maxLength={100}
          />
        </div>
      </div>

      {hasPassword && (
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Change Password</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <input
              type="password"
              className="input-field"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              className="input-field"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              className="input-field"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-400">{success}</p>}

      <button type="submit" className="btn-primary w-full" disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
