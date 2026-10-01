import 'server-only'

import { headers } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export type CheckState = 'CONFIGURADO' | 'FALTA' | 'REQUIERE CONFIGURACIÓN MANUAL' | 'ERROR' | 'NO REQUERIDO'
export type SetupCheck = { id: string; label: string; state: CheckState; detail: string; secret?: boolean; required?: boolean }
export type SetupSection = { id: string; title: string; purpose: string; checks: SetupCheck[] }
export type SetupSnapshot = { origin: string | null; sections: SetupSection[]; instructionsAi: string[]; instructionsAdmin: string[]; summary: Record<CheckState, number> }

const envDefinitions = [
  ['NEXT_PUBLIC_SUPABASE_URL', true, 'Conexión pública del proyecto Supabase'],
  ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', false, 'Cliente público de Supabase (se acepta también la clave anon legacy)'],
  ['SUPABASE_URL', false, 'URL server-side alternativa de Supabase'],
  ['SUPABASE_SERVICE_ROLE_KEY', true, 'Acceso administrativo server-side (también puede ser SUPABASE_SECRET_KEY)', true],
  ['SUPABASE_SECRET_KEY', false, 'Alternativa moderna a SUPABASE_SERVICE_ROLE_KEY', true],
  ['DISCORD_CLIENT_ID', true, 'Discord OAuth application ID'],
  ['DISCORD_CLIENT_SECRET', true, 'Discord OAuth application secret', true],
  ['DISCORD_REDIRECT_URI', true, 'Callback OAuth de Discord'],
  ['ROSTER_SESSION_SECRET', true, 'Cifrado de la cookie de sesión', true],
  ['INITIAL_ADMIN_DISCORD_ID', true, 'Discord ID promovido a administrador inicial'],
  ['DISCORD_PUBLIC_KEY', true, 'Verificación Ed25519 de Interactions'],
  ['DISCORD_BOT_TOKEN', true, 'Bot usado para publicar Attendance', true],
  ['DISCORD_ATTENDANCE_CHANNEL_ID', true, 'Canal de publicación de Attendance'],
  ['DISCORD_SCHEDULE_CHANNEL_ID', false, 'Canal de publicación de Schedule'],
] as const

const tables = [
  ['guild_users', 'Autenticación, roles y aprobación'], ['roster_members', 'Roster, perfiles y vínculo Discord'], ['announcements', 'Anuncios del gremio'],
  ['boards', 'Boards'], ['board_parties', 'Parties de Board'], ['board_party_members', 'Asignaciones de roster a Party'],
  ['attendance_events', 'Eventos de Attendance'], ['attendance_records', 'Registros de asistencia'], ['schedules', 'Cronograma'], ['appearance_settings', 'Configuración singleton del banner'],
] as const

const requiredColumns: Record<string, string> = {
  guild_users: 'discord_user_id, username, email, role', roster_members: 'id, discord_user_id, display_name, class_name, combat_role, is_active',
  announcements: 'id, title, body, author_discord_user_id', boards: 'id, title, is_current, created_by',
  board_parties: 'id, board_id, title', board_party_members: 'id, board_id, party_id, roster_member_id',
  attendance_events: 'id, board_id, name, code, status, duration_minutes, created_by', attendance_records: 'id, attendance_event_id, roster_member_id, discord_user_id, created_at',
  schedules: 'id, title, event_date, start_time, status', appearance_settings: 'id, banner_path',
}

function present(name: string) {
  if (name === 'SUPABASE_SERVICE_ROLE_KEY') return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim())
  if (name === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') return Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim())
  return Boolean(process.env[name]?.trim())
}
function validDiscordId(value: string | undefined) { return /^\d{17,20}$/.test(value ?? '') }
function stateFor(value: boolean, required = true): CheckState { return value ? 'CONFIGURADO' : required ? 'FALTA' : 'NO REQUERIDO' }

async function probeTable(table: string, columns: string) {
  try {
    const { error } = await getSupabaseAdmin().from(table).select(columns).limit(1)
    if (!error) return 'CONFIGURADO' as const
    if (error.code === 'PGRST205' || error.code === 'PGRST204' || error.code === '42703') return 'FALTA' as const
    return 'ERROR' as const
  } catch { return 'ERROR' as const }
}

async function probeBucket(bucket: string) {
  try {
    const { data, error } = await getSupabaseAdmin().storage.listBuckets()
    if (error) return 'ERROR' as const
    return data?.some((item) => item.name === bucket) ? 'CONFIGURADO' as const : 'FALTA' as const
  } catch { return 'ERROR' as const }
}

