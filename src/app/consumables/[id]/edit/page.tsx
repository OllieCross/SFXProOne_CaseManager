import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import ConsumableForm from '@/components/forms/ConsumableForm'

export default async function EditConsumablePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) redirect('/editor')

  const { id } = await params
  const consumable = await prisma.consumable.findUnique({ where: { id } })
  if (!consumable) notFound()

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-16">
        <h1 className="text-xl font-bold">Edit Consumable</h1>
        <ConsumableForm
          mode="edit"
          consumableId={id}
          initialData={{
            name: consumable.name,
            unit: consumable.unit,
            stockQuantity: consumable.stockQuantity,
            notes: consumable.notes ?? '',
          }}
        />
      </main>
    </>
  )
}
