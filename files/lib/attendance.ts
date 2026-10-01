import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { GuildUser, RosterMember } from '@/lib/auth/users'

export type AttendanceEvent = {
  id: string
  board_id: string | null
  name: string
  description: string | null
  duration_minutes: number
  code: string
  status: 'active' | 'closed'
  created_by: string
  created_at: string
  opened_at: string | null
  closed_at: string | null
  expires_at: string | null
  discord_channel_id: string | null
  discord_message_id: string | null
}

export type AttendanceRecord = {
  id: string
  attendance_event_id: string
  roster_member_id: string
  discord_user_id: string
  created_at: string
  roster_member: Pick<RosterMember, 'id' | 'display_name' | 'discord_user_id'> | null
  guild_user: Pick<GuildUser, 'discord_user_id' | 'username'> | null
}

const eventColumns = 'id, board_id, name, description, duration_minutes, code, status, created_by, created_at, opened_at, closed_at, expires_at, discord_channel_id, discord_message_id'

async function expireAttendanceEvents() {
  await getSupabaseAdmin().from('attendance_events').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('status', 'active').lt('expires_at', new Date().toISOString())
}

export async function listAttendanceEvents() {
  await expireAttendanceEvents()
  const { data, error } = await getSupabaseAdmin().from('attendance_events').select(eventColumns).order('created_at', { ascending: false }).returns<AttendanceEvent[]>()
  if (error) throw new Error(`Failed to list attendance events: ${error.message}`)
  const events = data ?? []
  if (events.length === 0) return []
  const { data: records, error: recordsError } = await getSupabaseAdmin().from('attendance_records').select('attendance_event_id').in('attendance_event_id', events.map((event) => event.id))
  if (recordsError) throw new Error(`Failed to count attendance records: ${recordsError.message}`)
  const counts = new Map<string, number>()
  for (const record of records ?? []) counts.set(record.attendance_event_id, (counts.get(record.attendance_event_id) ?? 0) + 1)
  return events.map((event) => ({ ...event, registered_count: counts.get(event.id) ?? 0 }))
}

export async function getAttendanceEvent(id: string) {
  await expireAttendanceEvents()
  const db = getSupabaseAdmin()
  const { data: event, error } = await db.from('attendance_events').select(eventColumns).eq('id', id).maybeSingle<AttendanceEvent>()
  if (error) throw new Error(`Failed to load attendance event: ${error.message}`)
  if (!event) return null
  const { data: records, error: recordsError } = await db.from('attendance_records').select('id, attendance_event_id, roster_member_id, discord_user_id, created_at').eq('attendance_event_id', id).order('created_at', { ascending: false }).returns<Array<Omit<AttendanceRecord, 'roster_member' | 'guild_user'>>>()
  if (recordsError) throw new Error(`Failed to list attendance records: ${recordsError.message}`)
  const rosterIds = [...new Set((records ?? []).map((record) => record.roster_member_id))]
  const discordIds = [...new Set((records ?? []).map((record) => record.discord_user_id))]
  const [rosterResult, usersResult] = await Promise.all([
    rosterIds.length ? db.from('roster_members').select('id, display_name, discord_user_id').in('id', rosterIds) : Promise.resolve({ data: [], error: null }),
    discordIds.length ? db.from('guild_users').select('discord_user_id, username').in('discord_user_id', discordIds) : Promise.resolve({ data: [], error: null }),
  ])
  if (rosterResult.error) throw new Error(`Failed to list attendance roster: ${rosterResult.error.message}`)
  if (usersResult.error) throw new Error(`Failed to list attendance users: ${usersResult.error.message}`)
  const rosterById = new Map((rosterResult.data ?? []).map((member) => [member.id, member]))
  const usersById = new Map((usersResult.data ?? []).map((user) => [user.discord_user_id, user]))
  const { data: rosterMembers, error: rosterMembersError } = await db.from('roster_members').select('id, display_name, discord_user_id').order('display_name')
  if (rosterMembersError) throw new Error(`Failed to list roster members: ${rosterMembersError.message}`)
  return { event, participants: rosterMembers ?? [], records: (records ?? []).map((record) => ({ ...record, roster_member: rosterById.get(record.roster_member_id) ?? null, guild_user: usersById.get(record.discord_user_id) ?? null })) }
}

export async function createAttendanceEvent(params: { boardId: string; name: string; description: string | null; code: string; createdBy: string; durationMinutes: number }) {
  const { data, error } = await getSupabaseAdmin().from('attendance_events').insert({ board_id: params.boardId, name: params.name.trim(), description: params.description?.trim() || null, code: params.code, created_by: params.createdBy, duration_minutes: params.durationMinutes, status: 'closed' }).select(eventColumns).single<AttendanceEvent>()
  if (error) throw new Error(error.code === '23505' ? 'Ese código de asistencia ya existe.' : `Failed to create attendance event: ${error.message}`)
  return data
}

export async function setAttendanceStatus(id: string, status: 'active' | 'closed') {
  const now = new Date().toISOString()
  const db = getSupabaseAdmin()
  if (status === 'active') {
    const { data: event, error: eventError } = await db.from('attendance_events').select('duration_minutes').eq('id', id).single<{ duration_minutes: number }>()
    if (eventError) throw new Error(`Failed to load attendance duration: ${eventError.message}`)
    const { error } = await db.from('attendance_events').update({ status, opened_at: now, expires_at: new Date(Date.now() + event.duration_minutes * 60 * 1000).toISOString(), closed_at: null }).eq('id', id)
    if (error) throw new Error(`Failed to update attendance status: ${error.message}`)
    return
  }
  const { error } = await db.from('attendance_events').update({ status, closed_at: now, expires_at: null }).eq('id', id)
  if (error) throw new Error(`Failed to update attendance status: ${error.message}`)
}

export async function deleteAttendanceEvent(id: string) {
  const { error } = await getSupabaseAdmin().from('attendance_events').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete attendance event: ${error.message}`)
}

