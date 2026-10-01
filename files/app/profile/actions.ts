'use server'

import { revalidatePath } from 'next/cache'
import { canManageAsActor, getCurrentGuildUser } from '@/lib/auth/users'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { deriveClass, isWeapon } from '@/lib/player-builds'

const PHOTO_BUCKET = 'profile-photos'
const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

async function authorizeProfile(id: string) {
  const actor = await getCurrentGuildUser()
  if (!actor || actor.role === 'pending') throw new Error('Not authorized')
  const { data: target, error } = await getSupabaseAdmin().from('roster_members').select('id, discord_user_id, profile_image_url').eq('id', id).maybeSingle()
  if (error) throw new Error(`Unable to load profile: ${error.message}`)
  if (!target) throw new Error('Profile not found')
  const manager = canManageAsActor(actor)
  if (target.discord_user_id !== actor.discord_user_id && !manager) throw new Error('Not authorized')
  return { actor, target, manager }
}

export async function updatePlayerPhoto(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid profile')
  const { target } = await authorizeProfile(id)
  const file = formData.get('photo')
  if (!(file instanceof File) || file.size === 0) throw new Error('Select an image')
  if (file.size > MAX_PHOTO_BYTES || !PHOTO_TYPES.has(file.type)) throw new Error('Use JPG, PNG, or WEBP up to 5 MB')
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${target.discord_user_id}/${id}.${extension}`
  const db = getSupabaseAdmin()
  if (target.profile_image_url && target.profile_image_url !== path) await db.storage.from(PHOTO_BUCKET).remove([target.profile_image_url])
  const { error: uploadError } = await db.storage.from(PHOTO_BUCKET).upload(path, file, { contentType: file.type, upsert: true })
  if (uploadError) throw new Error(`Unable to upload photo: ${uploadError.message}`)
  const { error } = await db.from('roster_members').update({ profile_image_url: path, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(`Unable to save photo: ${error.message}`)
  revalidatePath('/profile')
  revalidatePath(`/profile/${id}`)
  revalidatePath('/roster')
}

export async function removePlayerPhoto(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid profile')
  const { target } = await authorizeProfile(id)
  if (target.profile_image_url) await getSupabaseAdmin().storage.from(PHOTO_BUCKET).remove([target.profile_image_url])
  const { error } = await getSupabaseAdmin().from('roster_members').update({ profile_image_url: null, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(`Unable to remove photo: ${error.message}`)
  revalidatePath('/profile')
  revalidatePath(`/profile/${id}`)
  revalidatePath('/roster')
}

export async function updatePlayerProfile(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid profile')
  const { actor, manager } = await authorizeProfile(id)
  const displayName = String(formData.get('displayName') ?? '').trim()
  const weapon1 = String(formData.get('weapon1') ?? '').trim()
  const weapon2 = String(formData.get('weapon2') ?? '').trim()
  if (!isWeapon(weapon1) || !isWeapon(weapon2) || weapon1 === weapon2) throw new Error('Selecciona dos armas diferentes')
  const className = deriveClass(weapon1, weapon2)
  const note = String(formData.get('note') ?? '').trim()
  const rawGearScore = String(formData.get('gearScore') ?? '').trim()
  const gearScore = rawGearScore ? Number(rawGearScore) : null
  const combatRole = String(formData.get('combatRole') ?? '')
  if ([displayName, className, weapon1, weapon2].some((value) => value.length > 100) || note.length > 500) throw new Error('Profile text is too long')
  if (gearScore !== null && (!Number.isInteger(gearScore) || gearScore < 0 || gearScore > 10000)) throw new Error('Gear Score must be an integer between 0 and 10000')
  if (!['DPS', 'HEAL', 'TANK'].includes(combatRole)) throw new Error('Invalid profile options')
  const update: Record<string, unknown> = { display_name: displayName || null, class_name: className, weapon_1: weapon1, weapon_2: weapon2, gear_score: gearScore, combat_role: combatRole, note: note || null, updated_at: new Date().toISOString() }
  if (manager) update.is_active = formData.get('isActive') === 'on'
  const { error } = await getSupabaseAdmin().from('roster_members').update(update).eq('id', id)
  if (error) throw new Error(`Unable to update profile: ${error.message}`)
  void actor
  revalidatePath('/profile')
  revalidatePath(`/profile/${id}`)
  revalidatePath('/roster')
}
