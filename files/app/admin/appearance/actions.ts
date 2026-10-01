'use server'

import { revalidatePath } from 'next/cache'
import { canManageAsActor, getCurrentGuildUser } from '@/lib/auth/users'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { uploadBanner, validateBannerFile } from '@/lib/appearance'

export async function saveBanner(formData: FormData): Promise<{ success: true; path: string } | { success: false; error: string }> {
  try {
    const user = await getCurrentGuildUser()
    if (!user || !canManageAsActor(user)) return { success: false, error: 'No autorizado' }

    const file = validateBannerFile(formData.get('file'))
    const db = getSupabaseAdmin()
    const { data: current, error: readError } = await db.from('appearance_settings').select('banner_path').eq('id', true).maybeSingle()
    if (readError) return { success: false, error: `No se pudo leer el banner actual: ${readError.message}` }
    const previousPath = current?.banner_path ?? null
    const path = await uploadBanner(file)
    const { error } = await db.from('appearance_settings').upsert({ id: true, banner_path: path, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    if (error) return { success: false, error: `No se pudo guardar el banner: ${error.message}` }
    if (previousPath && previousPath !== path) {
      const { error: cleanupError } = await db.storage.from('profile-photos').remove([previousPath])
      if (cleanupError) console.error('[appearance] No se pudo eliminar el banner anterior', { path: previousPath, error: cleanupError.message })
    }
    revalidatePath('/admin/appearance')
    revalidatePath('/authenticated')
    revalidatePath('/profile')

    return { success: true, path }
  } catch (error) {
    console.error('[appearance] Error inesperado guardando el banner', error)
    return { success: false, error: error instanceof Error ? error.message : 'No se pudo guardar el banner.' }
  }
}
