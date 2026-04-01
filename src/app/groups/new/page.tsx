import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import GroupForm from '@/components/forms/GroupForm'

export default async function NewGroupPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) redirect('/groups')

  const [allCases, allDevices, allItems, allConsumables] = await Promise.all([
    prisma.case.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.device.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, status: true } }),
    prisma.item.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, quantity: true } }),
    prisma.consumable.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, unit: true } }),
  ])

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-16">
        <h1 className="text-xl font-bold">New Group</h1>
        <GroupForm
          mode="create"
          allCases={allCases}
          allDevices={allDevices}
          allItems={allItems}
          allConsumables={allConsumables}
        />
      </main>
    </>
  )
}
