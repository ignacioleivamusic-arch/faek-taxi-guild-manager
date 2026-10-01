import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { BannerEditor } from '@/components/admin/appearance-settings'
import { GuildNavigation } from '@/components/guild/navigation'
import { getAppearanceSettings } from '@/lib/appearance'
import { getCurrentGuildUser, canManageAsActor } from '@/lib/auth/users'

export const metadata: Metadata = { title: 'Apariencia | Faek Taxi Guild Manager' }

export default async function AppearancePage() {
  const user = await getCurrentGuildUser()
  if (!user) redirect('/')
  if (!canManageAsActor(user)) redirect('/authenticated')
  const appearance = await getAppearanceSettings()
  return <main className="min-h-screen bg-background text-foreground"><GuildNavigation canManage /><div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10"><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-muted-foreground">ADMINISTRACIÓN</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Apariencia</h1><p className="mt-2 text-violet-200">Configura el banner del gremio.</p></div><Link href="/authenticated" aria-label="Volver al Panel de Control" className="rounded-xl border border-violet-300/30 px-3 py-2 text-sm text-violet-100 hover:bg-violet-400/10">←</Link></div><BannerEditor bannerUrl={appearance.bannerUrl} /></div></main>
}
