import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import DeviceEditorForm from '@/components/forms/DeviceEditorForm'

export default async function NewDevicePage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) redirect('/devices')

  const allCases = await prisma.case.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-16">
        <h1 className="text-xl font-bold">New Device</h1>
        <DeviceEditorForm mode="create" allCases={allCases} />
      </main>
    </>
  )
}
