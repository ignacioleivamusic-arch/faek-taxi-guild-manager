import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ScheduleManager } from '@/components/guild/schedule-manager'
import { GuildNavigation } from '@/components/guild/navigation'
import { getCurrentGuildUser, isManagementRole } from '@/lib/auth/users'
import { listSchedules } from '@/lib/schedules'

export const metadata: Metadata = { title: 'Cronograma | Faek Taxi Guild Manager' }

export default async function AdminSchedulesPage() {
  const user = await getCurrentGuildUser()
  if (!user) redirect('/')
  if (!isManagementRole(user.role)) redirect('/authenticated')
  const schedules = await listSchedules()
  return <main className="min-h-screen bg-background text-foreground"><GuildNavigation canManage /><div className="mx-auto flex w-full max-w-6xl justify-end px-4 pt-4 sm:px-6"><Link href="/authenticated" aria-label="Volver al Panel de Control" className="rounded-xl border border-violet-300/30 px-3 py-2 text-sm text-violet-100 hover:bg-violet-400/10">←</Link></div><div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">        <section className="rounded-3xl border border-violet-300/60 bg-gradient-to-br from-violet-400/10 via-card/80 to-card/50 p-6 shadow-[0_0_24px_rgba(139,92,246,0.12)] sm:p-8"><p className="text-sm text-muted-foreground">ADMINISTRACIÓN</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Cronograma</h1><p className="mt-2 text-violet-200">Crea, edita y publica la agenda de la guild en Inicio y Discord.</p></section><section className="rounded-2xl border border-violet-300/15 bg-violet-400/[0.04] p-1"><ScheduleManager schedules={schedules} /></section></div></main>
}
