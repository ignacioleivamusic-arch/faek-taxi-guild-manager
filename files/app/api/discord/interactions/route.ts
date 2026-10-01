import { NextResponse } from 'next/server'
import { attendanceModal, ephemeral, registerDiscordAttendance, verifyDiscordRequest } from '@/lib/discord-attendance'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type DiscordInteraction = {
  type?: number
  data?: {
    custom_id?: string
    components?: Array<{ components?: Array<{ custom_id?: string; value?: string }> }>
  }
  member?: { user?: { id?: string } }
  user?: { id?: string }
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-signature-ed25519')
  const timestamp = request.headers.get('x-signature-timestamp')

  if (!verifyDiscordRequest(body, signature, timestamp)) {
    return new NextResponse('Invalid request signature', { status: 401 })
  }

  let interaction: DiscordInteraction
  try {
    interaction = JSON.parse(body) as DiscordInteraction
  } catch {
    return new NextResponse('Invalid JSON payload', { status: 400 })
  }

  if (interaction.type === 1) {
    return NextResponse.json({ type: 1 })
  }

  const customId = interaction.data?.custom_id ?? ''
  const [namespace, action, eventId] = customId.split(':')

  if (namespace !== 'attendance' || !eventId) {
    return NextResponse.json(ephemeral('Interacción no reconocida.'))
  }

  if (action === 'register') {
    return NextResponse.json(await attendanceModal(eventId))
  }

  if (action === 'submit') {
    const discordUserId = interaction.member?.user?.id ?? interaction.user?.id
    const code = interaction.data?.components?.[0]?.components?.[0]?.value?.trim()

  if (!discordUserId || !code) {
  return NextResponse.json(ephemeral('Faltan datos para registrar la asistencia.'))
  }
  if (!/^[0-9]{4}$/.test(code)) {
  return NextResponse.json(ephemeral('El código debe tener exactamente 4 dígitos.'))
  }

    try {
      await registerDiscordAttendance(eventId, discordUserId, code)
      return NextResponse.json(ephemeral('Asistencia registrada correctamente.'))
    } catch (error) {
      return NextResponse.json(ephemeral(error instanceof Error ? error.message : 'No se pudo registrar la asistencia.'))
    }
  }

  return NextResponse.json(ephemeral('Interacción no reconocida.'))
}
