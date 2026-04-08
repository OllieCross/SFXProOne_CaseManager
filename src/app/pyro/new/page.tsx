import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import PyroEditorForm from '@/components/forms/PyroEditorForm'

export default async function NewPyroPage() {
  const session = await auth()
  if (!session) redirect('/login')
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) redirect('/editor')

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-16">
        <h1 className="text-xl font-bold">New Pyro Effect</h1>
        <PyroEditorForm mode="create" />
      </main>
    </>
  )
}
