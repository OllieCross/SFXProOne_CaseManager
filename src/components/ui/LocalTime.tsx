'use client'

export default function LocalTime({ iso }: { iso: string }) {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return <>{time}</>
}
