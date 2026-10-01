'use client'

import { useEffect, useState } from 'react'
import { saveBanner } from '@/app/admin/appearance/actions'

export function BannerEditor({ bannerUrl }: { bannerUrl: string | null }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(bannerUrl)
  const [appliedPreview, setAppliedPreview] = useState<string | null>(bannerUrl)
  const [message, setMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setMessage(null)
  }

  async function handleApply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const file = new FormData(event.currentTarget).get('file')
    if (!file || typeof file !== 'object' || typeof (file as File).size !== 'number' || (file as File).size === 0) {
      setMessage('Selecciona una imagen antes de aplicar.')
      return
    }
    setIsSaving(true)
    setMessage(null)
    try {
      const result = await saveBanner(new FormData(event.currentTarget))
      if (!result.success) {
        setMessage(result.error)
        return
      }
      setAppliedPreview(previewUrl)
      setMessage('Banner aplicado')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el banner.')
    } finally {
      setIsSaving(false)
    }
  }

  return <section className="rounded-2xl border border-amber-300/20 bg-card/70 p-5">
    <h2 className="font-semibold">Banner</h2>
    <p className="mt-1 text-sm text-muted-foreground">La imagen se guarda en la configuración del gremio.</p>
    <div className="mt-4 flex aspect-[1150/200] w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-background/70">
      {previewUrl ? <img src={previewUrl} alt="Vista previa local del banner" className="h-full w-full object-cover" /> : <span className="text-sm text-muted-foreground">Sin imagen configurada</span>}
    </div>
    <form onSubmit={handleApply} className="mt-4 flex flex-wrap items-center gap-3">
      <label className="cursor-pointer rounded-xl border border-amber-300/40 bg-amber-400/10 px-3 py-2 text-sm font-medium text-amber-100 hover:bg-amber-400/20">
        <span>Seleccionar imagen</span>
        <input name="file" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleFileChange} />
      </label>
      <button type="submit" disabled={isSaving} className="rounded-xl bg-amber-400 px-3 py-2 text-sm font-semibold text-black disabled:cursor-wait disabled:opacity-60">{isSaving ? 'Guardando…' : 'Aplicar'}</button>
      <span className="text-xs text-muted-foreground">Se guarda en Supabase</span>
    </form>
    {message && <p className="mt-3 text-sm text-amber-100" role="status">{message}</p>}
    {appliedPreview && <p className="sr-only">Preview aplicado localmente</p>}
  </section>
}
