import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import StandaloneItemForm from '@/components/forms/StandaloneItemForm'

export default async function NewItemPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) redirect('/editor')

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-16">
        <h1 className="text-xl font-bold">New Standalone Item</h1>
        <StandaloneItemForm mode="create" />
      </main>
    </>
  )
}
