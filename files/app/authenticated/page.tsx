import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AnnouncementManager } from '@/components/guild/announcement-manager'
import { GuildNavigation } from '@/components/guild/navigation'
import { canManageAsActor, getCurrentGuildUser, listAnnouncements } from '@/lib/auth/users'

export const metadata: Metadata = { title: 'Inicio | Faek Taxi Guild Manager' }

export default async function AuthenticatedPage() {
  const user = await getCurrentGuildUser()
  if (!user) redirect('/')

  if (user.role === 'pending') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
        <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-card/95 p-8 text-center shadow-2xl shadow-black/30 sm:p-10">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-xl font-semibold text-violet-200">FT</div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">Faek Taxi Guild Manager</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Gracias por realizar tu autenticación.</h1>
          <p className="mt-5 text-muted-foreground">Tu cuenta está pendiente de aprobación.</p>
          <p className="mt-2 text-muted-foreground">Espera a que un administrador te asigne los permisos correspondientes.</p>
        </section>
      </main>
    )
  }

  const announcements = await listAnnouncements()
  const canManage = canManageAsActor(user)

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <GuildNavigation canManage={canManage} />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-3xl border border-amber-300/60 bg-gradient-to-br from-amber-400/10 via-card/80 to-card/50 p-6 shadow-[0_0_24px_rgba(251,191,36,0.10)] sm:p-8"><p className="text-sm text-muted-foreground">Comunicaciones del gremio</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Inicio</h1><p className="mt-2 text-amber-200">Noticias, comunicados y próximos recursos de Faek Taxi.</p></section>
        <div className="mt-8 flex flex-col gap-8">
          <AnnouncementManager announcements={announcements} canManage={false} tone="gold" />
        </div>
      </div>
    </main>
  )
}
