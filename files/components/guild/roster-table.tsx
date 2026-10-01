'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { RosterMember } from '@/lib/auth/users'

const combatStyles = { DPS: 'border-rose-400/25 bg-rose-400/10 text-rose-200', HEAL: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200', TANK: 'border-sky-400/25 bg-sky-400/10 text-sky-200' }
const guildStyles = { Administrador: 'text-rose-200', Staff: 'text-orange-200', Miembro: 'text-yellow-200' }
const roleOrder = { DPS: 0, HEAL: 1, TANK: 2 }
type SortKey = 'name-asc' | 'name-desc' | 'class-asc' | 'class-desc' | 'gear-desc' | 'gear-asc' | 'role'

function initials(member: RosterMember) { return (member.display_name || member.discord_user_id).slice(0, 2).toUpperCase() }
function name(member: RosterMember) { return member.display_name || member.discord_user_id }
function guildRole(member: RosterMember) { return member.guild_role === 'admin' ? 'Administrador' : member.guild_role === 'staff' ? 'Staff' : 'Miembro' }

export function RosterTable({ members, caption = 'Roster de miembros activos' }: { members: RosterMember[]; caption?: string }) {
  const [sort, setSort] = useState<SortKey>('name-asc')
  const sorted = useMemo(() => [...members].sort((a, b) => {
    const direction = sort.endsWith('desc') ? -1 : 1
    if (sort === 'role') return roleOrder[a.combat_role] - roleOrder[b.combat_role] || name(a).localeCompare(name(b), 'es')
    if (sort.startsWith('gear')) return ((a.gear_score ?? -1) - (b.gear_score ?? -1)) * (sort === 'gear-desc' ? -1 : 1) || name(a).localeCompare(name(b), 'es')
    const aValue = (sort.startsWith('class') ? a.class_name : name(a)) || ''
    const bValue = (sort.startsWith('class') ? b.class_name : name(b)) || ''
    return aValue.localeCompare(bValue, 'es') * direction || name(a).localeCompare(name(b), 'es')
  }), [members, sort])
  return <div className="overflow-x-auto"><div className="flex items-center justify-end gap-2 border-b border-white/10 px-6 py-3"><label htmlFor="roster-sort" className="text-xs text-muted-foreground">Ordenar</label><select id="roster-sort" value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="rounded-lg border border-white/10 bg-background px-3 py-1.5 text-xs"><option value="name-asc">Nombre A → Z</option><option value="name-desc">Nombre Z → A</option><option value="class-asc">Clase A → Z</option><option value="class-desc">Clase Z → A</option><option value="gear-desc">Gear Score mayor → menor</option><option value="gear-asc">Gear Score menor → mayor</option><option value="role">Función: DPS → HEAL → TANK</option></select></div><table className="w-full min-w-[760px] text-left text-sm"><caption className="sr-only">{caption}</caption><thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-[0.16em] text-muted-foreground"><tr><th className="px-6 py-4 font-medium">Miembro</th><th className="px-6 py-4 font-medium">Función</th><th className="px-6 py-4 font-medium">Clase</th><th className="px-6 py-4 font-medium">Armas</th><th className="px-6 py-4 font-medium">Gear Score</th></tr></thead><tbody className="divide-y divide-white/10">{sorted.map((member) => <tr key={member.id} className="transition hover:bg-white/[0.03]"><td className="px-6 py-4"><Link href={`/profile/${member.id}`} className="flex items-center gap-3 hover:text-violet-300">{member.profile_image_signed_url ? <img src={member.profile_image_signed_url} alt="" className="size-9 rounded-full object-cover" /> : <span className="flex size-9 items-center justify-center rounded-full bg-violet-400/15 text-xs font-bold text-violet-200">{initials(member)}</span>}<span><span className="block font-medium">{name(member)}</span><span className={`block text-xs font-medium ${guildStyles[guildRole(member) as keyof typeof guildStyles]}`}>{guildRole(member)}</span></span></Link></td><td className="px-6 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${combatStyles[member.combat_role]}`}>{member.combat_role}</span></td><td className="px-6 py-4 text-muted-foreground">{member.class_name || '—'}</td><td className="px-6 py-4 text-muted-foreground">{[member.weapon_1, member.weapon_2].filter(Boolean).join(' / ') || '—'}</td><td className="px-6 py-4 text-muted-foreground">{member.gear_score?.toLocaleString('en-US') || '—'}</td></tr>)}</tbody></table></div>
}
