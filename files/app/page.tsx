import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginCard } from '@/components/auth/login-card'
import { getCurrentGuildUser } from '@/lib/auth/users'

export const metadata: Metadata = { title: 'Inicio | Faek Taxi Guild Manager' }

export default async function Page() {
  const user = await getCurrentGuildUser()
  if (user) redirect('/authenticated')

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.14),_transparent_45%)]" />
      <div className="relative z-10 w-full max-w-md">
        <LoginCard />
      </div>
    </main>
  )
}

