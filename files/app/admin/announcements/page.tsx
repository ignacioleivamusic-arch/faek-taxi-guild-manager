import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AnnouncementManager } from '@/components/guild/announcement-manager'
import { GuildNavigation } from '@/components/guild/navigation'
import { getCurrentGuildUser, listAnnouncements } from '@/lib/auth/users'

export const metadata: Metadata = { title: 'Anuncios | Faek Taxi Guild Manager' }

export default async function AdminAnnouncementsPage() {
  const currentUser = await getCurrentGuildUser()
  if (!currentUser) redirect('/')
  if (currentUser.role !== 'admin' && currentUser.role !== 'staff') redirect('/authenticated')

  const announcements = await listAnnouncements()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <GuildNavigation canManage />
      <div className="mx-auto flex w-full max-w-6xl justify-end px-4 pt-4 sm:px-6"><Link href="/authenticated" aria-label="Volver al Panel de Control" className="rounded-xl border border-violet-300/30 px-3 py-2 text-sm text-violet-100 hover:bg-violet-400/10">←</Link></div>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-3xl border border-violet-300/60 bg-gradient-to-br from-violet-400/10 via-card/80 to-card/50 p-6 shadow-[0_0_24px_rgba(139,92,246,0.12)] sm:p-8"><p className="text-sm text-muted-foreground">ADMINISTRACIÓN</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Crear anuncios</h1><p className="mt-2 text-violet-200">Gestiona los comunicados de la guild.</p></section>
        <section className="rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-400/10 via-card/80 to-card/60 p-5" aria-labelledby="announcements-title">
          <AnnouncementManager announcements={announcements} canManage tone="purple" />
        </section>
      </div>
    </main>
  )
}
