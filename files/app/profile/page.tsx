import type { Metadata } from 'next'
import type React from 'react'
import { notFound, redirect } from 'next/navigation'
import { GuildNavigation } from '@/components/guild/navigation'
import { ProfileEditor } from '@/components/guild/profile-editor'
import { canManageAsActor, getCurrentGuildUser, getGuildUser, listRosterMembers, requireApprovedUser, type RosterMember } from '@/lib/auth/users'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { deriveClass, weaponLabel } from '@/lib/player-builds'

export const metadata: Metadata = { title: 'Perfil | Faek Taxi Guild Manager', description: 'Perfil de jugador, build, armas y estadísticas de asistencia.' }
type Props = { params?: Promise<{ id?: string }> }

const combatRoleStyles = {
  DPS: 'border-rose-400/25 bg-rose-400/10 text-rose-200',
  HEAL: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  TANK: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
} as const

const rolePanelStyles = {
  DPS: 'from-rose-400/[0.2] via-rose-400/[0.08] to-rose-300/[0.12]',
  HEAL: 'from-emerald-400/[0.2] via-emerald-400/[0.08] to-emerald-300/[0.12]',
  TANK: 'from-sky-400/[0.2] via-sky-400/[0.08] to-sky-300/[0.12]',
} as const

const neutralRolePanel = 'from-white/[0.06] via-transparent to-amber-300/[0.08]'

const guildRoleStyles = {
  admin: 'border-rose-400/25 bg-rose-400/10 text-rose-200',
  staff: 'border-orange-400/25 bg-orange-400/10 text-orange-200',
  member: 'border-yellow-400/25 bg-yellow-400/10 text-yellow-200',
  pending: 'border-white/10 bg-white/[0.04] text-muted-foreground',
} as const

const guildRoleLabels = { admin: 'Administrador', staff: 'Staff', member: 'Miembro', pending: 'Pendiente' } as const

async function getProfile(id: string) {
  const { data, error } = await getSupabaseAdmin().from('roster_members').select('id, discord_user_id, display_name, class_name, combat_role, weapon_1, weapon_2, note, gear_score, build_type, profile_image_url, is_active, created_at, updated_at').eq('id', id).maybeSingle<RosterMember>()
  if (error) throw new Error(`Failed to load profile: ${error.message}`)
  return data
}

async function getStats(id: string) {
  const db = getSupabaseAdmin()
  const [{ count: available }, { count: attended }] = await Promise.all([
    db.from('attendance_event_participants').select('id', { count: 'exact', head: true }).eq('roster_member_id', id),
    db.from('attendance_records').select('id', { count: 'exact', head: true }).eq('roster_member_id', id),
  ])
  const total = available ?? 0
  const present = attended ?? 0
  return { total, present, percentage: total ? Math.round((present / total) * 100) : 0 }
}

export default async function ProfilePage({ params }: Props) {
  const viewer = await getCurrentGuildUser()
  const approved = await requireApprovedUser()
  if (!viewer) redirect('/')
  if (!approved) redirect('/authenticated')

  const routeParams = params ? await params : {}
  const ownRoster = (await listRosterMembers(true)).find((member) => member.discord_user_id === viewer.discord_user_id)
  const member = routeParams.id ? await getProfile(routeParams.id) : ownRoster
  if (!member) notFound()
  const profileUser = await getGuildUser(member.discord_user_id)
  if (!profileUser) notFound()

  const manager = canManageAsActor(viewer)
  const canEdit = manager || member.discord_user_id === viewer.discord_user_id
  const stats = await getStats(member.id)
  const avatarUrl = member.profile_image_url ? (await getSupabaseAdmin().storage.from('profile-photos').createSignedUrl(member.profile_image_url, 3600)).data?.signedUrl : null
  const name = member.display_name || profileUser.username
  const initials = name.slice(0, 2).toUpperCase()
  const className = deriveClass(member.weapon_1, member.weapon_2)
  const combatRole = member.combat_role as keyof typeof combatRoleStyles | null
  const rolePanel = combatRole ? rolePanelStyles[combatRole] ?? neutralRolePanel : neutralRolePanel
  const guildRole = (profileUser.role in guildRoleLabels ? profileUser.role : 'member') as keyof typeof guildRoleLabels

  return (
    <main className="min-h-screen bg-background text-foreground">
      <GuildNavigation canManage={manager} />
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-amber-300/60 bg-gradient-to-br from-amber-400/10 via-card/80 to-card/50 p-6 shadow-[0_0_24px_rgba(251,191,36,0.10)] sm:p-8"><p className="text-sm text-muted-foreground">Identidad del miembro</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Mi Perfil</h1><p className="mt-2 text-amber-200">Consulta y administra tu información dentro de Faek Taxi.</p></section>
        <section className="mt-8 overflow-hidden rounded-2xl border border-amber-300/20 bg-card/80 shadow-xl">
          <div className={`border-b border-white/10 bg-gradient-to-r ${rolePanel} p-6 sm:p-8`}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl p-1">
                  {avatarUrl ? <img src={avatarUrl} alt={`Avatar de ${name}`} className="size-full rounded-[0.8rem] object-cover" /> : <div className="flex size-full items-center justify-center rounded-[0.8rem] text-xl font-bold" aria-label={`Avatar de ${name}`}>{initials}</div>}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{profileUser.username}</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{name}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge className={guildRoleStyles[guildRole]}>{guildRoleLabels[guildRole]}</Badge>
                    {combatRole && <Badge className={combatRoleStyles[combatRole]}>{combatRole}</Badge>}
                    <span className="text-sm text-muted-foreground">{className}</span>
                    <span className="text-sm font-semibold text-amber-200">GS {member.gear_score?.toLocaleString('en-US') || '—'}</span>
                  </div>
                </div>
              </div>
              {canEdit && <ProfileEditor member={member} canManage={manager} />}
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <section>
                <SectionTitle>Build</SectionTitle>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Info label="Arma 1" value={weaponLabel(member.weapon_1)} />
                  <Info label="Arma 2" value={weaponLabel(member.weapon_2)} />
                  <Info label="Clase derivada" value={className} />
                  <Info label="Gear Score" value={member.gear_score?.toLocaleString('en-US') || 'Sin definir'} />
                </div>
              </section>
              <section>
                <SectionTitle>Notas</SectionTitle>
                <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-muted-foreground">{member.note || 'Este jugador todavía no ha añadido notas a su perfil.'}</p>
              </section>
            </div>
            <section>
              <SectionTitle>Guild Statistics</SectionTitle>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Stat label="Asistencia" value={`${stats.percentage}%`} />
                <Stat label="Asistidos" value={stats.present} />
                <Stat label="Disponibles" value={stats.total} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{stats.total === 0 ? 'Todavía no hay eventos disponibles para calcular asistencia.' : 'Basado en los eventos registrados del gremio.'}</p>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) { return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span> }
function SectionTitle({ children }: { children: React.ReactNode }) { return <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{children}</h3> }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-2 font-medium text-foreground">{value}</p></div> }
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-4 text-center"><p className="text-2xl font-semibold text-violet-200">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div> }
