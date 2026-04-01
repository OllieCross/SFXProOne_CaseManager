import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import ConsumableForm from '@/components/forms/ConsumableForm'

export default async function NewConsumablePage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) redirect('/editor')

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-16">
        <h1 className="text-xl font-bold">New Consumable</h1>
        <ConsumableForm mode="create" />
      </main>
    </>
  )
}
