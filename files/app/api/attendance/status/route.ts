import { NextResponse } from 'next/server'
import { getAttendanceStatus } from '@/lib/attendance-status'
import { requireApprovedUser } from '@/lib/auth/users'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await requireApprovedUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await getAttendanceStatus()
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}