export async function getSetupSnapshot(): Promise<SetupSnapshot> {
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'https'
  const origin = host ? `${protocol}://${host}` : null
  const checks: SetupCheck[] = envDefinitions.map(([name, required, detail, secret]) => ({ id: name, label: name, state: stateFor(present(name), required), detail: required ? `Requerida · ${detail}` : `Opcional · ${detail}`, required, secret }))
  const supabaseReady = present('SUPABASE_SERVICE_ROLE_KEY') && present('NEXT_PUBLIC_SUPABASE_URL')
  const tableResults = await Promise.all(tables.map(async ([table, detail]) => [table, detail, await probeTable(table, requiredColumns[table])] as const))
  const databaseChecks: SetupCheck[] = [
    { id: 'supabase-connection', label: 'Conexión server-side', state: stateFor(supabaseReady), detail: 'Se prueba mediante consultas read-only con el cliente administrativo.' },
    ...tableResults.map(([table, detail, state]) => ({ id: `table-${table}`, label: `Tabla ${table}`, state, detail: `${detail}. No se crean tablas desde /setup.` })),
    { id: 'bucket-profile-photos', label: 'Storage bucket profile-photos', state: supabaseReady ? await probeBucket('profile-photos') : 'ERROR', detail: 'Bucket privado usado por banners y fotos de perfil.' },
  ]
  const redirect = process.env.DISCORD_REDIRECT_URI?.trim()
  const oauthChecks: SetupCheck[] = [
    { id: 'oauth-callback-shape', label: 'Callback OAuth', state: redirect?.endsWith('/api/auth/discord/callback') ? 'CONFIGURADO' : redirect ? 'ERROR' : 'FALTA', detail: 'Debe terminar exactamente en /api/auth/discord/callback.' },
    { id: 'oauth-portal', label: 'Redirect registrado en Discord Developer Portal', state: 'REQUIERE CONFIGURACIÓN MANUAL', detail: 'El portal externo no puede consultarse de forma segura desde la aplicación.' },
  ]
  let botState: CheckState = present('DISCORD_BOT_TOKEN') ? 'CONFIGURADO' : 'FALTA'
  if (present('DISCORD_BOT_TOKEN')) { try { const response = await fetch('https://discord.com/api/v10/users/@me', { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }, cache: 'no-store' }); botState = response.ok ? 'CONFIGURADO' : 'ERROR' } catch { botState = 'ERROR' } }
  const discordChecks: SetupCheck[] = [
    { id: 'discord-bot-token', label: 'Bot token', state: botState, detail: 'Se valida contra Discord server-side; nunca se devuelve su valor.', secret: true },
    { id: 'discord-public-key', label: 'Public Key Ed25519', state: stateFor(present('DISCORD_PUBLIC_KEY')), detail: 'La ruta /api/discord/interactions la usa para verificar firmas.', secret: true },
    { id: 'discord-attendance-channel', label: 'Attendance channel ID', state: present('DISCORD_ATTENDANCE_CHANNEL_ID') && validDiscordId(process.env.DISCORD_ATTENDANCE_CHANNEL_ID) ? 'CONFIGURADO' : present('DISCORD_ATTENDANCE_CHANNEL_ID') ? 'ERROR' : 'FALTA', detail: 'Destino de los mensajes publicados por Attendance.' },
    { id: 'discord-schedule-channel', label: 'Schedule channel ID', state: stateFor(present('DISCORD_SCHEDULE_CHANNEL_ID'), false), detail: 'Opcional: solo es necesario si se publica Schedule en Discord.' },
    { id: 'discord-interactions-portal', label: 'Interactions Endpoint URL', state: 'REQUIERE CONFIGURACIÓN MANUAL', detail: `Debe apuntar a ${origin ?? '[deployment-origin]'}/api/discord/interactions.` },
    { id: 'discord-intents', label: 'Intents y permisos del bot', state: 'REQUIERE CONFIGURACIÓN MANUAL', detail: 'Revisar permisos del canal en Discord Developer Portal y del servidor.' },
  ]
  const adminId = process.env.INITIAL_ADMIN_DISCORD_ID
  const adminRecord = supabaseReady && adminId ? await getSupabaseAdmin().from('guild_users').select('discord_user_id, role').eq('discord_user_id', adminId).maybeSingle() : { data: null, error: null }
  const sections: SetupSection[] = [
    { id: 'environment', title: 'Variables de entorno', purpose: 'Presencia y formato básico sin revelar valores.', checks },
    { id: 'database', title: 'Supabase y Storage', purpose: 'Conectividad, tablas, columnas mínimas y bucket requerido.', checks: databaseChecks },
    { id: 'oauth', title: 'Discord OAuth', purpose: 'Variables y callback; el registro del portal requiere revisión humana.', checks: oauthChecks },
    { id: 'discord', title: 'Discord Bot e Interactions', purpose: 'Bot, firma, canales y configuración externa.', checks: discordChecks },
    { id: 'admin', title: 'Administrador inicial', purpose: 'Valida el ID y comprueba el registro sin crearlo.', checks: [
      { id: 'admin-id', label: 'INITIAL_ADMIN_DISCORD_ID', state: validDiscordId(adminId) ? 'CONFIGURADO' : adminId ? 'ERROR' : 'FALTA', detail: 'Snowflake de Discord del administrador inicial.' },
      { id: 'admin-record', label: 'Registro admin en guild_users', state: adminRecord.error ? 'ERROR' : adminRecord.data?.role === 'admin' ? 'CONFIGURADO' : adminId ? 'FALTA' : 'REQUIERE CONFIGURACIÓN MANUAL', detail: 'El login inicial sincroniza/promueve este usuario; /setup no crea filas.' },
    ] },
    { id: 'features', title: 'Funcionalidades', purpose: 'Dependencias reales detectadas en la aplicación.', checks: [
      { id: 'feature-roster', label: 'Roster y perfiles', state: tableResults.find(([table]) => table === 'roster_members')?.[2] ?? 'ERROR', detail: 'roster_members + profile-photos opcional para imágenes.' },
      { id: 'feature-board', label: 'Boards y Parties', state: tableResults.filter(([table]) => ['boards', 'board_parties', 'board_party_members'].includes(table)).every((row) => row[2] === 'CONFIGURADO') ? 'CONFIGURADO' : 'FALTA', detail: 'Tres tablas y sus relaciones con roster_members.' },
      { id: 'feature-attendance', label: 'Attendance', state: tableResults.filter(([table]) => ['attendance_events', 'attendance_records'].includes(table)).every((row) => row[2] === 'CONFIGURADO') ? 'CONFIGURADO' : 'FALTA', detail: 'Incluye board_id, código de cuatro dígitos, duración y registros; no usa snapshots.' },
      { id: 'feature-announcements', label: 'Announcements', state: tableResults.find(([table]) => table === 'announcements')?.[2] ?? 'ERROR', detail: 'Creación, edición y eliminación para staff/admin.' },
      { id: 'feature-schedules', label: 'Schedules', state: tableResults.find(([table]) => table === 'schedules')?.[2] ?? 'ERROR', detail: 'Cronograma persistido; publicación Discord es opcional.' },
      { id: 'feature-appearance', label: 'Appearance / Banner', state: tableResults.find(([table]) => table === 'appearance_settings')?.[2] ?? 'ERROR', detail: 'appearance_settings + bucket privado profile-photos.' },
    ] },
  ]
  const instructionsAi = ['Primero auditar el estado actual; no inventar secrets, IDs ni datos.', 'Configurar variables y servicios en este orden: Supabase, migrations, Storage, Discord OAuth, Bot/Interactions y administrador inicial.', 'Aplicar las migrations con la herramienta de Supabase; nunca desde /setup. No eliminar migrations históricas ni modificar producción durante una instalación limpia.', 'Validar /setup, login OAuth, permisos de rol, roster, Board, Attendance, Schedule, Announcements, Profile y Appearance después de cada integración.', 'Pedir al usuario cualquier secreto, ID, permiso externo o configuración del Developer Portal que no pueda comprobarse automáticamente.', 'No recrear funcionalidades existentes ni exponer valores de variables sensibles.']
  const instructionsAdmin = ['En Discord Developer Portal copia Client ID, Client Secret, Public Key y Bot Token en Environment Variables de Vercel; nunca los pegues en código.', 'Registra como OAuth Redirect URI la URL pública terminada en /api/auth/discord/callback.', 'Registra como Interactions Endpoint URL la URL pública terminada en /api/discord/interactions y revisa permisos del bot en los canales.', 'En Supabase verifica que las migrations estén aplicadas y que exista el bucket privado profile-photos; no publiques sus objetos.', 'En Vercel agrega las variables por entorno y haz redeploy cuando cambies secrets o configuración de runtime.', 'CONFIGURADO significa comprobado; FALTA significa ausencia detectable; ERROR significa una comprobación fallida; REQUIERE CONFIGURACIÓN MANUAL significa que depende de un portal externo; NO REQUERIDO significa que es opcional en el estado actual.']
  const summary = { CONFIGURADO: 0, FALTA: 0, 'REQUIERE CONFIGURACIÓN MANUAL': 0, ERROR: 0, 'NO REQUERIDO': 0 } as Record<CheckState, number>
  sections.flatMap((section) => section.checks).forEach((check) => { summary[check.state] += 1 })
  return { origin, sections, instructionsAi, instructionsAdmin, summary }
}

export async function requireSetupAdmin() {
  const { getCurrentGuildUser } = await import('@/lib/auth/users')
  const user = await getCurrentGuildUser()
  return user?.role === 'admin' ? user : null
}
