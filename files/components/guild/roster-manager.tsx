'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { createRosterMember, removeRosterMember, updateRosterMember } from '@/app/roster/actions'
import type { RosterMember } from '@/lib/auth/users'

type ApprovedUser = { discord_user_id: string; username: string; role: string }
type Props = { members: RosterMember[]; approvedUsers: ApprovedUser[] }

type FormState = { id?: string; discordUserId: string; displayName: string; className: string; combatRole: RosterMember['combat_role']; weapon1: string; weapon2: string; note: string; isActive: boolean }

const emptyForm: FormState = { discordUserId: '', displayName: '', className: '', combatRole: 'DPS', weapon1: '', weapon2: '', note: '', isActive: true }
function formFromMember(member: RosterMember): FormState {
  return { id: member.id, discordUserId: member.discord_user_id, displayName: member.display_name ?? '', className: member.class_name ?? '', combatRole: member.combat_role, weapon1: member.weapon_1 ?? '', weapon2: member.weapon_2 ?? '', note: member.note ?? '', isActive: member.is_active }
}

export function RosterManager({ members, approvedUsers }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<FormState | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const managedUsers = new Set(members.map((member) => member.discord_user_id))
  const [sort, setSort] = useState('name-asc')
  const sortedMembers = useMemo(() => [...members].sort((a, b) => { const roleOrder = { DPS: 0, HEAL: 1, TANK: 2 }; if (sort === 'role') return roleOrder[a.combat_role] - roleOrder[b.combat_role]; if (sort.startsWith('gear')) return ((a.gear_score ?? -1) - (b.gear_score ?? -1)) * (sort === 'gear-desc' ? -1 : 1); const av = (sort.startsWith('class') ? a.class_name : a.display_name) || ''; const bv = (sort.startsWith('class') ? b.class_name : b.display_name) || ''; return av.localeCompare(bv, 'es') * (sort.endsWith('desc') ? -1 : 1) }), [members, sort])

  async function submit(formData: FormData) {
    const editingId = editing?.id
    if (editingId) formData.set('id', editingId)
    try {
      if (editingId) await updateRosterMember(formData)
      else await createRosterMember(formData)
      setEditing(null)
      router.refresh()
      setMessage({ type: 'success', text: editingId ? 'Miembro actualizado.' : 'Miembro agregado al roster.' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo guardar el miembro.' })
    }
  }

  async function remove(id: string) {
    if (!window.confirm('¿Quitar esta entrada del roster? La cuenta de Discord seguirá intacta.')) return
    const data = new FormData()
    data.set('id', id)
    try { await removeRosterMember(data); setMessage({ type: 'success', text: 'Entrada eliminada del roster.' }); router.refresh() }
    catch (error) { setMessage({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo eliminar.' }) }
  }

  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold">Gestión del roster</h2><p className="mt-1 text-sm text-muted-foreground">Solo Staff y Administradores pueden editar estas fichas.</p></div>
      <button type="button" onClick={() => { setEditing(emptyForm); setMessage(null) }} className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400">Agregar miembro</button>
    </div>
    {message && <p role="status" className={`mb-4 rounded-lg border px-4 py-3 text-sm ${message.type === 'error' ? 'border-rose-400/30 bg-rose-400/10 text-rose-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>{message.text}</p>}
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-card/80">
      <div className="flex justify-end border-b border-white/10 px-5 py-3"><label htmlFor="manager-roster-sort" className="sr-only">Ordenar roster</label><select id="manager-roster-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-white/10 bg-background px-3 py-1.5 text-xs"><option value="name-asc">Nombre A → Z</option><option value="name-desc">Nombre Z → A</option><option value="class-asc">Clase A → Z</option><option value="class-desc">Clase Z → A</option><option value="gear-desc">Gear Score mayor → menor</option><option value="gear-asc">Gear Score menor → mayor</option><option value="role">Función: DPS → HEAL → TANK</option></select></div>
      <table className="w-full min-w-[900px] text-left text-sm"><caption className="sr-only">Roster completo</caption><thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-[0.16em] text-muted-foreground"><tr><th className="px-5 py-4">Miembro</th><th className="px-5 py-4">Función</th><th className="px-5 py-4">Clase</th><th className="px-5 py-4">Armas</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Acciones</th></tr></thead><tbody className="divide-y divide-white/10">{sortedMembers.map((member) => <tr key={member.id} className="hover:bg-white/[0.03]"><td className="px-5 py-4"><div className="flex items-center gap-3">{member.profile_image_signed_url ? <img src={member.profile_image_signed_url} alt="" className="size-9 rounded-full object-cover" /> : <span className="flex size-9 items-center justify-center rounded-full bg-violet-400/15 text-xs font-bold text-violet-200">{(member.display_name || member.discord_user_id).slice(0, 2).toUpperCase()}</span>}<span><span className="block font-medium">{member.display_name || 'Sin nombre'}</span><span className={`block text-xs font-medium ${member.guild_role === 'admin' ? 'text-rose-200' : member.guild_role === 'staff' ? 'text-orange-200' : 'text-yellow-200'}`}>{member.guild_role === 'admin' ? 'Administrador' : member.guild_role === 'staff' ? 'Staff' : 'Miembro'}</span><span className="block text-xs font-normal text-muted-foreground">{member.discord_user_id}</span></span></div></td><td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${member.combat_role === 'DPS' ? 'border-rose-400/25 bg-rose-400/10 text-rose-200' : member.combat_role === 'HEAL' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-sky-400/25 bg-sky-400/10 text-sky-200'}`}>{member.combat_role}</span></td><td className="px-5 py-4 text-muted-foreground">{member.class_name || '—'}</td><td className="px-5 py-4 text-muted-foreground">{[member.weapon_1, member.weapon_2].filter(Boolean).join(' / ') || '—'}</td><td className="px-5 py-4">{member.is_active ? 'Activo' : 'Inactivo'}</td><td className="px-5 py-4"><div className="flex gap-2"><button type="button" onClick={() => setEditing(formFromMember(member))} className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/10">Editar</button><button type="button" onClick={() => remove(member.id)} className="rounded-md border border-rose-400/30 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-400/10">Quitar</button></div></td></tr>)}</tbody></table>
    </div>
    {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="roster-form-title"><form onSubmit={(event) => { event.preventDefault(); void submit(new FormData(event.currentTarget)) }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-card p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="roster-form-title" className="text-xl font-semibold">{editing.id ? 'Editar miembro' : 'Agregar miembro'}</h2><p className="mt-1 text-sm text-muted-foreground">Completa la ficha del jugador vinculado a Discord.</p></div><button type="button" onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground" aria-label="Cerrar">Cerrar</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2 text-sm">Usuario de Discord<select name="discordUserId" value={editing.discordUserId} onChange={(event) => setEditing({ ...editing, discordUserId: event.target.value })} disabled={Boolean(editing.id)} required className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2"><option value="">Selecciona un usuario aprobado</option>{approvedUsers.map((user) => <option key={user.discord_user_id} value={user.discord_user_id} disabled={!editing.id && managedUsers.has(user.discord_user_id)}>{user.username} ({user.role}){managedUsers.has(user.discord_user_id) && !editing.id ? ' — ya está en roster' : ''}</option>)}</select></label><label className="text-sm">Nombre visible<input name="displayName" value={editing.displayName} onChange={(event) => setEditing({ ...editing, displayName: event.target.value })} maxLength={100} className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2" /></label><label className="text-sm">Clase<input name="className" list="guild-class-options" value={editing.className} onChange={(event) => setEditing({ ...editing, className: event.target.value })} maxLength={100} className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2" /><datalist id="guild-class-options"><option value="" /></datalist></label><label className="text-sm">Función<select name="combatRole" value={editing.combatRole} onChange={(event) => setEditing({ ...editing, combatRole: event.target.value as FormState['combatRole'] })} className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2"><option>DPS</option><option>HEAL</option><option>TANK</option></select></label><label className="text-sm">Arma 1<input name="weapon1" value={editing.weapon1} onChange={(event) => setEditing({ ...editing, weapon1: event.target.value })} maxLength={100} className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2" /></label><label className="text-sm">Arma 2<input name="weapon2" value={editing.weapon2} onChange={(event) => setEditing({ ...editing, weapon2: event.target.value })} maxLength={100} className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2" /></label><label className="text-sm sm:col-span-2">Nota<textarea name="note" value={editing.note} onChange={(event) => setEditing({ ...editing, note: event.target.value })} maxLength={500} rows={3} className="mt-1 w-full rounded-lg border border-white/10 bg-background px-3 py-2" /></label><label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="isActive" checked={editing.isActive} onChange={(event) => setEditing({ ...editing, isActive: event.target.checked })} /> Miembro activo</label></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-white/15 px-4 py-2 text-sm">Cancelar</button><button type="submit" className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400">Guardar cambios</button></div></form></div>}
  </>
}
