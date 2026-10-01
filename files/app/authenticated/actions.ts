'use server'

import { revalidatePath } from 'next/cache'
import {
  createAnnouncement,
  deleteAnnouncement,
  getCurrentGuildUser,
  isManagementRole,
  updateAnnouncement,
  setGuildUserRole,
} from '@/lib/auth/users'

function requiredText(value: FormDataEntryValue | null, label: string, maxLength: number) {
  if (typeof value !== 'string') throw new Error(`${label} es obligatorio`)
  const text = value.trim()
  if (!text || text.length > maxLength) throw new Error(`${label} no es válido`)
  return text
}

async function requireManager() {
  const user = await getCurrentGuildUser()
  if (!user || !isManagementRole(user.role)) throw new Error('No autorizado')
  return user
}

export async function createAnnouncementAction(formData: FormData) {
  const user = await requireManager()
  await createAnnouncement({
    title: requiredText(formData.get('title'), 'El título', 120),
    body: requiredText(formData.get('body'), 'El contenido', 5000),
    authorDiscordUserId: user.discord_user_id,
  })
  revalidatePath('/authenticated')
}

export async function updateAnnouncementAction(formData: FormData) {
  await requireManager()
  const id = requiredText(formData.get('id'), 'El anuncio', 80)
  await updateAnnouncement({
    id,
    title: requiredText(formData.get('title'), 'El título', 120),
    body: requiredText(formData.get('body'), 'El contenido', 5000),
  })
  revalidatePath('/authenticated')
}

export async function deleteAnnouncementAction(formData: FormData) {
  await requireManager()
  await deleteAnnouncement(requiredText(formData.get('id'), 'El anuncio', 80))
  revalidatePath('/authenticated')
}

export async function approvePendingUserAction(formData: FormData) {
  const actor = await requireManager()
  const targetDiscordUserId = requiredText(formData.get('discordUserId'), 'El usuario', 25)
  const role = formData.get('role')
  if (role !== 'member' && role !== 'staff') throw new Error('Rol no válido')
  await setGuildUserRole({ targetDiscordUserId, role, actorDiscordUserId: actor.discord_user_id })
  revalidatePath('/authenticated')
}

export async function editAnnouncementAction(formData: FormData) {
  return updateAnnouncementAction(formData)
}

export async function removeAnnouncementAction(formData: FormData) {
  return deleteAnnouncementAction(formData)
}

export async function approveUserAction(formData: FormData) {
  return approvePendingUserAction(formData)
}

export async function getAnnouncementActions() {
  return null
}

export async function updateAnnouncementFormAction(formData: FormData) {
  return editAnnouncementAction(formData)
}

export async function deleteAnnouncementFormAction(formData: FormData) {
  return removeAnnouncementAction(formData)
}

export async function approvePendingFormAction(formData: FormData) {
  return approveUserAction(formData)
}

export async function createAnnouncementFormAction(formData: FormData) {
  return createAnnouncementAction(formData)
}

export async function updatePendingUserAction(formData: FormData) {
  return approvePendingUserAction(formData)
}

export async function noopAction() {}

export async function validateManager() {
  return Boolean(await getCurrentGuildUser())
}

export async function canManageAnnouncements() {
  const user = await getCurrentGuildUser()
  return Boolean(user && isManagementRole(user.role))
}

export async function approvePending(formData: FormData) {
  return approvePendingUserAction(formData)
}

export async function createAnnouncementForm(formData: FormData) {
  return createAnnouncementAction(formData)
}

export async function editAnnouncementForm(formData: FormData) {
  return updateAnnouncementAction(formData)
}

export async function deleteAnnouncementForm(formData: FormData) {
  return deleteAnnouncementAction(formData)
}

export async function approvePendingUser(formData: FormData) {
  return approvePendingUserAction(formData)
}
