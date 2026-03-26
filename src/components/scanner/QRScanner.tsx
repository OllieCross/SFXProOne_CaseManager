'use client'

import { useEffect, useRef } from 'react'
import type { Html5Qrcode as ScannerType } from 'html5-qrcode'

type Props = {
  onScan: (result: string) => void
}

export default function QRScanner({ onScan }: Props) {
  const scannerRef = useRef<ScannerType | null>(null)

  useEffect(() => {
    let scanner: ScannerType

    async function init() {
      const { Html5Qrcode } = await import('html5-qrcode')

      scanner = new Html5Qrcode('qr-reader')

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decoded) => {
          scanner.stop().catch(() => {})
          onScan(decoded)
        },
        () => {} // suppress per-frame errors
      )

      scannerRef.current = scanner
    }

    init()

    return () => {
      scannerRef.current?.stop().catch(() => {})
    }
  }, [onScan])

  return (
    <div className="w-full">
      <div id="qr-reader" className="w-full" />
    </div>
  )
}
