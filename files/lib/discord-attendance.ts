import 'server-only'

import { createPublicKey, verify } from 'node:crypto'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const DISCORD_API = 'https://discord.com/api/v10'

function env(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured.`)
  return value
}

export function verifyDiscordRequest(body: string, signature: string | null, timestamp: string | null) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY
  if (!signature || !timestamp || !publicKey) return false

  try {
    if (!/^[a-f0-9]{128}$/i.test(signature) || !/^\d+$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(publicKey)) return false
    const key = createPublicKey({ key: Buffer.from(`302a300506032b6570032100${publicKey}`, 'hex'), format: 'der', type: 'spki' })
    return verify(null, Buffer.from(timestamp + body, 'utf8'), key, Buffer.from(signature, 'hex'))
  } catch {
    return false
  }
}

async function discordRequest<T>(path: string, init: RequestInit) {
  const response = await fetch(`${DISCORD_API}${path}`, { ...init, headers: { Authorization: `Bot ${env('DISCORD_BOT_TOKEN')}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) }, cache: 'no-store' })
  if (!response.ok) throw new Error(`Discord API error ${response.status}: ${await response.text()}`)
  return response.status === 204 ? null : response.json() as Promise<T>
}

export async function publishAttendanceMessage(event: { id: string; name: string; description: string | null; code: string; expires_at: string | null }) {
  const channelId = env('DISCORD_ATTENDANCE_CHANNEL_ID')
  const message = await discordRequest<{ id: string }>(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify({ embeds: [{ title: `Attendance · ${event.name}`, description: event.description ?? 'Pulsa el botón para registrar tu asistencia y sigue las instrucciones del formulario.', color: 0x8b5cf6, fields: [{ name: 'Estado', value: 'ACTIVO', inline: true }, ...(event.expires_at ? [{ name: 'Expira', value: `<t:${Math.floor(new Date(event.expires_at).getTime() / 1000)}:R>`, inline: true }] : [])], footer: { text: 'Faek Taxi · Attendance' } }], components: [{ type: 1, components: [{ type: 2, style: 1, label: 'Registrar asistencia', custom_id: `attendance:register:${event.id}` }] }] }) })
  if (!message) throw new Error('Discord did not return a message id.')
  const { error: updateError } = await getSupabaseAdmin()
    .from('attendance_events')
    .update({ discord_channel_id: channelId, discord_message_id: message.id })
    .eq('id', event.id)
  if (updateError) throw new Error(`Discord publicó el mensaje, pero no se pudo guardar su referencia: ${updateError.message}`)
  return message.id
}

export async function registerDiscordAttendance(eventId: string, discordUserId: string, code: string) {
  const db = getSupabaseAdmin()
  const receivedCode = code.trim()
  if (!/^[0-9]{4}$/.test(receivedCode)) throw new Error('El código debe tener exactamente 4 dígitos.')
  const { data: event, error: eventError } = await db
    .from('attendance_events')
    .select('id, code, status, expires_at')
    .eq('id', eventId)
    .maybeSingle<{ id: string; code: string; status: 'active' | 'closed'; expires_at: string | null }>()

  if (eventError) throw new Error('Error consultando la asistencia en Supabase.')
  if (!event) throw new Error('La asistencia no existe en Supabase.')
  if (event.status !== 'active') throw new Error(`La asistencia existe, pero su estado real es: ${event.status}.`)

  const expiresAtTime = event.expires_at ? new Date(event.expires_at).getTime() : null
  const isExpired = event.expires_at !== null && (expiresAtTime === null || Number.isNaN(expiresAtTime) || expiresAtTime + 5_000 <= Date.now())
  if (isExpired) throw new Error('La asistencia está activa, pero su fecha de expiración ya pasó.')

  if (event.code.trim() !== receivedCode) throw new Error('La asistencia está activa y vigente, pero el código recibido no coincide con el código almacenado.')

  const { data: user, error: userError } = await db
    .from('guild_users')
    .select('discord_user_id, role')
    .eq('discord_user_id', discordUserId)
    .maybeSingle<{ discord_user_id: string; role: string }>()
  if (userError) throw new Error('Error consultando tu cuenta de Discord en Supabase.')
  if (!user || user.role === 'pending') throw new Error('El código coincide, pero tu cuenta de Discord no está aprobada.')

  const { data: roster, error: rosterError } = await db
    .from('roster_members')
    .select('id')
    .eq('discord_user_id', discordUserId)
    .maybeSingle<{ id: string }>()
  if (rosterError) throw new Error('Error consultando el roster en Supabase.')
  if (!roster) throw new Error('El código coincide, pero tu Discord no está vinculado a un miembro del roster.')
  const { error: insertError } = await db.from('attendance_records').insert({ attendance_event_id: eventId, roster_member_id: roster.id, discord_user_id: discordUserId })
  if (insertError) {
    if (insertError.code === '23505') throw new Error('Ya estás registrado en esta asistencia.')
    throw new Error('Falló el registro en Supabase.')
  }
}

export async function attendanceModal(eventId: string) {
  return { type: 9, data: { custom_id: `attendance:submit:${eventId}`, title: 'Registrar asistencia', components: [{ type: 1, components: [{ type: 4, custom_id: 'code', label: 'Código de asistencia (4 dígitos)', style: 1, min_length: 4, max_length: 4, required: true, placeholder: '4827' }] }] } }
}

export function ephemeral(content: string) { return { type: 4, data: { content, flags: 64 } } }
