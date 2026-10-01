import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const BUCKET = 'profile-photos'
const MAX_BYTES = 5 * 1024 * 1024
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export type AppearanceSettings = { bannerPath: string | null; bannerUrl: string | null }

export async function getAppearanceSettings(): Promise<AppearanceSettings> {
  try {
    const db = getSupabaseAdmin()
    const { data, error } = await db.from('appearance_settings').select('banner_path').eq('id', true).maybeSingle()
    if (error) {
      console.error('[appearance] No se pudo leer la configuración', error)
      return { bannerPath: null, bannerUrl: null }
    }
    if (!data?.banner_path) return { bannerPath: null, bannerUrl: null }

    const { data: signed, error: signedError } = await db.storage.from(BUCKET).createSignedUrl(data.banner_path, 3600)
    if (signedError || !signed?.signedUrl) {
      console.error('[appearance] No se pudo generar la URL firmada', signedError)
      return { bannerPath: data.banner_path, bannerUrl: null }
    }
    return { bannerPath: data.banner_path, bannerUrl: signed.signedUrl }
  } catch (error) {
    console.error('[appearance] Error inesperado leyendo la configuración', error)
    return { bannerPath: null, bannerUrl: null }
  }
}

function isBlobFile(value: unknown): value is Blob {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'size' in value &&
      'type' in value &&
      typeof value.size === 'number' &&
      typeof value.type === 'string' &&
      typeof (value as Blob).arrayBuffer === 'function',
  )
}

export function validateBannerFile(file: FormDataEntryValue | null): Blob {
  if (!isBlobFile(file) || file.size === 0) throw new Error('Selecciona una imagen')
  if (file.size > MAX_BYTES || !TYPES.has(file.type)) throw new Error('Usa JPG, PNG o WEBP de hasta 5 MB')
  return file
}

export async function uploadBanner(file: Blob) {
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `appearance/banner.${extension}`
  const db = getSupabaseAdmin()
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const { data, error: uploadError } = await db.storage.from(BUCKET).upload(path, buffer, { contentType: file.type, upsert: true })
  if (uploadError) throw new Error(`No se pudo subir la imagen: ${uploadError.message}`)
  return path
}
