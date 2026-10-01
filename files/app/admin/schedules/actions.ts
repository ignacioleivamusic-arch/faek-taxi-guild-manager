'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentGuildUser, isManagementRole } from '@/lib/auth/users'
import { createSchedule, deleteSchedule, getSchedule, markScheduleCancelled, markSchedulePublished, updateSchedule } from '@/lib/schedules'
import { publishScheduleToDiscord } from '@/lib/discord-schedules'
import { scheduleTitle } from '@/lib/schedule-format'

async function actor() {
  const user = await getCurrentGuildUser()
  if (!user || !isManagementRole(user.role)) throw new Error('No autorizado')
  return user
}

function values(formData: FormData) {
  const eventType = String(formData.get('eventType') ?? '') as 'WARGAME' | 'BOONSTONE' | 'RIFTSTONE' | 'OTRO'
  const vsGuild = String(formData.get('vsGuild') ?? '').trim() || null
  const stoneBoss = String(formData.get('stoneBoss') ?? '').trim() || null
  const eventDate = String(formData.get('eventDate') ?? '')
  const startTime = String(formData.get('startTime') ?? '')
  const endTime = String(formData.get('endTime') ?? '').trim() || null
  if (!['WARGAME', 'BOONSTONE', 'RIFTSTONE', 'OTRO'].includes(eventType) || (eventType !== 'OTRO' && !vsGuild) || (vsGuild && vsGuild.length > 120) || (stoneBoss && stoneBoss.length > 120) || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || !/^\d{2}:\d{2}$/.test(startTime) || (endTime && !/^\d{2}:\d{2}$/.test(endTime))) throw new Error('Completa los datos del cronograma correctamente')
  if (endTime && endTime <= startTime) throw new Error('La hora final debe ser posterior a la inicial')
  return { eventType, vsGuild, stoneBoss, eventDate, startTime, endTime }
}

export async function saveSchedule(formData: FormData) {
  const user = await actor()
  const id = String(formData.get('id') ?? '').trim()
  const input = values(formData)
  const title = scheduleTitle({ event_type: input.eventType, vs_guild: input.vsGuild, stone_boss: input.stoneBoss })
  const schedule = id ? await updateSchedule(id, { ...input, title, description: null }) : await createSchedule({ ...input, title, description: null, createdBy: user.discord_user_id })
  if (formData.get('publish') === 'on') {
    const published = await publishScheduleToDiscord(schedule)
    await markSchedulePublished(schedule.id, published.messageId, published.channelId)
  }
  revalidatePath('/admin/schedules'); revalidatePath('/authenticated')
}

export async function publishSchedule(id: string) {
  await actor()
  const schedule = await getSchedule(id)
  if (!schedule) throw new Error('Cronograma no encontrado')
  const published = await publishScheduleToDiscord(schedule)
  await markSchedulePublished(id, published.messageId, published.channelId)
  revalidatePath('/admin/schedules'); revalidatePath('/authenticated')
}

export async function cancelSchedule(id: string) { await actor(); await markScheduleCancelled(id); revalidatePath('/admin/schedules'); revalidatePath('/authenticated') }
export async function removeSchedule(id: string) { await actor(); await deleteSchedule(id); revalidatePath('/admin/schedules'); revalidatePath('/authenticated') }
