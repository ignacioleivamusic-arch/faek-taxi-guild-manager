import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { GuildNavigation } from '@/components/guild/navigation'
import { RosterManager } from '@/components/guild/roster-manager'
import { RosterTable } from '@/components/guild/roster-table'
import { canManageAsActor, getCurrentGuildUser, listApprovedGuildUsers, listRosterMembers, requireApprovedUser } from '@/lib/auth/users'

export const metadata: Metadata = { title: 'Roster | Faek Taxi Guild Manager' }

const roleStyles = {
  DPS: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
  HEAL: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  TANK: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
} as const

export default async function RosterPage() {
  const user = await getCurrentGuildUser()
  const approved = await requireApprovedUser()
  if (!user) redirect('/')
  if (!approved) redirect('/authenticated')

  const canManage = canManageAsActor(user)
  const members = await listRosterMembers(canManage)
  const approvedUsers = canManage ? await listApprovedGuildUsers() : []
  const activeMembers = members.filter((member) => member.is_active)
  const roleCounts = activeMembers.reduce<Record<string, number>>((counts, member) => {
    counts[member.combat_role] = (counts[member.combat_role] ?? 0) + 1
    return counts
  }, {})

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <GuildNavigation canManage={canManage} />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-3xl border border-amber-300/60 bg-gradient-to-br from-amber-400/10 via-card/80 to-card/50 p-6 shadow-[0_0_24px_rgba(251,191,36,0.10)] sm:p-8"><p className="text-sm text-muted-foreground">Nuestra plantilla</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Roster</h1><p className="mt-2 text-amber-200">Consulta la alineación de Faek Taxi, sus roles, clases y principales datos de combate.</p></section>
        <div className="relative mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-white/10 px-3 py-1.5">Activos <strong className="ml-1 text-foreground">{activeMembers.length}</strong></span>
          {(['DPS', 'HEAL', 'TANK'] as const).map((role) => <span key={role} className={`rounded-full border px-3 py-1.5 ${roleStyles[role]}`}>{role} <strong className="ml-1 text-foreground">{roleCounts[role] ?? 0}</strong></span>)}
        </div>

        {canManage ? <section className="mt-8"><RosterManager members={members} approvedUsers={approvedUsers} /></section> : <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-card/80">
          <div className="border-b border-white/10 px-6 py-5"><h2 className="text-lg font-semibold">Miembros activos</h2><p className="mt-1 text-sm text-muted-foreground">{activeMembers.length} {activeMembers.length === 1 ? 'miembro registrado' : 'miembros registrados'}</p></div>
          {activeMembers.length === 0 ? <div className="px-6 py-16 text-center"><p className="text-sm font-medium">Todavía no hay miembros en el roster.</p><p className="mt-2 text-sm text-muted-foreground">Los miembros aparecerán aquí cuando se complete su ficha.</p></div> : <RosterTable members={activeMembers} />}
        </section>}
      </div>
    </main>
  )
}
