import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Dashboard } from '@/components/guild/dashboard'
import { GuildNavigation } from '@/components/guild/navigation'
import { getCurrentGuildUser } from '@/lib/auth/users'
import { getDashboardData } from '@/lib/dashboard'

export const metadata: Metadata = { title: 'Panel de Control | Faek Taxi Guild Manager' }

export default async function AdminPage() {
  const currentUser = await getCurrentGuildUser()
  if (!currentUser) redirect('/')
  if (currentUser.role !== 'admin' && currentUser.role !== 'staff') redirect('/authenticated')

  const dashboardData = await getDashboardData(currentUser)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <GuildNavigation canManage />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-3xl border border-violet-300/60 bg-gradient-to-br from-violet-400/10 via-card/80 to-card/50 p-6 shadow-[0_0_24px_rgba(139,92,246,0.12)] sm:p-8"><p className="text-sm text-muted-foreground">Centro de control</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Panel de Control</h1><p className="mt-2 text-violet-200">Resumen operativo del guild y accesos rápidos de gestión.</p></section>
        <section aria-labelledby="admin-actions-title">
          <h2 id="admin-actions-title" className="sr-only">Acciones de gestión</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/attendance" className="group rounded-2xl border border-violet-300/25 bg-violet-400/10 p-4 transition duration-200 hover:border-violet-300/70 hover:bg-violet-400/20 hover:shadow-lg hover:shadow-violet-500/15">
              <span className="text-sm font-semibold transition-colors text-violet-100 group-hover:text-white">Gestionar Attendance</span>
              <span className="mt-1 block text-xs text-muted-foreground">Abrir la gestión de asistencia</span>
            </Link>
            <Link href="/admin/announcements" className="group rounded-2xl border border-violet-300/25 bg-violet-400/10 p-4 transition duration-200 hover:border-violet-300/70 hover:bg-violet-400/20 hover:shadow-lg hover:shadow-violet-500/15">
              <span className="text-sm font-semibold transition-colors text-violet-100 group-hover:text-white">Gestionar Anuncios</span>
              <span className="mt-1 block text-xs text-muted-foreground">Publicar comunicados del guild</span>
            </Link>
            <Link href="/admin/schedules" className="group rounded-2xl border border-violet-300/25 bg-violet-400/10 p-4 transition duration-200 hover:border-violet-300/70 hover:bg-violet-400/20 hover:shadow-lg hover:shadow-violet-500/15">
              <span className="text-sm font-semibold transition-colors text-violet-100 group-hover:text-white">Gestionar Cronograma</span>
              <span className="mt-1 block text-xs text-muted-foreground">Planificación de horarios del guild</span>
            </Link>
            <Link href="/admin/appearance" className="group rounded-2xl border border-amber-300/50 bg-amber-400/10 p-4 transition duration-200 hover:border-amber-300/80 hover:bg-amber-400/20 hover:shadow-lg hover:shadow-amber-500/15"><span className="text-sm font-semibold text-amber-100 group-hover:text-white">Apariencia</span><span className="mt-1 block text-xs text-amber-100/70">Logo y fondo global</span></Link><Link href="/admin/users" className="group rounded-2xl border border-violet-300/25 bg-violet-400/10 p-4 transition duration-200 hover:border-violet-300/70 hover:bg-violet-400/20 hover:shadow-lg hover:shadow-violet-500/15">
              <span className="text-sm font-semibold transition-colors text-violet-100 group-hover:text-white">Gestionar Usuarios</span>
              <span className="mt-1 block text-xs text-muted-foreground">Aprobaciones y roles del guild</span>
            </Link>
          </div>
        </section>
        <Dashboard data={dashboardData} showHeader={false} />
        <Link href="/authenticated" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Volver a Inicio</Link>
      </div>
    </main>
  )
}
