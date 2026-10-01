'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentGuildUser, isRole, setGuildUserRole } from '@/lib/auth/users'

export async function updateUserRole(formData: FormData) {
  const actor = await getCurrentGuildUser()
  if (!actor || (actor.role !== 'admin' && actor.role !== 'staff')) {
    throw new Error('Not authorized')
  }

  const targetDiscordUserId = formData.get('discordUserId')
  const role = formData.get('role')

  if (typeof targetDiscordUserId !== 'string' || !/^\d{5,25}$/.test(targetDiscordUserId)) {
    throw new Error('Invalid user')
  }
  if (!isRole(role)) {
    throw new Error('Invalid role')
  }
  if (targetDiscordUserId === actor.discord_user_id) {
    throw new Error('Admins cannot change their own role')
  }

  await setGuildUserRole({
    targetDiscordUserId,
    role,
    actorDiscordUserId: actor.discord_user_id,
  })

  revalidatePath('/admin')
}
