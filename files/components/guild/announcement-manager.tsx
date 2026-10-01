'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  updateAnnouncementAction,
} from '@/app/authenticated/actions'
import type { Announcement } from '@/lib/auth/users'

type AnnouncementManagerProps = {
  announcements: Announcement[]
  canManage: boolean
  tone?: 'gold' | 'purple'
}

const emptyForm = { title: '', body: '' }

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function AnnouncementManager({ announcements, canManage, tone = 'gold' }: AnnouncementManagerProps) {
  const accent = tone === 'purple' ? { muted: '${accent.muted}', button: 'bg-violet-400 hover:bg-violet-300', hover: 'hover:border-violet-300/30', line: 'bg-violet-300/60', fallback: 'bg-violet-400/15 text-violet-200', focus: '${accent.focus}' } : { muted: 'text-amber-300/80', button: 'bg-amber-400 hover:bg-amber-300', hover: 'hover:border-amber-300/30', line: 'bg-amber-300/60', fallback: 'bg-amber-400/15 text-amber-200', focus: 'focus:border-amber-300/60' }
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setFeedback(null)
    setIsOpen(true)
  }

  function openEdit(announcement: Announcement) {
    setEditingId(announcement.id)
    setForm({ title: announcement.title, body: announcement.body })
    setFeedback(null)
    setIsOpen(true)
  }

  function closeForm() {
    if (!isPending) setIsOpen(false)
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      setFeedback({ type: 'error', message: 'El título y el contenido son obligatorios.' })
      return
    }

    const data = new FormData()
    data.set('title', form.title)
    data.set('body', form.body)
    if (editingId) data.set('id', editingId)

    startTransition(async () => {
      try {
        if (editingId) await updateAnnouncementAction(data)
        else await createAnnouncementAction(data)
        setIsOpen(false)
        setFeedback({ type: 'success', message: editingId ? 'Anuncio actualizado.' : 'Anuncio publicado.' })
        router.refresh()
      } catch (error) {
        setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo guardar el anuncio.' })
      }
    })
  }

  function remove(id: string) {
    if (!window.confirm('¿Eliminar este anuncio? Esta acción no se puede deshacer.')) return
    const data = new FormData()
    data.set('id', id)
    startTransition(async () => {
      try {
        await deleteAnnouncementAction(data)
        setFeedback({ type: 'success', message: 'Anuncio eliminado.' })
        router.refresh()
      } catch (error) {
        setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'No se pudo eliminar el anuncio.' })
      }
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${accent.muted}`}>Actualizaciones</p>
          <h2 id="announcements-title" className="mt-2 text-2xl font-semibold tracking-tight">Últimos comunicados</h2>
        </div>
        {canManage && <button type="button" onClick={openCreate} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-950 transition ${accent.button}`}>Crear anuncio</button>}
      </div>

      {feedback && <p role="status" className={`mt-4 rounded-xl border px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-300/20 bg-red-400/10 text-red-200' : 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200'}`}>{feedback.message}</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {announcements.length > 0 ? announcements.map((announcement) => (
          <article key={announcement.id} className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-5 transition-colors ${accent.hover} hover:bg-card/90`}>
            <div className={`absolute inset-y-5 left-0 w-0.5 rounded-full ${accent.line} opacity-70`} aria-hidden="true" />
            <div className="pl-2">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">{announcement.title}</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{announcement.body}</p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">{announcement.author_profile_image_url ? <img src={announcement.author_profile_image_url} alt="" className="size-7 rounded-full object-cover" /> : <span className={`flex size-7 items-center justify-center rounded-full text-[10px] font-bold ${accent.fallback}`}>{(announcement.author_username ?? announcement.author_discord_user_id).slice(0, 2).toUpperCase()}</span>}<span>Publicado por <span className="font-medium text-foreground">{announcement.author_username ?? announcement.author_discord_user_id}</span></span></p>
                <time dateTime={announcement.created_at}>{formatDate(announcement.created_at)}</time>
              </div>
            </div>
            {canManage && <div className="mt-4 flex gap-2"><button type="button" onClick={() => openEdit(announcement)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/5">Editar</button><button type="button" onClick={() => remove(announcement.id)} disabled={isPending} className="rounded-lg border border-red-300/20 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-400/10 disabled:opacity-50">Eliminar</button></div>}
          </article>
        )) : <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-muted-foreground">No hay anuncios por ahora.</div>}
      </div>

      {isOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm() }}>
        <section role="dialog" aria-modal="true" aria-labelledby="announcement-form-title" className="w-full max-w-xl rounded-2xl border border-white/10 bg-card p-6 shadow-2xl">
          <h2 id="announcement-form-title" className="text-xl font-semibold">{editingId ? 'Editar anuncio' : 'Crear anuncio'}</h2>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-sm font-medium">Título<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={120} className={`mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none ${accent.focus}`} /></label>
            <label className="block text-sm font-medium">Contenido<textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} maxLength={5000} rows={7} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none ${accent.focus}" /></label>
            <div className="flex justify-end gap-3"><button type="button" onClick={closeForm} disabled={isPending} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">Cancelar</button><button type="submit" disabled={isPending} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50 ${accent.button}`}>{isPending ? 'Guardando...' : 'Publicar anuncio'}</button></div>
          </form>
        </section>
      </div>}
    </>
  )
}
