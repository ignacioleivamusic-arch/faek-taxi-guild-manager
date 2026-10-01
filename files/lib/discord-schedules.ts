import 'server-only'

import type { Schedule } from '@/lib/schedules'
import { scheduleDiscordLine, sortSchedules } from '@/lib/schedule-format'
import { listSchedules } from '@/lib/schedules'

const DISCORD_API = 'https://discord.com/api/v10'

function requiredEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is required for Discord publication.`)
  return value
}

async function discordRequest<T>(path: string, init: RequestInit) {
  const response = await fetch(`${DISCORD_API}${path}`, { ...init, headers: { Authorization: `Bot ${requiredEnv('DISCORD_BOT_TOKEN')}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) }, cache: 'no-store' })
  if (!response.ok) throw new Error(`Discord API error ${response.status}: ${await response.text()}`)
  return response.status === 204 ? null : response.json() as Promise<T>
}

function relevantSchedules(schedules: Schedule[], current: Schedule) {
  const merged = schedules.some((schedule) => schedule.id === current.id) ? schedules : [...schedules, current]
  return sortSchedules(merged.filter((schedule) => schedule.status === 'published' || schedule.id === current.id))
}

export async function publishScheduleToDiscord(schedule: Schedule) {
  const channelId = requiredEnv('DISCORD_SCHEDULE_CHANNEL_ID')
  const schedules = relevantSchedules(await listSchedules({ publishedOnly: true }), schedule)
  const description = schedules.map((item) => scheduleDiscordLine(item)).join('\n').slice(0, 4096)
  const payload = { embeds: [{ title: 'CRONOGRAMA', description: description || scheduleDiscordLine(schedule), color: 0xf59e0b, footer: { text: 'Faek Taxi Guild Manager' } }] }
  const message = schedule.discord_message_id
    ? await discordRequest<{ id: string }>(`/channels/${channelId}/messages/${schedule.discord_message_id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    : await discordRequest<{ id: string }>(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify(payload) })
  if (!message?.id) throw new Error('Discord did not return a message id.')
  return { messageId: message.id, channelId }
}
