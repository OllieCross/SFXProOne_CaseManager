'use client'

export default function EventDateTime({ iso }: { iso: string }) {
  const d = new Date(iso)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return <>{`${day}/${month}/${year} at ${time}`}</>
}
