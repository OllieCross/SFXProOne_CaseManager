import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import StandaloneItemForm from '@/components/forms/StandaloneItemForm'

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) redirect('/editor')

  const { id } = await params
  const item = await prisma.item.findUnique({ where: { id } })
  if (!item || item.caseId !== null) notFound()

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-16">
        <h1 className="text-xl font-bold">Edit Item</h1>
        <StandaloneItemForm
          mode="edit"
          itemId={id}
          initialData={{
            name: item.name,
            quantity: item.quantity,
            comment: item.comment ?? '',
          }}
        />
      </main>
    </>
  )
}
