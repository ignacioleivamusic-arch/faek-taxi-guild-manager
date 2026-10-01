import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { GuildNavigation } from '@/components/guild/navigation'
import { AttendanceHistoryDetail } from '@/components/guild/attendance-history-detail'
import { PageHeader } from '@/components/guild/page-header'
import { canManageAsActor, getCurrentGuildUser, requireApprovedUser } from '@/lib/auth/users'
import { getAttendanceEvent } from '@/lib/attendance'

export const metadata: Metadata = { title: 'Historial de Asistencia | Faek Taxi Guild Manager' }

export default async function AttendanceHistoryPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const user = await getCurrentGuildUser()
  const approved = await requireApprovedUser()
  if (!user) redirect('/')
  if (!approved) redirect('/authenticated')
  const selectedEventId = (await searchParams).event
  if (!selectedEventId) redirect('/attendance/status')
  const detail = await getAttendanceEvent(selectedEventId)
  if (!detail) redirect('/attendance/status')
  return <main className="relative min-h-screen overflow-hidden bg-background text-foreground"><GuildNavigation canManage={canManageAsActor(user)} /><div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6"><PageHeader title="Historial de Asistencia" subtitle="Detalle histórico de la misma asistencia registrada en gestión." /><div className="mt-8"><AttendanceHistoryDetail data={detail} /></div></div></main>
}
