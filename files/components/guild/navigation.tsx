'use server'

import { NavigationClient } from '@/components/guild/navigation-client'
import { ScheduleAlert } from '@/components/guild/schedule-alert'
import { listSchedules } from '@/lib/schedules'
import { getAppearanceSettings } from '@/lib/appearance'

export async function GuildNavigation({ canManage }: { canManage: boolean }) {
  const [schedules, appearance] = await Promise.all([
    listSchedules({ publishedOnly: true }),
    getAppearanceSettings(),
  ])

  return <>
    <div className="mx-auto mt-4 flex aspect-[1150/200] w-[calc(100%-2rem)] max-w-[1150px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/10 sm:w-[calc(100%-3rem)]">
      <img src={appearance.bannerUrl ?? '/icon.svg'} alt={appearance.bannerUrl ? 'Banner de la guild' : 'Faek Taxi'} className="h-full w-full object-cover" />
    </div>
    <NavigationClient canManage={canManage} />
    <ScheduleAlert schedules={schedules} canManage={canManage} />
  </>
}
