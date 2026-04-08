import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/minio'
import Header from '@/components/layout/Header'
import PyroEditorForm from '@/components/forms/PyroEditorForm'

export default async function EditPyroPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) redirect('/login')

  const { id } = await params

  const pyro = await prisma.pyro.findUnique({
    where: { id },
    include: {
      images: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
      documents: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
    },
  })

  if (!pyro) notFound()

  const imageUrls = await Promise.all(
    pyro.images.map(async (img) => ({ ...img, url: await getFileUrl(img.fileKey) }))
  )
  const documentUrls = await Promise.all(
    pyro.documents.map(async (doc) => ({ ...doc, url: await getFileUrl(doc.fileKey) }))
  )

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-16">
        <h1 className="text-xl font-bold">Edit Pyro Effect</h1>
        <PyroEditorForm
          mode="edit"
          pyroId={id}
          initialData={{
            name: pyro.name,
            brand: pyro.brand ?? '',
            category: pyro.category as 'T1' | 'T2' | 'F1' | 'F2' | 'F3' | 'F4' | 'P1' | 'P2' | 'Other',
            stockQuantity: String(pyro.stockQuantity),
            warningThreshold: pyro.warningThreshold != null ? String(pyro.warningThreshold) : '',
            criticalThreshold: pyro.criticalThreshold != null ? String(pyro.criticalThreshold) : '',
            notes: pyro.notes ?? '',
            images: imageUrls,
            documents: documentUrls.map((d) => ({
              ...d,
              type: d.type as 'Manual' | 'Certificate' | 'Other' | 'Bill' | 'Order' | 'Invoice' | 'ServiceReport',
            })),
          }}
        />
      </main>
    </>
  )
}
