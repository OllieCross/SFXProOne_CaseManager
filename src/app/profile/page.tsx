import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import ProfileForm from '@/components/forms/ProfileForm'

export default async function ProfilePage() {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-16">
        <h1 className="text-xl font-bold">Profile</h1>
        <ProfileForm
          initialName={session.user.name ?? ''}
          hasPassword={true}
        />
      </main>
    </>
  )
}
