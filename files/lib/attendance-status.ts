import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { listAttendanceEvents } from '@/lib/attendance'

export type AttendanceStatusPlayer = { id: string; name: string; registeredAt: string | null; present: boolean }
export type AttendanceStatusParty = { id: string; name: string; players: AttendanceStatusPlayer[] }
export type AttendancePreviousEvent = { id: string; name: string; occurredAt: string; expected: number; present: number }
export type AttendanceStatusData = {
  event: { id: string; name: string; openedAt: string | null; expiresAt: string | null; board: { id: string; name: string } | null } | null
  previousEvents: AttendancePreviousEvent[]
  parties: AttendanceStatusParty[]
  replacements: AttendanceStatusPlayer[]
  totalExpected: number
  expectedPresent: number
  totalRegistered: number
  percentage: number
  ended: boolean
}

type Roster = { id: string; display_name: string | null; discord_user_id: string }
type AttendanceRow = { roster_member_id: string; created_at: string }
type Party = { id: string; title: string }
type Assignment = { party_id: string; roster_member_id: string }

export async function getAttendanceStatus(): Promise<AttendanceStatusData> {
  const db = getSupabaseAdmin()
  const now = new Date().toISOString()
  await db.from('attendance_events').update({ status: 'closed', closed_at: now }).eq('status', 'active').not('expires_at', 'is', null).lte('expires_at', now)

  const [eventResult, rosterResult] = await Promise.all([
    db.from('attendance_events').select('id, name, board_id, opened_at, expires_at').eq('status', 'active').gt('expires_at', now).order('opened_at', { ascending: false }).maybeSingle<{ id: string; name: string; board_id: string | null; opened_at: string | null; expires_at: string | null }>(),
    db.from('roster_members').select('id, display_name, discord_user_id').eq('is_active', true).returns<Roster[]>(),
  ])
  if (eventResult.error) throw new Error(`Failed to load active attendance: ${eventResult.error.message}`)
  if (rosterResult.error) throw new Error(`Failed to load attendance roster: ${rosterResult.error.message}`)

  const allEvents = await listAttendanceEvents()
  const previousEvents = allEvents.filter((row) => row.id !== eventResult.data?.id && row.status !== 'active').map((row) => ({ id: row.id, name: row.name, occurredAt: row.opened_at ?? row.created_at, expected: rosterResult.data?.length ?? 0, present: row.registered_count ?? 0 }))
  if (!eventResult.data) return { event: null, previousEvents, parties: [], replacements: [], totalExpected: 0, expectedPresent: 0, totalRegistered: 0, percentage: 0, ended: true }

  const boardId = eventResult.data.board_id
  if (!boardId) throw new Error('La asistencia activa no tiene Board asociado.')
  const [boardResult, partiesResult, assignmentsResult, recordsResult] = await Promise.all([
    db.from('boards').select('id, title').eq('id', boardId).single<{ id: string; title: string }>(),
    db.from('board_parties').select('id, title').eq('board_id', boardId).order('sort_order').order('created_at').returns<Party[]>(),
    db.from('board_party_members').select('party_id, roster_member_id').eq('board_id', boardId).returns<Assignment[]>(),
    db.from('attendance_records').select('roster_member_id, created_at').eq('attendance_event_id', eventResult.data.id).returns<AttendanceRow[]>(),
  ])
  if (boardResult.error) throw new Error(`Failed to load attendance board: ${boardResult.error.message}`)
  if (partiesResult.error) throw new Error(`Failed to load attendance parties: ${partiesResult.error.message}`)
  if (assignmentsResult.error) throw new Error(`Failed to load attendance assignments: ${assignmentsResult.error.message}`)
  if (recordsResult.error) throw new Error(`Failed to load attendance records: ${recordsResult.error.message}`)

  const roster = rosterResult.data ?? []
  const rosterById = new Map(roster.map((member) => [member.id, member]))
  const recordsById = new Map((recordsResult.data ?? []).map((record) => [record.roster_member_id, record.created_at]))
  const assignedIds = new Set((assignmentsResult.data ?? []).map((assignment) => assignment.roster_member_id))
  const player = (member: Roster): AttendanceStatusPlayer => ({ id: member.id, name: member.display_name?.trim() || member.discord_user_id, registeredAt: recordsById.get(member.id) ?? null, present: recordsById.has(member.id) })
  const parties = (partiesResult.data ?? []).map((party) => ({ id: party.id, name: party.title, players: (assignmentsResult.data ?? []).filter((assignment) => assignment.party_id === party.id).map((assignment) => rosterById.get(assignment.roster_member_id)).filter((member): member is Roster => Boolean(member)).map(player) }))
  const replacements = roster.filter((member) => !assignedIds.has(member.id)).map(player)
  const expectedPlayers = [...parties.flatMap((party) => party.players), ...replacements]
  const expectedPresent = expectedPlayers.filter((entry) => entry.present).length
  const totalExpected = expectedPlayers.length
  return { event: { id: eventResult.data.id, name: eventResult.data.name, openedAt: eventResult.data.opened_at, expiresAt: eventResult.data.expires_at, board: { id: boardResult.data.id, name: boardResult.data.title } }, previousEvents, parties, replacements, totalExpected, expectedPresent, totalRegistered: recordsResult.data?.length ?? 0, percentage: totalExpected ? Math.round((expectedPresent / totalExpected) * 1000) / 10 : 0, ended: false }
}

export function serializeAttendanceStatus(data: AttendanceStatusData) { return data }
