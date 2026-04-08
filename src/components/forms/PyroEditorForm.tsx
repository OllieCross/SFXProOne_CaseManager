'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { formatBytes } from '@/lib/utils'
import ConfirmModal from '@/components/ui/ConfirmModal'

// ---------- Types ----------

type PyroCategory = 'T1' | 'T2' | 'F1' | 'F2' | 'F3' | 'F4' | 'P1' | 'P2' | 'Other'
type DocType = 'Manual' | 'Certificate' | 'Other' | 'Bill' | 'Order' | 'Invoice' | 'ServiceReport'

type ImageRow = {
  id?: string
  fileKey?: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  uploading?: boolean
  error?: string
}

type DocumentRow = {
  id?: string
  fileKey?: string
  fileName: string
  fileSize: number
  mimeType: string
  title: string
  type: DocType
  url?: string
  uploading?: boolean
  error?: string
}

type PendingImage = { file: File; previewUrl: string }
type PendingDocument = { file: File; title: string; type: DocType }

type Props = {
  mode: 'create' | 'edit'
  pyroId?: string
  initialData?: {
    name: string
    brand: string
    category: PyroCategory
    stockQuantity: string
    warningThreshold: string
    criticalThreshold: string
    notes: string
    images: ImageRow[]
    documents: DocumentRow[]
  }
}

const CATEGORY_LABELS: Record<PyroCategory, string> = {
  T1: 'T1', T2: 'T2', F1: 'F1', F2: 'F2',
  F3: 'F3', F4: 'F4', P1: 'P1', P2: 'P2', Other: 'Other',
}

// ---------- Upload helpers ----------

async function uploadImageFile(
  file: File,
  pyroId: string,
  onProgress: (state: 'uploading' | 'done' | 'error', result?: ImageRow) => void
): Promise<void> {
  onProgress('uploading')
  try {
    let processed: File = file
    if (
      file.type === 'image/heic' || file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
    ) {
      const heic2any = (await import('heic2any')).default
      const blob = (await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })) as Blob
      processed = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
    }
    const imageCompression = (await import('browser-image-compression')).default
    processed = await imageCompression(processed, { maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.8 })

    const urlRes = await fetch('/api/minio/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pyroId, type: 'image', fileName: processed.name, mimeType: processed.type }),
    })
    if (!urlRes.ok) throw new Error('Failed to get upload URL')
    const { url, fileKey } = await urlRes.json()
    await fetch(url, { method: 'PUT', headers: { 'Content-Type': processed.type }, body: processed })
    const recordRes = await fetch(`/api/pyro/${pyroId}/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileKey, fileName: processed.name, fileSize: processed.size, mimeType: processed.type }),
    })
    if (!recordRes.ok) throw new Error('Failed to save image record')
    const saved = await recordRes.json()
    onProgress('done', { ...saved, url: URL.createObjectURL(processed) })
  } catch (err) {
    onProgress('error', { fileName: file.name, fileSize: file.size, mimeType: file.type, url: '', error: err instanceof Error ? err.message : 'Upload failed' })
  }
}

async function uploadDocumentFile(
  file: File, title: string, type: DocType, pyroId: string,
  onProgress: (state: 'uploading' | 'done' | 'error', result?: DocumentRow) => void
): Promise<void> {
  onProgress('uploading')
  try {
    const urlRes = await fetch('/api/minio/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pyroId, type: 'document', fileName: file.name, mimeType: file.type }),
    })
    if (!urlRes.ok) throw new Error('Failed to get upload URL')
    const { url, fileKey } = await urlRes.json()
    await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
    const recordRes = await fetch(`/api/pyro/${pyroId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, type, fileKey, fileName: file.name, fileSize: file.size, mimeType: file.type }),
    })
    if (!recordRes.ok) throw new Error('Failed to save document record')
    const saved = await recordRes.json()
    onProgress('done', saved)
  } catch (err) {
    onProgress('error', { fileName: file.name, fileSize: file.size, mimeType: file.type, title, type, error: err instanceof Error ? err.message : 'Upload failed' })
  }
}

