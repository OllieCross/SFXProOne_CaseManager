'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export default function UpdateSnackbar() {
  const { data: session } = useSession()
  const [version, setVersion] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    if (!session) return

    fetch('/api/version')
      .then((r) => r.json())
      .then(({ version: latest }: { version: string | null }) => {
        if (!latest) return
        const seen = localStorage.getItem('seenVersion')
        if (seen !== latest) {
          setVersion(latest)
          setVisible(true)
          localStorage.setItem('seenVersion', latest)
        }
      })
  }, [session])

  function dismiss() {
    setHiding(true)
    setTimeout(() => setVisible(false), 300)
  }

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(dismiss, 6000)
    return () => clearTimeout(t)
  }, [visible])

  if (!visible) return null

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        hiding ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="flex items-center gap-3 bg-brand text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
        <span>App updated to {version}</span>
        <button
          onClick={dismiss}
          className="text-white/70 hover:text-white transition-colors text-xs leading-none"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  )
}
