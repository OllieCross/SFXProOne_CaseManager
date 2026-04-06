import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import EventForm from '@/components/forms/EventForm'

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')
  if (!['EDITOR', 'ADMIN'].includes(session.user.role)) redirect('/events')

  const { id } = await params

  const [event, allUsers, allCases, allDevices, allItems, allConsumables, allGroups] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        stagehands: { include: { user: { select: { id: true, name: true, email: true } } } },
        cases: { include: { case: { select: { id: true, name: true } } } },
        devices: { include: { device: { select: { id: true, name: true, status: true } } } },
        items: { include: { item: { select: { id: true, name: true, quantity: true } } } },
        consumables: { include: { consumable: { select: { id: true, name: true, unit: true } } } },
      },
    }),
    prisma.user.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, email: true } }),
    prisma.case.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.device.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, status: true } }),
    prisma.item.findMany({ where: { caseId: null }, orderBy: { name: 'asc' }, select: { id: true, name: true, quantity: true } }),
    prisma.consumable.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, unit: true } }),
    prisma.group.findMany({
      orderBy: { name: 'asc' },
      include: {
        cases: { include: { case: { select: { id: true, name: true } } } },
        devices: { include: { device: { select: { id: true, name: true, status: true } } } },
        items: { include: { item: { select: { id: true, name: true, quantity: true } } } },
        consumables: { include: { consumable: { select: { id: true, name: true, unit: true } } } },
      },
    }),
  ])

  if (!event) notFound()

  const members = [
    ...event.stagehands.map((es) => ({
      type: 'stagehand' as const,
      id: es.user.id,
      name: es.user.name,
      email: es.user.email,
    })),
    ...event.cases.map((ec) => ({ type: 'case' as const, id: ec.case.id, name: ec.case.name })),
    ...event.devices.map((ed) => ({ type: 'device' as const, id: ed.device.id, name: ed.device.name, status: ed.device.status })),
    ...event.items.map((ei) => ({ type: 'item' as const, id: ei.item.id, name: ei.item.name, quantity: ei.item.quantity })),
    ...event.consumables.map((ec) => ({
      type: 'consumable' as const,
      id: ec.consumable.id,
      name: ec.consumable.name,
      unit: ec.consumable.unit,
      quantityNeeded: ec.quantityNeeded,
    })),
  ]

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-16">
        <h1 className="text-xl font-bold">Edit Event</h1>
        <EventForm
          mode="edit"
          eventId={id}
          initialData={{
            name: event.name,
            venueName: event.venueName,
            location: event.location ?? '',
            startDate: event.startDate.toISOString(),
            clientName: event.clientName ?? '',
            clientPhone: event.clientPhone ?? '',
            clientEmail: event.clientEmail ?? '',
            comments: event.comments ?? '',
            status: event.status,
            invoiceStatus: event.invoiceStatus,
            members,
          }}
          allUsers={allUsers}
          allCases={allCases}
          allDevices={allDevices}
          allItems={allItems}
          allConsumables={allConsumables}
          allGroups={allGroups}
        />
      </main>
    </>
  )
}
