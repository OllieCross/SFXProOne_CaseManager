import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import QRGenerator from '@/components/editor/QRGenerator'
import InventoryList from '@/components/inventory/InventoryList'
import DeviceList from '@/components/inventory/DeviceList'
import ConsumableList from '@/components/inventory/ConsumableList'
import StandaloneItemList from '@/components/inventory/StandaloneItemList'

export default async function InventoryPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const [cases, devices, consumables, standaloneItems] = await Promise.all([
    prisma.case.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        items: { select: { name: true } },
        _count: { select: { items: true, images: true, documents: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.device.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        case: { select: { id: true, name: true } },
        _count: { select: { images: true, documents: true, logbook: true } },
      },
    }),
    prisma.consumable.findMany({ orderBy: { name: 'asc' } }),
    prisma.item.findMany({ where: { caseId: null }, orderBy: { name: 'asc' } }),
  ])

  const role = session.user.role
  const canEdit = ['EDITOR', 'ADMIN'].includes(role)

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Inventory</h1>
          <QRGenerator />
        </div>
        {canEdit && (
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/editor/new" className="btn-primary text-sm">+ New Case</Link>
            <Link href="/items/new" className="btn-primary text-sm">+ New Item</Link>
            <Link href="/devices/new" className="btn-primary text-sm">+ New Device</Link>
            <Link href="/consumables/new" className="btn-primary text-sm">+ New Consumable</Link>
          </div>
        )}

        {/* Cases */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
            Cases <span className="normal-case font-normal">({cases.length})</span>
          </h2>
          {cases.length === 0 ? (
            <p className="text-muted text-sm">No cases yet.</p>
          ) : (
            <InventoryList cases={cases} canEdit={canEdit} />
          )}
        </section>

        {/* Devices */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
            Devices <span className="normal-case font-normal">({devices.length})</span>
          </h2>
          <DeviceList devices={devices} canEdit={canEdit} />
        </section>

        {/* Consumables */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
            Consumables <span className="normal-case font-normal">({consumables.length})</span>
          </h2>
          <ConsumableList consumables={consumables} canEdit={canEdit} />
        </section>

        {/* Standalone Items */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
            Standalone Items <span className="normal-case font-normal">({standaloneItems.length})</span>
          </h2>
          <StandaloneItemList items={standaloneItems} canEdit={canEdit} />
        </section>
      </main>
    </>
  )
}
