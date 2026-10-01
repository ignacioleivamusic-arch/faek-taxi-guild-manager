import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/admin'

export type Schedule = {
  id: string
  title: string
  description: string | null
  event_type: 'WARGAME' | 'BOONSTONE' | 'RIFTSTONE' | 'OTRO'
  vs_guild: string | null
  stone_boss: string | null
  event_date: string
  start_time: string
  end_time: string | null
  status: 'draft' | 'published' | 'cancelled'
  created_by: string
  discord_channel_id: string | null
  discord_message_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

const columns = 'id, title, description, event_type, vs_guild, stone_boss, event_date, start_time, end_time, status, created_by, discord_channel_id, discord_message_id, published_at, created_at, updated_at'

export async function listSchedules(options: { publishedOnly?: boolean } = {}) {
  let query = getSupabaseAdmin().from('schedules').select(columns).order('event_date').order('start_time')
  if (options.publishedOnly) query = query.eq('status', 'published')
  const { data, error } = await query.returns<Schedule[]>()
  if (error) throw new Error(`Failed to list schedules: ${error.message}`)
  return data ?? []
}

export async function getSchedule(id: string) {
  const { data, error } = await getSupabaseAdmin().from('schedules').select(columns).eq('id', id).maybeSingle<Schedule>()
  if (error) throw new Error(`Failed to load schedule: ${error.message}`)
  return data
}

export async function createSchedule(input: { title: string; description: string | null; eventType: Schedule['event_type']; vsGuild: string | null; stoneBoss: string | null; eventDate: string; startTime: string; endTime: string | null; createdBy: string }) {
  const { data, error } = await getSupabaseAdmin().from('schedules').insert({ title: input.title, description: input.description, event_type: input.eventType, vs_guild: input.vsGuild, stone_boss: input.stoneBoss, event_date: input.eventDate, start_time: input.startTime, end_time: input.endTime, created_by: input.createdBy }).select(columns).single<Schedule>()
  if (error) throw new Error(`Failed to create schedule: ${error.message}`)
  return data
}

export async function updateSchedule(id: string, input: { title: string; description: string | null; eventType: Schedule['event_type']; vsGuild: string | null; stoneBoss: string | null; eventDate: string; startTime: string; endTime: string | null }) {
  const { data, error } = await getSupabaseAdmin().from('schedules').update({ title: input.title, description: input.description, event_type: input.eventType, vs_guild: input.vsGuild, stone_boss: input.stoneBoss, event_date: input.eventDate, start_time: input.startTime, end_time: input.endTime, updated_at: new Date().toISOString() }).eq('id', id).select(columns).single<Schedule>()
  if (error) throw new Error(`Failed to update schedule: ${error.message}`)
  return data
}

export async function deleteSchedule(id: string) {
  const { error } = await getSupabaseAdmin().from('schedules').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete schedule: ${error.message}`)
}

export async function markSchedulePublished(id: string, messageId: string, channelId: string) {
  const { error } = await getSupabaseAdmin().from('schedules').update({ status: 'published', discord_message_id: messageId, discord_channel_id: channelId, published_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(`Failed to publish schedule: ${error.message}`)
}

export async function markScheduleCancelled(id: string) {
  const { error } = await getSupabaseAdmin().from('schedules').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(`Failed to cancel schedule: ${error.message}`)
}
