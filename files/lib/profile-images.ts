import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function getProfileImageUrls(paths: Array<string | null | undefined>) {
  const unique = [...new Set(paths.filter((path): path is string => Boolean(path)))]
  const entries = await Promise.all(unique.map(async (path) => {
    const { data } = await getSupabaseAdmin().storage.from('profile-photos').createSignedUrl(path, 3600)
    return [path, data?.signedUrl ?? null] as const
  }))
  return new Map(entries)
}
