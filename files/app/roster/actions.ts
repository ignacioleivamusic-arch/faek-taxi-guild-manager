'use server'

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { canManageAsActor, getCurrentGuildUser } from '@/lib/auth/users'

const combatRoles = new Set(['DPS', 'HEAL', 'TANK'])

function textValue(formData: FormData, key: string, maxLength: number) {
  const value = formData.get(key)
  if (typeof value !== 'string') throw new Error(`Invalid ${key}`)
  const trimmed = value.trim()
  if (trimmed.length > maxLength) throw new Error(`${key} is too long`)
  return trimmed || null
}

async function requireManager() {
  const actor = await getCurrentGuildUser()
  if (!canManageAsActor(actor)) throw new Error('Not authorized')
  return actor
}

function validateRole(formData: FormData) {
  const value = formData.get('combatRole')
  if (typeof value !== 'string' || !combatRoles.has(value)) throw new Error('Invalid combat role')
  return value as 'DPS' | 'HEAL' | 'TANK'
}

function validateDiscordId(formData: FormData) {
  const value = formData.get('discordUserId')
  if (typeof value !== 'string' || !/^\d{5,25}$/.test(value)) throw new Error('Select a valid Discord user')
  return value
}

function activeValue(formData: FormData) {
  return formData.get('isActive') === 'on'
}

function profileValues(formData: FormData) {
  const rawGearScore = formData.get('gearScore')
  const gearScore = typeof rawGearScore === 'string' && rawGearScore.trim() ? Number(rawGearScore) : null
  if (gearScore !== null && (!Number.isInteger(gearScore) || gearScore < 0 || gearScore > 10000)) throw new Error('Gear Score must be an integer between 0 and 10000')
  const rawBuildType = formData.get('buildType')
  const buildType = rawBuildType === '' || rawBuildType === null ? null : rawBuildType
  if (buildType !== null && !['PvP', 'PvE', 'Hybrid'].includes(String(buildType))) throw new Error('Invalid build type')
  return { gear_score: gearScore, build_type: buildType as 'PvP' | 'PvE' | 'Hybrid' | null }
}

export async function createRosterMember(formData: FormData) {
  await requireManager()
  const discordUserId = validateDiscordId(formData)
  const combatRole = validateRole(formData)
  const { data: user, error: userError } = await getSupabaseAdmin().from('guild_users').select('discord_user_id').eq('discord_user_id', discordUserId).neq('role', 'pending').maybeSingle()
  if (userError) throw new Error(`Unable to validate linked user: ${userError.message}`)
  if (!user) throw new Error('That user is not approved')

  const { error } = await getSupabaseAdmin().from('roster_members').insert({
    discord_user_id: discordUserId,
    display_name: textValue(formData, 'displayName', 100),
    class_name: textValue(formData, 'className', 100),
    combat_role: combatRole,
    weapon_1: textValue(formData, 'weapon1', 100),
    weapon_2: textValue(formData, 'weapon2', 100),
    note: textValue(formData, 'note', 500),
    ...profileValues(formData),
    is_active: activeValue(formData),
  })
  if (error) {
    if (error.code === '23505') throw new Error('That Discord user already has a roster entry')
    throw new Error(`Unable to create roster member: ${error.message}`)
  }
}

export async function updateRosterMember(formData: FormData) {
  await requireManager()
  const id = formData.get('id')
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid roster member')
  const combatRole = validateRole(formData)
  const { error } = await getSupabaseAdmin().from('roster_members').update({
    display_name: textValue(formData, 'displayName', 100),
    class_name: textValue(formData, 'className', 100),
    combat_role: combatRole,
    weapon_1: textValue(formData, 'weapon1', 100),
    weapon_2: textValue(formData, 'weapon2', 100),
    note: textValue(formData, 'note', 500),
    ...profileValues(formData),
    is_active: activeValue(formData),
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) throw new Error(`Unable to update roster member: ${error.message}`)
}

export async function removeRosterMember(formData: FormData) {
  await requireManager()
  const id = formData.get('id')
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid roster member')

  const db = getSupabaseAdmin()
  const { error: assignmentError } = await db.from('board_party_members').delete().eq('roster_member_id', id)
  if (assignmentError) throw new Error(`Unable to remove roster assignments: ${assignmentError.message}`)

  const { error } = await db.from('roster_members').delete().eq('id', id)
  if (error) throw new Error(`Unable to remove roster member: ${error.message}`)
}
