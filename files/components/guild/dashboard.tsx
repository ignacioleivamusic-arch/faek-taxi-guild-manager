import Link from 'next/link'
import { BoardBrowser } from '@/components/guild/board-browser'
import type { DashboardData } from '@/lib/dashboard'
import { formatRelativeTime } from '@/lib/dashboard'

const roleLabel = { member: 'Miembro Oficial Faek Taxi', staff: 'Staff Oficial Faek Taxi', admin: 'Administrador Oficial Faek Taxi' } as const

function Metric({ label, value, hint }: { label: string; value: number | null; hint: string }) {
  return <article className="rounded-2xl border border-white/10 bg-card/80 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value ?? '—'}</p><p className="mt-1 text-xs text-muted-foreground">{hint}</p></article>
}

function Status({ label, operational }: { label: string; operational: boolean }) {
  return <div className="flex items-center justify-between border-b border-white/5 py-3 last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className={`inline-flex items-center gap-2 text-sm ${operational ? 'text-emerald-300' : 'text-amber-300'}`}><span className="size-2 rounded-full bg-current" aria-hidden="true" />{operational ? 'Operativo' : 'No disponible'}</span></div>
}

export function Dashboard({ data, showHeader = true }: { data: DashboardData; showHeader?: boolean }) {
  const board = data.currentBoard
  const assignments = board?.assignments ?? []
  const partiesWithMembers = new Map<string, number>()
  assignments.forEach((assignment) => partiesWithMembers.set(assignment.party_id, (partiesWithMembers.get(assignment.party_id) ?? 0) + 1))
  const incomplete = board?.parties.filter((party) => (partiesWithMembers.get(party.id) ?? 0) < 6) ?? []
  const available = data.boards[0]?.available ?? 0

  return <div className="space-y-8">
    {showHeader && <section className="rounded-3xl border border-violet-300/15 bg-gradient-to-br from-violet-400/10 via-card/80 to-card/50 p-6 sm:p-8"><p className="text-sm text-muted-foreground">Centro de control</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Hola, @{data.user.username}</h1><p className="mt-2 text-violet-200">{roleLabel[data.user.role as keyof typeof roleLabel]}</p></section>}
    <section aria-label="Resumen" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Miembros activos" value={data.summary.activeMembers} hint="Roster activo" /><Metric label="Staff" value={data.summary.staff} hint="Staff y administradores" /><Metric label="Pendientes" value={data.summary.pendingUsers} hint="Esperando aprobación" /><Metric label="Jugadores en board" value={data.summary.boardPlayers} hint="Asignados actualmente" /></section>
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <section className="rounded-3xl border border-white/10 bg-card/80 p-6" aria-labelledby="current-board"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Boards</p></div></div><BoardBrowser boards={data.boards} /></section>
      <section className="rounded-3xl border border-white/10 bg-card/80 p-6" aria-labelledby="latest-announcements"><div className="flex items-center justify-between gap-3"><h2 id="latest-announcements" className="text-lg font-semibold">Últimos anuncios</h2><Link href="/authenticated" className="text-sm text-violet-300 hover:text-violet-200">Ver anuncios <span aria-hidden="true">→</span></Link></div><div className="mt-5 space-y-4">{data.announcements.length ? data.announcements.map((announcement) => <article key={announcement.id} className="border-b border-white/10 pb-4 last:border-0 last:pb-0"><h3 className="font-medium">{announcement.title}</h3><p className="mt-1 text-xs text-muted-foreground">Publicado {formatRelativeTime(announcement.created_at)}</p></article>) : <p className="rounded-2xl bg-white/5 p-5 text-sm text-muted-foreground">Todavía no hay anuncios publicados.</p>}</div></section>
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-white/10 bg-card/80 p-6" aria-labelledby="incomplete-parties"><div className="flex items-center justify-between gap-3"><h2 id="incomplete-parties" className="text-lg font-semibold">Parties incompletas</h2><Link href="/board" className="text-sm text-violet-300 hover:text-violet-200">Gestionar <span aria-hidden="true">→</span></Link></div>{board && incomplete.length ? <div className="mt-5 space-y-3">{incomplete.map((party) => <div key={party.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm"><span>{party.title}</span><span className="text-muted-foreground">{partiesWithMembers.get(party.id) ?? 0} / 6</span></div>)}<p className="pt-2 text-sm text-muted-foreground">{available} jugadores disponibles</p></div> : <p className="mt-5 rounded-2xl bg-emerald-400/10 p-5 text-sm text-emerald-200">{board ? 'Todas las parties están completas.' : 'No hay un board activo.'}</p>}</section>
      <section className="rounded-3xl border border-white/10 bg-card/80 p-6" aria-labelledby="pending-users"><div className="flex items-center justify-between gap-3"><h2 id="pending-users" className="text-lg font-semibold">Usuarios pendientes</h2><Link href="/admin" className="text-sm text-violet-300 hover:text-violet-200">Gestionar usuarios <span aria-hidden="true">→</span></Link></div>{data.pendingUsers.length ? <div className="mt-5 space-y-3">{data.pendingUsers.slice(0, 4).map((pending) => <div key={pending.discord_user_id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"><div><p className="text-sm font-medium">{pending.username}</p><p className="text-xs text-muted-foreground">Pendiente {formatRelativeTime(pending.created_at)}</p></div><span className="text-xs text-amber-300">Pendiente</span></div>)}</div> : <p className="mt-5 rounded-2xl bg-white/5 p-5 text-sm text-muted-foreground">No hay usuarios esperando aprobación.</p>}</section>
    </div>
    <section className="rounded-3xl border border-white/10 bg-card/50 px-6 py-5" aria-labelledby="system-status"><div className="flex items-center justify-between"><h2 id="system-status" className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Estado del sistema</h2><span className="text-xs text-muted-foreground">Comprobación actual</span></div><div className="mt-3 grid gap-x-8 md:grid-cols-2"><Status label="Autenticación" operational={data.status.authentication} /><Status label="Base de datos" operational={data.status.database} /><Status label="Roster" operational={data.status.roster} /><Status label="Boards" operational={data.status.boards} /></div></section>
  </div>
}
