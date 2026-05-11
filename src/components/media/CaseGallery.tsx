'use client'

import { useState, useCallback, useRef } from 'react'

type GalleryImage = { url: string; fileName: string }
type Props = { images: GalleryImage[] }

const MAX_SCALE = 5
const ZOOM_STEP = 2.5

export default function CaseGallery({ images }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [isZoomed, setIsZoomed] = useState(false)

  const imgRef = useRef<HTMLImageElement>(null)
  const scaleRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })

  const pinchRef = useRef<{
    startDist: number
    startScale: number
    startPan: { x: number; y: number }
    focalX: number
    focalY: number
  } | null>(null)

  const dragRef = useRef<{
    startX: number
    startY: number
    startPan: { x: number; y: number }
  } | null>(null)

  const lastTapRef = useRef(0)
  const lastTouchRef = useRef(0)
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Directly mutate DOM to avoid React re-renders during gesture frames
  const applyTransform = useCallback((scale: number, pan: { x: number; y: number }, animate = false) => {
    const img = imgRef.current
    if (!img) return
    const clamped = Math.min(MAX_SCALE, Math.max(1, scale))
    const finalPan = clamped <= 1 ? { x: 0, y: 0 } : pan
    img.style.transition = animate ? 'transform 0.2s ease' : 'none'
    img.style.transform = `translate(${finalPan.x}px, ${finalPan.y}px) scale(${clamped})`
    scaleRef.current = clamped
    panRef.current = finalPan
    setIsZoomed(clamped > 1)
  }, [])

  const resetZoom = useCallback((animate = true) => {
    applyTransform(1, { x: 0, y: 0 }, animate)
  }, [applyTransform])

  // Focal point relative to the image's layout center (unaffected by current transform).
  // getBoundingClientRect() center = layoutCenter + pan, so subtract pan to get layoutCenter.
  const getLayoutFocal = useCallback((clientX: number, clientY: number) => {
    const img = imgRef.current
    if (!img) return { x: 0, y: 0 }
    const rect = img.getBoundingClientRect()
    const layoutCX = rect.left + rect.width / 2 - panRef.current.x
    const layoutCY = rect.top + rect.height / 2 - panRef.current.y
    return { x: clientX - layoutCX, y: clientY - layoutCY }
  }, [])

  // Zoom to newScale anchored at (focalX, focalY) in layout-focal coords.
  // Formula: newPan = basePan + focal * (1 - newScale / baseScale)
  // Keeps the focal screen point fixed as scale changes.
  const zoomToScale = useCallback((
    newScale: number,
    focalX: number,
    focalY: number,
    basePan: { x: number; y: number },
    baseScale: number,
    animate = false,
  ) => {
    const clamped = Math.min(MAX_SCALE, Math.max(1, newScale))
    const ratio = clamped / baseScale
    const newPan = clamped <= 1
      ? { x: 0, y: 0 }
      : { x: basePan.x + focalX * (1 - ratio), y: basePan.y + focalY * (1 - ratio) }
    applyTransform(clamped, newPan, animate)
  }, [applyTransform])

  const handleToggleZoom = useCallback((clientX: number, clientY: number) => {
    if (scaleRef.current > 1) {
      resetZoom()
    } else {
      const focal = getLayoutFocal(clientX, clientY)
      zoomToScale(ZOOM_STEP, focal.x, focal.y, panRef.current, scaleRef.current, true)
    }
  }, [resetZoom, getLayoutFocal, zoomToScale])

  const prev = useCallback(() => {
    resetZoom(false)
    setSelected((s) => (s !== null ? (s > 0 ? s - 1 : images.length - 1) : null))
  }, [images.length, resetZoom])

  const next = useCallback(() => {
    resetZoom(false)
    setSelected((s) => (s !== null ? (s < images.length - 1 ? s + 1 : 0) : null))
  }, [images.length, resetZoom])

  const handleClose = useCallback(() => {
    resetZoom(false)
    setSelected(null)
  }, [resetZoom])

  // Desktop: double-click detection. Guard against touch-synthesized click events
  // (iOS fires a click ~300ms after touchend - we ignore clicks within 600ms of last touch).
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (Date.now() - lastTouchRef.current < 600) return
    clickCountRef.current += 1
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    const { clientX, clientY } = e
    clickTimerRef.current = setTimeout(() => {
      if (clickCountRef.current >= 2) handleToggleZoom(clientX, clientY)
      clickCountRef.current = 0
    }, 250)
  }, [handleToggleZoom])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    lastTouchRef.current = Date.now()

    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      const focal = getLayoutFocal(midX, midY)
      pinchRef.current = {
        startDist: dist,
        startScale: scaleRef.current,
        startPan: { ...panRef.current },
        focalX: focal.x,
        focalY: focal.y,
      }
      dragRef.current = null
    } else if (e.touches.length === 1) {
      pinchRef.current = null
      const now = Date.now()
      if (now - lastTapRef.current < 300) {
        // Double-tap: toggle zoom
        handleToggleZoom(e.touches[0].clientX, e.touches[0].clientY)
        lastTapRef.current = 0 // reset so rapid 3rd tap doesn't re-toggle
      } else {
        lastTapRef.current = now
        if (scaleRef.current > 1) {
          dragRef.current = {
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
            startPan: { ...panRef.current },
          }
        }
      }
    }
  }, [getLayoutFocal, handleToggleZoom])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const { startDist, startScale, startPan, focalX, focalY } = pinchRef.current
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      zoomToScale(startScale * (dist / startDist), focalX, focalY, startPan, startScale)
    } else if (e.touches.length === 1 && dragRef.current) {
      const dx = e.touches[0].clientX - dragRef.current.startX
      const dy = e.touches[0].clientY - dragRef.current.startY
      applyTransform(scaleRef.current, {
        x: dragRef.current.startPan.x + dx,
        y: dragRef.current.startPan.y + dy,
      })
    }
  }, [zoomToScale, applyTransform])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null
    if (e.touches.length === 0) dragRef.current = null
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scaleRef.current <= 1) return
    e.preventDefault()
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPan: { ...panRef.current },
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    applyTransform(scaleRef.current, {
      x: dragRef.current.startPan.x + dx,
      y: dragRef.current.startPan.y + dy,
    })
  }, [applyTransform])

  const handleMouseUp = useCallback(() => {
    dragRef.current = null
  }, [])

  if (images.length === 0) return null

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
              className={`overflow-hidden rounded-lg ${isZoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
              style={{ touchAction: 'none' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onClick={handleClick}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={images[selected].url}
                alt={images[selected].fileName}
                className="max-h-[75vh] max-w-full object-contain select-none"
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
              className="absolute -top-2 -right-2 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white text-xl leading-none transition-colors"
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
