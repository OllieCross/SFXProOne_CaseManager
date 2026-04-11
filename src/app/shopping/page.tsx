import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import ShoppingPageClient from '@/components/shopping/ShoppingPageClient'

export default async function ShoppingPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const [consumables, tanks, pyros] = await Promise.all([
    prisma.consumable.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }),
    prisma.tank.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }),
    prisma.pyro.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }),
  ])

  return (
    <>
      <Header />
      <ShoppingPageClient consumables={consumables} tanks={tanks} pyros={pyros} />
    </>
  )
}
