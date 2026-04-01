import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getFileUrl } from '@/lib/minio'
import Header from '@/components/layout/Header'
import DeviceEditorForm from '@/components/forms/DeviceEditorForm'

export default async function EditDevicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) redirect('/login')

  const { id } = await params

  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      images: { orderBy: { createdAt: 'asc' } },
      documents: { orderBy: { createdAt: 'asc' } },
      logbook: {
        orderBy: { date: 'desc' },
        include: { user: { select: { name: true } } },
      },
    },
  })

  if (!device) notFound()

  const allCases = await prisma.case.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  const imageUrls = await Promise.all(
    device.images.map(async (img) => ({
      ...img,
      fileSize: img.fileSize,
      url: await getFileUrl(img.fileKey),
    }))
  )

  const documentUrls = await Promise.all(
    device.documents.map(async (doc) => ({
      ...doc,
      url: await getFileUrl(doc.fileKey),
    }))
  )

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-16">
        <h1 className="text-xl font-bold">Edit Device</h1>
        <DeviceEditorForm
          mode="edit"
          deviceId={id}
          allCases={allCases}
          initialData={{
            name: device.name,
            qrCode: device.qrCode,
            serialNumber: device.serialNumber ?? '',
            purchaseDate: device.purchaseDate ? device.purchaseDate.toISOString().slice(0, 10) : '',
            status: device.status,
            caseId: device.caseId ?? '',
            notes: device.notes ?? '',
            images: imageUrls,
            documents: documentUrls.map((d) => ({ ...d, type: d.type as 'Manual' | 'Certificate' | 'Other' | 'Bill' | 'Order' | 'Invoice' | 'ServiceReport' })),
            logbook: device.logbook.map((e) => ({
              ...e,
              date: e.date.toISOString(),
            })),
          }}
        />
      </main>
    </>
  )
}
