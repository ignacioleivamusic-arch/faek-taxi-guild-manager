export type ScheduleLike = {
  event_type: 'WARGAME' | 'BOONSTONE' | 'RIFTSTONE' | 'OTRO'
  vs_guild: string | null
  stone_boss: string | null
  event_date: string
  start_time: string
  end_time: string | null
}

export function scheduleLabel(schedule: ScheduleLike) {
  const guild = schedule.vs_guild?.trim() ? ` - vs ${schedule.vs_guild.trim()}` : ''
  const stone = schedule.stone_boss?.trim() ? ` | ${schedule.stone_boss.trim()}` : ''
  return `${schedule.start_time.slice(0, 5)} - ${schedule.event_type}${guild}${stone}`
}

export function scheduleStart(schedule: ScheduleLike) {
  return new Date(`${schedule.event_date}T${schedule.start_time}`).getTime()
}

export function scheduleTimeStatus(schedule: ScheduleLike, now = Date.now()) {
  const start = scheduleStart(schedule)
  const end = schedule.end_time ? new Date(`${schedule.event_date}T${schedule.end_time}`).getTime() : null
  if (now >= start && (!end || now < end)) return 'En curso'
  if (end && now >= end) return 'Finalizado'
  const minutes = Math.max(0, Math.ceil((start - now) / 60000))
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `Comienza en ${hours ? `${hours}h` : ''}${hours && remainder ? ' ' : ''}${remainder ? `${remainder}m` : ''}`.trim()
}

export function scheduleLine(schedule: ScheduleLike) {
  return scheduleLabel(schedule)
}

export function scheduleDiscordLine(schedule: ScheduleLike) {
  const timestamp = Math.floor(scheduleStart(schedule) / 1000)
  return `${scheduleLabel(schedule)} | Comienza en <t:${timestamp}:R>`
}

export function isScheduleToday(schedule: ScheduleLike, now = new Date()) {
  const [year, month, day] = schedule.event_date.split('-').map(Number)
  return year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate()
}

export function sortSchedules<T extends ScheduleLike>(schedules: T[]) {
  return [...schedules].sort((a, b) => scheduleStart(a) - scheduleStart(b))
}

export function scheduleTitle(schedule: Pick<ScheduleLike, 'event_type' | 'vs_guild' | 'stone_boss'>) {
  const guild = schedule.vs_guild?.trim() ? ` vs ${schedule.vs_guild.trim()}` : ''
  const stone = schedule.stone_boss?.trim() ? ` | ${schedule.stone_boss.trim()}` : ''
  return `${schedule.event_type}${guild}${stone}`
}
