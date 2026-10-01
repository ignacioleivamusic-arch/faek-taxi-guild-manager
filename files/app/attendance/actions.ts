'use server'

import { revalidatePath } from 'next/cache'
import { canManageAsActor, getCurrentGuildUser, type GuildUser } from '@/lib/auth/users'
import { createAttendanceEvent, deleteAttendanceEvent, setAttendanceStatus } from '@/lib/attendance'
import { isAttendanceCode } from '@/lib/attendance-shared'
import { publishAttendanceMessage } from '@/lib/discord-attendance'

async function requireAttendanceManager(): Promise<GuildUser> {
  const user = await getCurrentGuildUser()
  if (!user || !canManageAsActor(user)) throw new Error('Solo Staff y Administradores pueden gestionar Attendance.')
  return user
}

function text(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function uuid(value: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new Error('Invalid attendance event')
}

export type AttendanceActionResult =
  | { ok: true; event: { id: string; code: string } }
  | { ok: false; message: string }

export async function createAttendance(formData: FormData): Promise<AttendanceActionResult> {
  try {
    const user = await requireAttendanceManager()
    const name = text(formData, 'name')
    const description = text(formData, 'description')
    const code = text(formData, 'code')
    const boardId = text(formData, 'board_id')
    const durationMinutes = Number(text(formData, 'duration_minutes'))
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 1440) throw new Error('La duración debe estar entre 1 y 1440 minutos.')
    if (name.length < 1 || name.length > 120) throw new Error('El nombre debe tener entre 1 y 120 caracteres.')
    if (description.length > 1000) throw new Error('La descripción es demasiado larga.')
    if (!isAttendanceCode(code)) throw new Error('El código debe tener exactamente 4 dígitos.')
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(boardId)) throw new Error('Selecciona un Board válido.')
    const event = await createAttendanceEvent({ boardId, name, description, code, createdBy: user.discord_user_id, durationMinutes })
    revalidatePath('/admin')
    revalidatePath('/attendance')
    return { ok: true, event: { id: event.id, code: String(event.code) } }
  } catch (error: unknown) {
    return { ok: false, message: error instanceof Error ? error.message : 'No se pudo crear la asistencia.' }
  }
}

export async function openAttendance(formData: FormData) {
  await requireAttendanceManager()
  const id = text(formData, 'id'); uuid(id)
  const { getAttendanceEvent } = await import('@/lib/attendance')
  const beforeOpen = await getAttendanceEvent(id)
  if (!beforeOpen) throw new Error('Asistencia no encontrada.')
  await setAttendanceStatus(id, 'active')
  const loaded = await getAttendanceEvent(id)
  if (!loaded) throw new Error('Asistencia no encontrada.')
  if (!loaded.event.discord_message_id) await publishAttendanceMessage(loaded.event)
  revalidatePath('/admin'); revalidatePath('/attendance')
}

export async function closeAttendance(formData: FormData) {
  await requireAttendanceManager()
  const id = text(formData, 'id'); uuid(id)
  await setAttendanceStatus(id, 'closed')
  revalidatePath('/admin'); revalidatePath('/attendance')
}

export async function deleteAttendance(formData: FormData) {
  await requireAttendanceManager()
  const id = text(formData, 'id'); uuid(id)
  await deleteAttendanceEvent(id)
  revalidatePath('/admin'); revalidatePath('/attendance')
}
