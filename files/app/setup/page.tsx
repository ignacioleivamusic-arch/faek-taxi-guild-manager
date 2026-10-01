import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SetupDashboard } from '@/components/setup/setup-wizard'
import { getSetupSnapshot, requireSetupAdmin } from '@/lib/setup/diagnostics'

export const metadata: Metadata = { title: 'Diagnóstico | Faek Taxi Guild Manager', description: 'Diagnóstico de configuración del proyecto para administradores.' }
export const dynamic = 'force-dynamic'

export default async function SetupPage() {
  const admin = await requireSetupAdmin()
  if (!admin) redirect('/authenticated')
  const snapshot = await getSetupSnapshot()
  return <SetupDashboard snapshot={snapshot} />
}
