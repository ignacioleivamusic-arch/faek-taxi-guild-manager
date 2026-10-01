'use client'

import Link from 'next/link'
import { isScheduleToday, sortSchedules } from '@/lib/schedule-format'
import type { Schedule } from '@/lib/schedules'

export function ScheduleAlert({ schedules, canManage }: { schedules: Schedule[]; canManage: boolean }) {
  const destination = '/authenticated'
  const ordered = sortSchedules(schedules)
  const hasTodaySchedule = ordered.some((schedule) => isScheduleToday(schedule))

  return (
    <div className="px-4 pt-3 sm:px-6">
      <Link
        href={destination}
        className={`mx-auto flex w-full max-w-6xl flex-col gap-1 rounded-2xl border px-4 py-2.5 text-sm shadow-[0_0_18px_rgba(148,163,184,0.08)] transition hover:brightness-110 ${hasTodaySchedule ? 'border-emerald-300/70 bg-black/90 text-foreground shadow-[0_0_18px_rgba(52,211,153,0.22)]' : 'border-white/15 bg-card/80 text-muted-foreground'}`}
      >
        {ordered.length ? ordered.map((schedule) => {
          const [time, eventType, guild, stone] = scheduleLineParts(schedule)
          return (
            <span key={schedule.id} className="leading-6">
              <strong className="font-bold text-white">{time}</strong>
              <span className="text-muted-foreground">{' - '}</span>
              <strong className="font-bold text-emerald-300">{eventType}</strong>
              {guild && <span className="text-foreground">{` ${guild}`}</span>}
              {guild && stone && <span className="font-bold text-emerald-300">{' - '}</span>}
              {stone && <span className="text-foreground">{stone}</span>}
            </span>
          )
        }) : <span className="font-medium">Cronograma - No hay actividades publicadas todavía.</span>}
      </Link>
    </div>
  )
}

function scheduleLineParts(schedule: Schedule) {
  const time = schedule.start_time.slice(0, 5)
  const eventType = schedule.event_type
  const guild = schedule.vs_guild?.trim() ? `vs ${schedule.vs_guild.trim()}` : ''
  const stone = schedule.stone_boss?.trim() ? schedule.stone_boss.trim() : ''
  return [time, eventType, guild, stone] as const
}
