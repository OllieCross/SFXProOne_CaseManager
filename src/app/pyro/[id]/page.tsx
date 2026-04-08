import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/minio'
import { formatDate } from '@/lib/utils'
import Header from '@/components/layout/Header'
import CaseGallery from '@/components/media/CaseGallery'
import PDFViewer from '@/components/media/PDFViewer'
import Link from 'next/link'

export default async function PyroPag({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params

  const pyro = await prisma.pyro.findUnique({
    where: { id },
    include: {
      images: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
    },
  })

  if (!pyro) notFound()

  const canEdit = ['EDITOR', 'ADMIN'].includes(session.user.role)

  const imageUrls = await Promise.all(
    pyro.images.map(async (img) => ({ url: await getFileUrl(img.fileKey), fileName: img.fileName }))
  )
  const documentUrls = await Promise.all(
    pyro.documents.map(async (doc) => ({
      url: await getFileUrl(doc.fileKey),
      title: doc.title, type: doc.type, fileName: doc.fileName,
    }))
  )

  const hasCritical = pyro.criticalThreshold != null
  const hasWarning = pyro.warningThreshold != null
  const isCritical = hasCritical && pyro.stockQuantity <= pyro.criticalThreshold!
  const isWarning = hasWarning && !isCritical && pyro.stockQuantity <= pyro.warningThreshold!
  const barColor = isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-400' : (hasWarning || hasCritical) ? 'bg-green-500' : 'bg-foreground/20'

  let fill = 0
  if (pyro.stockQuantity <= 0) {
    fill = 0
  } else if (hasWarning && pyro.warningThreshold! > 0) {
    const wt = pyro.warningThreshold!
    const ct = hasCritical ? pyro.criticalThreshold! : 0
    if (pyro.stockQuantity >= wt * 2) fill = 1
    else if (pyro.stockQuantity >= wt * 1.5) fill = 0.75
    else if (pyro.stockQuantity >= wt) fill = 0.5
    else if (hasCritical && pyro.stockQuantity >= ct) fill = 0.25
    else fill = 0
  } else if (hasCritical && pyro.criticalThreshold! > 0) {
    fill = pyro.stockQuantity >= pyro.criticalThreshold! ? 0.25 : 0
  } else {
    fill = 0.5
  }

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8 pb-16">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{pyro.name}</h1>
            <p className="text-sm text-muted mt-1">
              {pyro.category}{pyro.brand ? ` &middot; ${pyro.brand}` : ''}
            </p>
          </div>
          {canEdit && (
            <Link href={`/pyro/${id}/edit`} className="btn-ghost p-2 rounded-lg shrink-0" aria-label="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </Link>
          )}
        </div>

        {/* Stock */}
        <section className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Stock</h2>
            <span className="text-lg font-bold">{pyro.stockQuantity} <span className="text-sm font-normal text-muted">units</span></span>
          </div>
          {(hasWarning || hasCritical) && (
            <div className="h-2 rounded-full bg-foreground/10 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${fill * 100}%` }} />
            </div>
          )}
          {(hasWarning || hasCritical) && (
            <div className="flex gap-4 text-xs text-muted">
              {hasWarning && <span>Warning at: {pyro.warningThreshold}</span>}
              {hasCritical && <span>Critical at: {pyro.criticalThreshold}</span>}
            </div>
          )}
        </section>

        {/* Info */}
        {pyro.notes && (
          <section className="card text-sm">
            <div className="flex gap-3">
              <span className="text-muted w-28 shrink-0">Notes</span>
              <span className="text-muted">{pyro.notes}</span>
            </div>
          </section>
        )}

        {/* Photos */}
        {imageUrls.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Photos <span className="ml-2 text-muted text-sm font-normal">{imageUrls.length}</span></h2>
            <CaseGallery images={imageUrls} />
          </section>
        )}

        {/* Documents */}
        {documentUrls.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-3">Documents</h2>
            <div className="space-y-4">
              {documentUrls.map((doc, i) => (
                <div key={i} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-muted text-xs mt-0.5">{doc.type} &middot; {doc.fileName}</p>
                    </div>
                  </div>
                  <PDFViewer url={doc.url} title={doc.title} />
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="text-muted text-xs">Added {formatDate(pyro.createdAt)}</p>
      </main>
    </>
  )
}
