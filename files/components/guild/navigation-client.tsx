'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/guild/theme-toggle'

export function NavigationClient({ canManage }: { canManage: boolean }) {
  const pathname = usePathname()
  const isManagementContext = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAdminActive = pathname === '/admin' || pathname.startsWith('/admin/')
  const containerStyles = isManagementContext ? 'border-violet-300/70 shadow-[0_0_22px_rgba(139,92,246,0.16)]' : 'border-amber-300/70 shadow-[0_0_22px_rgba(251,191,36,0.14)]'
  const itemStyles = (active: boolean) => active
    ? isManagementContext ? 'bg-violet-400/15 text-violet-200 shadow-sm shadow-violet-400/10 hover:bg-violet-400/20' : 'bg-amber-400/10 text-amber-200 shadow-sm shadow-amber-400/10 hover:bg-amber-400/15'
    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'

  return <nav aria-label="Navegación principal" className="relative z-10 px-4 pt-4 sm:px-6">
    <div className={`mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border bg-card/95 px-3 py-2.5 shadow-lg backdrop-blur-md sm:px-4 ${containerStyles}`}>
      <span aria-hidden="true" />
      <div className="flex items-center justify-center gap-1.5">
        <ThemeToggle />
        <Link href="/authenticated" aria-current={pathname === '/authenticated' ? 'page' : undefined} className={`rounded-xl px-3 py-2 text-sm transition-colors duration-200 ${itemStyles(pathname === '/authenticated')}`}>Inicio</Link>
        <Link href="/roster" aria-current={pathname === '/roster' ? 'page' : undefined} className={`rounded-xl px-3 py-2 text-sm transition-colors duration-200 ${itemStyles(pathname === '/roster')}`}>Roster</Link>
        <Link href="/board" aria-current={pathname === '/board' ? 'page' : undefined} className={`rounded-xl px-3 py-2 text-sm transition-colors duration-200 ${itemStyles(pathname === '/board')}`}>Board</Link>
        <Link href="/attendance/status" aria-current={pathname.startsWith('/attendance') ? 'page' : undefined} className={`rounded-xl px-3 py-2 text-sm transition-colors duration-200 ${itemStyles(pathname.startsWith('/attendance'))}`}>Attendance</Link>
        <Link href="/profile" aria-current={pathname.startsWith('/profile') ? 'page' : undefined} className={`rounded-xl px-3 py-2 text-sm transition-colors duration-200 ${itemStyles(pathname.startsWith('/profile'))}`}>Perfil</Link>
      </div>
      <div className="flex justify-end">{canManage && <Link href="/admin" aria-current={isAdminActive ? 'page' : undefined} className={`rounded-xl px-3 py-2 text-sm transition-colors duration-200 ${isAdminActive ? 'bg-violet-400/15 text-violet-200 shadow-sm shadow-violet-400/10 hover:bg-violet-400/20' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>Panel de Control</Link>}</div>
    </div>
  </nav>
}
