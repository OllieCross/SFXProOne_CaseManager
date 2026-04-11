import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Header from '@/components/layout/Header'
import IssuesPageClient from '@/components/issues/IssuesPageClient'
import { formatDate } from '@/lib/utils'

export default async function IssuesPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const [faultyDevices, manualIssues, allCases, allItems, allTanks] = await Promise.all([
    prisma.device.findMany({
      where: { status: { in: ['Faulty', 'InRepair'] }, deletedAt: null },
      orderBy: { name: 'asc' },
      include: {
        logbook: {
          orderBy: { date: 'desc' },
          take: 3,
          include: { user: { select: { name: true } } },
        },
      },
    }),
    prisma.issueEntry.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        device: { select: { id: true, name: true } },
        case: { select: { id: true, name: true } },
        item: { select: { id: true, name: true } },
        tank: { select: { id: true, name: true } },
      },
    }),
    prisma.case.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.item.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true, caseId: true } }),
    prisma.tank.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ])

  const STATUS_LABELS: Record<string, string> = {
    Faulty: 'Faulty', InRepair: 'In Repair',
  }

  const serialized = {
    faultyDevices: faultyDevices.map(d => ({
      id: d.id,
      name: d.name,
      status: d.status,
      statusLabel: STATUS_LABELS[d.status] ?? d.status,
      logbook: d.logbook.map(e => ({
        id: e.id,
        comment: e.comment,
        date: formatDate(e.date),
        userName: e.user?.name ?? 'Deleted user',
      })),
    })),
    manualIssues: manualIssues.map(i => ({
      id: i.id,
      description: i.description,
      createdAt: formatDate(i.createdAt),
      userName: i.user?.name ?? 'Deleted user',
      device: i.device,
      case: i.case,
      item: i.item,
      tank: i.tank,
    })),
    allCases,
    allItems: allItems.map(i => ({ id: i.id, name: i.name, caseId: i.caseId })),
    allTanks,
  }

  return (
    <>
      <Header />
      <IssuesPageClient {...serialized} />
    </>
  )
}
