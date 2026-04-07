import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import RecycleBinClient from '@/components/admin/RecycleBinClient'
import { formatDate } from '@/lib/utils'

export default async function RecycleBinPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/scan')

  const [cases, devices, items, consumables, images, documents, deviceImages, deviceDocuments] = await Promise.all([
    prisma.case.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, select: { id: true, name: true, deletedAt: true } }),
    prisma.device.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, select: { id: true, name: true, deletedAt: true } }),
    prisma.item.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, select: { id: true, name: true, deletedAt: true } }),
    prisma.consumable.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, select: { id: true, name: true, deletedAt: true } }),
    prisma.image.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, include: { case: { select: { name: true } } } }),
    prisma.document.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, include: { case: { select: { name: true } } } }),
    prisma.deviceImage.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, include: { device: { select: { name: true } } } }),
    prisma.deviceDocument.findMany({ where: { deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' }, include: { device: { select: { name: true } } } }),
  ])

  const serialize = (item: { id: string; name?: string; fileName?: string; title?: string; deletedAt: Date | null }, parentName?: string) => ({
    id: item.id,
    label: (item as { name?: string }).name ?? (item as { title?: string }).title ?? (item as { fileName?: string }).fileName ?? item.id,
    parentName,
    deletedAt: item.deletedAt ? formatDate(item.deletedAt) : '',
    deletedAtRaw: item.deletedAt?.toISOString() ?? '',
  })

  return (
    <>
      <Header />
      <RecycleBinClient
        cases={cases.map(c => serialize(c))}
        devices={devices.map(d => serialize(d))}
        items={items.map(i => serialize(i))}
        consumables={consumables.map(c => serialize(c))}
        images={images.map(i => serialize(i, i.case.name))}
        documents={documents.map(d => serialize(d, d.case.name))}
        deviceImages={deviceImages.map(i => serialize(i, i.device.name))}
        deviceDocuments={deviceDocuments.map(d => serialize(d, d.device.name))}
      />
    </>
  )
}
