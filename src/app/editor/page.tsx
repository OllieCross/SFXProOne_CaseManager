import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import QRGenerator from '@/components/editor/QRGenerator'
import InventoryList from '@/components/inventory/InventoryList'

export default async function InventoryPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const cases = await prisma.case.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      items: { select: { name: true } },
      _count: { select: { items: true, images: true, documents: true } },
      createdBy: { select: { name: true } },
    },
  })

  const role = session.user.role
  const canEdit = ['EDITOR', 'ADMIN'].includes(role)
  const isAdmin = role === 'ADMIN'

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Inventory</h1>
          {canEdit && (
            <div className="flex items-center gap-2">
              <QRGenerator />
              <Link href="/editor/new" className="btn-primary text-sm">
                + New Case
              </Link>
            </div>
          )}
        </div>

        {cases.length === 0 ? (
          <p className="text-muted text-sm">No cases yet. Create one to get started.</p>
        ) : (
          <InventoryList cases={cases} canEdit={canEdit} isAdmin={isAdmin} />
        )}
      </main>
    </>
  )
}