// ---------- Component ----------

export default function PyroEditorForm({ mode, pyroId, initialData }: Props) {
  const router = useRouter()
  const [activePyroId, setActivePyroId] = useState(pyroId)

  const [name, setName] = useState(initialData?.name ?? '')
  const [brand, setBrand] = useState(initialData?.brand ?? '')
  const [category, setCategory] = useState<PyroCategory>(initialData?.category ?? 'Other')
  const [stockQuantity, setStockQuantity] = useState(initialData?.stockQuantity ?? '0')
  const [warningThreshold, setWarningThreshold] = useState(initialData?.warningThreshold ?? '')
  const [criticalThreshold, setCriticalThreshold] = useState(initialData?.criticalThreshold ?? '')
  const [notes, setNotes] = useState(initialData?.notes ?? '')

  const [images, setImages] = useState<ImageRow[]>(initialData?.images ?? [])
  const [documents, setDocuments] = useState<DocumentRow[]>(initialData?.documents ?? [])
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([])
  const [docDraft, setDocDraft] = useState<{ file: File; title: string; type: DocType } | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  type ConfirmTarget =
    | { kind: 'image'; id: string; name: string }
    | { kind: 'document'; id: string; name: string }
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [showDeletePyro, setShowDeletePyro] = useState(false)
  const [deletingPyro, setDeletingPyro] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  function addPendingImage(file: File) {
    setPendingImages((prev) => [...prev, { file, previewUrl: URL.createObjectURL(file) }])
  }
  function removePendingImage(index: number) {
    setPendingImages((prev) => { URL.revokeObjectURL(prev[index].previewUrl); return prev.filter((_, i) => i !== index) })
  }
  async function processAndUploadImage(file: File, id?: string) {
    const pId = id ?? activePyroId!
    const placeholder: ImageRow = { fileName: file.name, fileSize: file.size, mimeType: file.type, url: '', uploading: true }
    setImages((prev) => [...prev, placeholder])
    await uploadImageFile(file, pId, (state, result) => {
      setImages((prev) => prev.map((img) =>
        img.fileName === file.name && img.uploading
          ? state === 'done' ? result! : { ...img, uploading: false, error: result?.error }
          : img
      ))
    })
  }
  async function deleteImage(imageId: string) {
    await fetch(`/api/pyro/${activePyroId}/images/${imageId}`, { method: 'DELETE' })
    setImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  function openDocDraft(file: File) {
    setDocDraft({ file, title: file.name.replace(/\.pdf$/i, ''), type: 'Manual' })
  }
  function commitDocDraft() {
    if (!docDraft) return
    if (mode === 'create') {
      setPendingDocuments((prev) => [...prev, { file: docDraft.file, title: docDraft.title, type: docDraft.type }])
    } else {
      uploadDocument(docDraft.file, docDraft.title, docDraft.type)
    }
    setDocDraft(null)
  }
  function removePendingDocument(index: number) {
    setPendingDocuments((prev) => prev.filter((_, i) => i !== index))
  }
  async function uploadDocument(file: File, title: string, type: DocType, id?: string) {
    const pId = id ?? activePyroId!
    const placeholder: DocumentRow = { fileName: file.name, fileSize: file.size, mimeType: file.type, title, type, uploading: true }
    setDocuments((prev) => [...prev, placeholder])
    await uploadDocumentFile(file, title, type, pId, (state, result) => {
      setDocuments((prev) => prev.map((doc) =>
        doc.fileName === file.name && doc.uploading
          ? state === 'done' ? { ...result!, uploading: false } : { ...doc, uploading: false, error: result?.error }
          : doc
      ))
    })
  }
  async function deleteDocument(docId: string) {
    await fetch(`/api/pyro/${activePyroId}/documents/${docId}`, { method: 'DELETE' })
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId))
  }

  async function handleConfirmDelete() {
    if (!confirmTarget) return
    setConfirmLoading(true)
    if (confirmTarget.kind === 'image') await deleteImage(confirmTarget.id)
    else await deleteDocument(confirmTarget.id)
    setConfirmLoading(false)
    setConfirmTarget(null)
  }

  async function handleDeletePyro() {
    setDeletingPyro(true)
    try {
      const res = await fetch(`/api/pyro/${activePyroId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.push('/editor')
      router.refresh()
    } catch {
      setError('Failed to delete pyro effect')
      setDeletingPyro(false)
      setShowDeletePyro(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const parsedStock = parseInt(stockQuantity)
    if (isNaN(parsedStock) || parsedStock < 0) { setError('Stock quantity cannot be negative'); setSaving(false); return }
    const parsedWarning = warningThreshold !== '' ? parseInt(warningThreshold) : undefined
    const parsedCritical = criticalThreshold !== '' ? parseInt(criticalThreshold) : undefined

    try {
      if (mode === 'create') {
        const res = await fetch('/api/pyro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, brand: brand || undefined, category,
            stockQuantity: parsedStock,
            warningThreshold: parsedWarning,
            criticalThreshold: parsedCritical,
            notes: notes || undefined,
          }),
        })
        if (!res.ok) { const data = await res.json(); throw new Error(data.error ?? 'Failed to create') }
        const created = await res.json()
        setActivePyroId(created.id)
        await Promise.all([
          ...pendingImages.map((p) => processAndUploadImage(p.file, created.id)),
          ...pendingDocuments.map((p) => uploadDocument(p.file, p.title, p.type, created.id)),
        ])
        router.push(`/pyro/${created.id}`)
      } else {
        const res = await fetch(`/api/pyro/${activePyroId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name, brand: brand || null, category,
            stockQuantity: parsedStock,
            warningThreshold: parsedWarning ?? null,
            criticalThreshold: parsedCritical ?? null,
            notes: notes || null,
          }),
        })
        if (!res.ok) { const data = await res.json(); throw new Error(data.error ?? 'Failed to update') }
        router.refresh()
        router.push(`/pyro/${activePyroId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Details</h2>
        <div>
          <label className="block text-sm font-medium mb-1.5">Effect Name *</label>
          <input type="text" required className="input-field" placeholder="e.g. Red Star Comet" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Brand</label>
          <input type="text" className="input-field" placeholder="Optional" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Category</label>
          <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value as PyroCategory)}>
            {(Object.keys(CATEGORY_LABELS) as PyroCategory[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Stock Quantity</label>
          <input
            type="number" min="0" step="1" className="input-field"
            value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Warning Threshold</label>
            <input
              type="number" min="0" step="1" className="input-field" placeholder="Optional"
              value={warningThreshold} onChange={(e) => setWarningThreshold(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Critical Threshold</label>
            <input
              type="number" min="0" step="1" className="input-field" placeholder="Optional"
              value={criticalThreshold} onChange={(e) => setCriticalThreshold(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Notes</label>
          <textarea className="input-field resize-none" rows={2} placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </section>

      {/* Photos */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Photos</h2>
        <input ref={imageInputRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (mode === 'create') files.forEach(addPendingImage)
            else files.forEach((f) => processAndUploadImage(f))
            e.target.value = ''
          }}
        />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            if (mode === 'create') addPendingImage(file)
            else processAndUploadImage(file)
            e.target.value = ''
          }}
        />
        <div className="flex gap-2">
          <button type="button" onClick={() => imageInputRef.current?.click()} className="btn-ghost text-sm">Upload Photo</button>
          <button type="button" onClick={() => cameraInputRef.current?.click()} className="btn-ghost text-sm">Take Photo</button>
        </div>
        {pendingImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {pendingImages.map((p, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-foreground/10 bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.previewUrl} alt={p.file.name} className="w-full h-full object-cover opacity-60" />
                <button type="button" onClick={() => removePendingImage(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500/80 transition-colors" aria-label="Remove">&times;</button>
              </div>
            ))}
          </div>
        )}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, i) => (
              <div key={img.id ?? i} className="relative aspect-square rounded-lg overflow-hidden border border-foreground/10 bg-surface">
                {img.uploading ? (
                  <div className="w-full h-full flex items-center justify-center"><div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" /></div>
                ) : img.error ? (
                  <div className="w-full h-full flex items-center justify-center p-2"><p className="text-red-400 text-xs text-center">{img.error}</p></div>
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.fileName} className="w-full h-full object-cover" />
                    {img.id && (
                      <button type="button" onClick={() => setConfirmTarget({ kind: 'image', id: img.id!, name: img.fileName })} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500/80 transition-colors" aria-label="Delete">&times;</button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Documents */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Documents</h2>
        <input ref={docInputRef} type="file" accept="application/pdf" className="hidden"
          onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; openDocDraft(file); e.target.value = '' }}
        />
        <button type="button" onClick={() => docInputRef.current?.click()} className="btn-ghost text-sm">Upload PDF</button>
        {docDraft && (
          <div className="card space-y-3">
            <p className="text-xs text-muted font-medium uppercase tracking-wider">New document: {docDraft.file.name}</p>
            <div>
              <label className="block text-xs font-medium mb-1">Title</label>
              <input type="text" className="input-field" value={docDraft.title} onChange={(e) => setDocDraft((d) => d ? { ...d, title: e.target.value } : d)} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Type</label>
              <select className="input-field" value={docDraft.type} onChange={(e) => setDocDraft((d) => d ? { ...d, type: e.target.value as DocType } : d)}>
                <option value="Manual">Manual</option>
                <option value="Certificate">Certificate</option>
                <option value="Other">Other</option>
                <option value="Bill">Bill</option>
                <option value="Order">Order</option>
                <option value="Invoice">Invoice</option>
                <option value="ServiceReport">Service Report</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={commitDocDraft} className="btn-primary text-sm py-1.5 px-3">Add</button>
              <button type="button" onClick={() => setDocDraft(null)} className="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        )}
        {pendingDocuments.length > 0 && (
          <div className="space-y-2">
            {pendingDocuments.map((p, i) => (
              <div key={i} className="card flex items-center justify-between gap-3 opacity-60">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-muted text-xs">{p.type} &middot; {p.file.name} &middot; {formatBytes(p.file.size)}</p>
                </div>
                <button type="button" onClick={() => removePendingDocument(i)} className="text-red-400/60 hover:text-red-400 text-xs transition-colors shrink-0">Remove</button>
              </div>
            ))}
          </div>
        )}
        {documents.length > 0 && (
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <div key={doc.id ?? i} className="card flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{doc.title}</p>
                  <p className="text-muted text-xs">{doc.type} &middot; {doc.fileName} &middot; {formatBytes(doc.fileSize)}</p>
                  {doc.error && <p className="text-red-400 text-xs">{doc.error}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {doc.uploading && <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />}
                  {doc.id && (
                    <button type="button" onClick={() => setConfirmTarget({ kind: 'document', id: doc.id!, name: doc.title })} className="text-red-400/60 hover:text-red-400 text-xs transition-colors">Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3 flex-wrap">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving...' : mode === 'create' ? 'Create Pyro' : 'Save Changes'}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button>
        {mode === 'edit' && (
          <button
            type="button"
            onClick={() => setShowDeletePyro(true)}
            className="ml-auto bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      {showDeletePyro && (
        <ConfirmModal
          title="Delete Pyro Effect"
          message={`Are you sure you want to delete "${name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeletePyro}
          onCancel={() => setShowDeletePyro(false)}
          loading={deletingPyro}
        />
      )}

      {confirmTarget && (
        <ConfirmModal
          title={confirmTarget.kind === 'image' ? 'Delete photo' : 'Delete document'}
          message={`Delete "${(confirmTarget as { name: string }).name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmTarget(null)}
          loading={confirmLoading}
        />
      )}
    </form>
  )
}
