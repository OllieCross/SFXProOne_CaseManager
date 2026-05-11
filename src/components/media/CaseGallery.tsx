'use client'

import { useState, useCallback, useRef } from 'react'

type GalleryImage = {
  url: string
  fileName: string
}

type Props = {
  images: GalleryImage[]
}

export default function CaseGallery({ images }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)

  const pinchStartDist = useRef<number | null>(null)
  const pinchStartScale = useRef(1)
  const dragRef = useRef({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 })
  const lastTapTime = useRef(0)

  const resetZoom = useCallback(() => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const prev = useCallback(() => {
    resetZoom()
    setSelected((s) => (s !== null ? (s > 0 ? s - 1 : images.length - 1) : null))
  }, [images.length, resetZoom])

  const next = useCallback(() => {
    resetZoom()
    setSelected((s) => (s !== null ? (s < images.length - 1 ? s + 1 : 0) : null))
  }, [images.length, resetZoom])

  const handleClose = useCallback(() => {
    resetZoom()
    setSelected(null)
  }, [resetZoom])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setScale((s) => (s > 1 ? 1 : 2.5))
    setPan({ x: 0, y: 0 })
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      pinchStartDist.current = dist
      pinchStartScale.current = scale
    } else if (e.touches.length === 1) {
      const now = Date.now()
      if (now - lastTapTime.current < 300) {
        setScale((s) => (s > 1 ? 1 : 2.5))
        setPan({ x: 0, y: 0 })
      }
      lastTapTime.current = now

      if (scale > 1) {
        dragRef.current = {
          active: true,
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          panX: pan.x,
          panY: pan.y,
        }
        setIsPanning(true)
      }
    }
  }, [scale, pan])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const newScale = Math.min(5, Math.max(1, pinchStartScale.current * (dist / pinchStartDist.current)))
      setScale(newScale)
      if (newScale <= 1) setPan({ x: 0, y: 0 })
    } else if (e.touches.length === 1 && dragRef.current.active) {
      const dx = e.touches[0].clientX - dragRef.current.startX
      const dy = e.touches[0].clientY - dragRef.current.startY
      setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy })
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    pinchStartDist.current = null
    dragRef.current.active = false
    setIsPanning(false)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault()
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      }
      setIsPanning(true)
    }
  }, [scale, pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragRef.current.active) {
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy })
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false
    setIsPanning(false)
  }, [])

  if (images.length === 0) return null

  const isZoomed = scale > 1

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className="aspect-square rounded-lg overflow-hidden bg-surface border border-foreground/10 hover:border-brand transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.fileName} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {selected !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={!isZoomed ? handleClose : undefined}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="relative max-w-full max-h-[80vh] flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`overflow-hidden rounded-lg ${isPanning ? 'cursor-grabbing' : isZoomed ? 'cursor-grab' : 'cursor-zoom-in'}`}
              style={{ touchAction: 'none' }}
              onDoubleClick={handleDoubleClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[selected].url}
                alt={images[selected].fileName}
                className="max-h-[75vh] max-w-full object-contain select-none"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.2s ease',
                  willChange: 'transform',
                  userSelect: 'none',
                }}
                draggable={false}
              />
            </div>
            <p className="text-muted text-xs">{images[selected].fileName}</p>

            <div className="flex items-center gap-6">
              <button onClick={prev} className="btn-ghost px-6">Prev</button>
              <span className="text-muted text-sm">{selected + 1} / {images.length}</span>
              <button onClick={next} className="btn-ghost px-6">Next</button>
            </div>

            <button
              onClick={handleClose}
              className="absolute top-0 right-0 text-muted hover:text-foreground text-2xl leading-none p-1"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  )
}
