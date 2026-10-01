import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AttendanceManager } from '@/components/guild/attendance-manager'
import { GuildNavigation } from '@/components/guild/navigation'
import { getCurrentGuildUser, canManageAsActor, requireApprovedUser } from '@/lib/auth/users'
import { getAttendanceEvent, listAttendanceEvents } from '@/lib/attendance'
import { listBoards } from '@/lib/board'

export const metadata: Metadata = { title: 'Attendance | Faek Taxi Guild Manager' }

export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await getCurrentGuildUser()
  const approvedUser = await requireApprovedUser()
  if (!user) redirect('/')
  if (!approvedUser) redirect('/authenticated')
  if (!canManageAsActor(user)) redirect('/authenticated')
  const [events, boards] = await Promise.all([listAttendanceEvents(), listBoards()])
  const params = await searchParams
  const selectedData = params.id ? await getAttendanceEvent(params.id) : null
  const selected = selectedData ? { ...selectedData.event, registered_count: selectedData.records.length } : null
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <GuildNavigation canManage />
      <div className="mx-auto flex w-full max-w-6xl justify-end px-4 pt-4 sm:px-6"><Link href="/authenticated" aria-label="Volver al Panel de Control" className="rounded-xl border border-violet-300/30 px-3 py-2 text-sm text-violet-100 hover:bg-violet-400/10">←</Link></div>
      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-3xl border border-violet-300/60 bg-gradient-to-br from-violet-400/10 via-card/80 to-card/50 p-6 shadow-[0_0_24px_rgba(139,92,246,0.12)] sm:p-8">
          <p className="text-sm text-muted-foreground">Participación del gremio</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Asistencia</h1>
          <p className="mt-2 text-violet-200">Registra y consulta la participación del roster en las actividades de Faek Taxi.</p>
        </section>
        <div className="mt-8">
          <AttendanceManager boards={boards} events={events} selected={selected} records={selectedData?.records ?? []} participants={selectedData?.participants ?? []} />
        </div>
      </div>
    </main>
  )
}
