'use client'

import { useState } from 'react'
import { cancelSchedule, publishSchedule, removeSchedule, saveSchedule } from '@/app/admin/schedules/actions'
import type { Schedule } from '@/lib/schedules'
import { scheduleLine } from '@/lib/schedule-format'

const eventTypes = ['WARGAME', 'BOONSTONE', 'RIFTSTONE', 'OTRO'] as const

export function ScheduleManager({ schedules }: { schedules: Schedule[] }) {
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [eventType, setEventType] = useState<Schedule['event_type']>(editing?.event_type ?? 'OTRO')
  const action = async (work: () => Promise<void>) => { setPending(true); setMessage(null); try { await work(); setEditing(null); window.location.reload() } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo completar la acción') } finally { setPending(false) } }
  return <div className="space-y-6">
    <form action={(formData) => action(() => saveSchedule(formData))} className="grid gap-4 rounded-2xl border border-white/10 bg-background/30 p-5 sm:grid-cols-2">
      <input type="hidden" name="id" value={editing?.id ?? ''} />
      <label className="text-sm">Tipo de Evento<select name="eventType" defaultValue={editing?.event_type ?? 'OTRO'} onChange={(event) => setEventType(event.target.value as Schedule['event_type'])} required className="mt-1 w-full rounded-xl border border-white/10 bg-background px-3 py-2 focus:border-violet-400/60 outline-none">{eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
      {eventType !== 'OTRO' && <label className="text-sm">vs Guild<input name="vsGuild" defaultValue={editing?.vs_guild ?? ''} maxLength={120} placeholder="Nombre de la guild rival" className="mt-1 w-full rounded-xl border border-white/10 bg-background px-3 py-2 focus:border-violet-400/60 outline-none" /></label>}
      <label className="text-sm sm:col-span-2">Stone (Boss)<input name="stoneBoss" defaultValue={editing?.stone_boss ?? ''} maxLength={120} placeholder="Ej. TALUS" className="mt-1 w-full rounded-xl border border-white/10 bg-background px-3 py-2 focus:border-violet-400/60 outline-none" /></label>
      <label className="text-sm">Fecha<input type="date" name="eventDate" defaultValue={editing?.event_date ?? ''} required className="mt-1 w-full rounded-xl border border-white/10 bg-background px-3 py-2 focus:border-violet-400/60 outline-none" /></label>
      <div className="grid grid-cols-2 gap-3"><label className="text-sm">Inicio<input type="time" name="startTime" defaultValue={editing?.start_time.slice(0, 5) ?? ''} required className="mt-1 w-full rounded-xl border border-white/10 bg-background px-3 py-2 focus:border-violet-400/60 outline-none" /></label><label className="text-sm">Fin<input type="time" name="endTime" defaultValue={editing?.end_time?.slice(0, 5) ?? ''} className="mt-1 w-full rounded-xl border border-white/10 bg-background px-3 py-2 focus:border-violet-400/60 outline-none" /></label></div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="publish" defaultChecked={editing?.status === 'published'} /> Publicar en Inicio y Discord al guardar</label>
      <div className="flex gap-2 sm:col-span-2"><button disabled={pending} className="rounded-xl bg-violet-400 px-4 py-2 text-sm font-semibold text-slate-950">{editing ? 'Guardar cambios' : 'Crear cronograma'}</button>{editing && <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm">Cancelar</button>}</div>
      {message && <p className="text-sm text-rose-200 sm:col-span-2" role="alert">{message}</p>}
    </form>
    <div className="space-y-3">{schedules.length === 0 ? <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-muted-foreground">Todavía no hay cronogramas.</p> : schedules.map((schedule) => <article key={schedule.id} className="rounded-xl border border-white/10 bg-background/30 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{scheduleLine(schedule)}</p><p className="mt-1 text-sm text-muted-foreground">{schedule.event_date} · {schedule.start_time.slice(0, 5)}{schedule.end_time ? `–${schedule.end_time.slice(0, 5)}` : ''}</p></div><span className="rounded-full border border-white/10 px-2 py-1 text-xs uppercase">{schedule.status}</span></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => { setEditing(schedule); setEventType(schedule.event_type) }} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs">Editar</button>{schedule.status !== 'published' && <button type="button" disabled={pending} onClick={() => action(() => publishSchedule(schedule.id))} className="rounded-lg bg-violet-400 px-3 py-1.5 text-xs font-semibold text-slate-950">Publicar</button>}{schedule.status === 'published' && <button type="button" disabled={pending} onClick={() => action(() => cancelSchedule(schedule.id))} className="rounded-lg border border-rose-400/30 px-3 py-1.5 text-xs text-rose-200">Cancelar publicación</button>}<button type="button" disabled={pending} onClick={() => action(() => removeSchedule(schedule.id))} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs">Eliminar</button></div></article>)}</div>
  </div>
}
