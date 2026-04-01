import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import GroupForm from '@/components/forms/GroupForm'

export default async function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) redirect('/groups')

  const { id } = await params

  const [group, allCases, allDevices, allItems, allConsumables] = await Promise.all([
    prisma.group.findUnique({
      where: { id },
      include: {
        cases: { include: { case: { select: { id: true, name: true } } } },
        devices: { include: { device: { select: { id: true, name: true, status: true } } } },
        items: { include: { item: { select: { id: true, name: true, quantity: true } } } },
        consumables: { include: { consumable: { select: { id: true, name: true, unit: true } } } },
      },
    }),
    prisma.case.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.device.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, status: true } }),
    prisma.item.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, quantity: true } }),
    prisma.consumable.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, unit: true } }),
  ])

  if (!group) notFound()

  const members = [
    ...group.cases.map((gc) => ({ type: 'case' as const, id: gc.case.id, name: gc.case.name })),
    ...group.devices.map((gd) => ({ type: 'device' as const, id: gd.device.id, name: gd.device.name, status: gd.device.status })),
    ...group.items.map((gi) => ({ type: 'item' as const, id: gi.item.id, name: gi.item.name, quantity: gi.item.quantity })),
    ...group.consumables.map((gc) => ({ type: 'consumable' as const, id: gc.consumable.id, name: gc.consumable.name, unit: gc.consumable.unit, quantityNeeded: gc.quantityNeeded })),
  ]

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-16">
        <h1 className="text-xl font-bold">Edit Group</h1>
        <GroupForm
          mode="edit"
          groupId={id}
          initialData={{ name: group.name, members }}
          allCases={allCases}
          allDevices={allDevices}
          allItems={allItems}
          allConsumables={allConsumables}
        />
      </main>
    </>
  )
}
