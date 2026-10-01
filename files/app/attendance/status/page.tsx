import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AttendanceStatus } from '@/components/guild/attendance-status'
import { GuildNavigation } from '@/components/guild/navigation'
import { canManageAsActor, getCurrentGuildUser, requireApprovedUser } from '@/lib/auth/users'
import { getAttendanceStatus } from '@/lib/attendance-status'

export const metadata: Metadata = { title: 'Asistencia | Faek Taxi Guild Manager', description: 'Estado en vivo de la asistencia del roster de Faek Taxi.' }

export default async function AttendanceStatusPage() {
  const user = await getCurrentGuildUser()
  const approved = await requireApprovedUser()
  if (!user) redirect('/')
  if (!approved) redirect('/authenticated')

  const data = await getAttendanceStatus()
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <GuildNavigation canManage={canManageAsActor(user)} />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-3xl border border-amber-300/60 bg-gradient-to-br from-amber-400/10 via-card/80 to-card/50 p-6 shadow-[0_0_24px_rgba(251,191,36,0.10)] sm:p-8">
          <p className="text-sm text-muted-foreground">Participación del gremio</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Estado de asistencia</h1>
          <p className="mt-2 text-amber-200">Consulta y revisa el estado de participación de los miembros en las actividades del gremio.</p>
        </section>
        <div className="mt-8">
          <AttendanceStatus initialData={data} />
        </div>
      </div>
    </main>
  )
}
