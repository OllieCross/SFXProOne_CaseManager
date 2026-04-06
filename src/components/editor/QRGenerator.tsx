'use client'

import { useState, useRef, useCallback } from 'react'
import QRCode from 'qrcode'

const QR_SIZE = 1024
const FOOTER_HEIGHT = 120
const CANVAS_WIDTH = QR_SIZE
const CANVAS_HEIGHT = QR_SIZE + FOOTER_HEIGHT
const TEXT_PADDING = 60 // px of horizontal padding on each side
const MAX_FONT_SIZE = 80
const RANDOM_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function fitFontSize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxSize: number): number {
  let size = maxSize
  ctx.font = `bold ${size}px "Helvetica Neue", Helvetica, Arial, sans-serif`
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 1
    ctx.font = `bold ${size}px "Helvetica Neue", Helvetica, Arial, sans-serif`
  }
  return size
}

function randomString(length = 20) {
  let result = ''
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  for (const byte of array) {
    result += RANDOM_CHARS[byte % RANDOM_CHARS.length]
  }
  return result
}

export default function QRGenerator() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [generated, setGenerated] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generate = useCallback(async () => {
    const value = text.trim() || randomString()
    if (!text.trim()) setText(value)

    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT
    const ctx = canvas.getContext('2d')!

    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // QR code drawn into a temp canvas then composited
    const qrCanvas = document.createElement('canvas')
    await QRCode.toCanvas(qrCanvas, value, {
      width: QR_SIZE,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    })

    ctx.drawImage(qrCanvas, 0, 0)

    // Footer text - fit to canvas width with padding
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    fitFontSize(ctx, value, CANVAS_WIDTH - TEXT_PADDING * 2, MAX_FONT_SIZE)
    ctx.fillText(value, CANVAS_WIDTH / 2, QR_SIZE + FOOTER_HEIGHT / 2)

    setGenerated(true)
  }, [text])

  function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `${text.trim() || 'qrcode'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  function reset() {
    setText('')
    setGenerated(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary text-sm">
        QR Generator
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={() => { setOpen(false); reset() }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="card w-full max-w-sm space-y-5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base">QR Generator</h2>
            <button
              onClick={() => { setOpen(false); reset() }}
              className="text-muted hover:text-foreground text-xl leading-none transition-colors"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {/* Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted">
              Code text <span className="text-muted/60">(leave blank to auto-generate)</span>
            </label>
            <input
              type="text"
              maxLength={30}
              className="input-field font-mono"
              placeholder="e.g. RACK-A1 or leave blank"
              value={text}
              onChange={(e) => { setText(e.target.value.toUpperCase()); setGenerated(false) }}
            />
            <p className="text-right text-xs text-muted">{text.length}/30</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={generate} className="btn-primary text-sm flex-1">
              Generate QR
            </button>
            {generated && (
              <button onClick={download} className="btn-primary text-sm flex-1">
                Download QR code
              </button>
            )}
          </div>

          {/* Canvas - always mounted so the ref is stable across renders */}
          <div className={`rounded-lg overflow-hidden border border-foreground/10 ${generated ? '' : 'hidden'}`}>
            <canvas ref={canvasRef} className="w-full h-auto" />
          </div>
        </div>
      </div>
    </>
  )
}
