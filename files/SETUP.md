# Faek Taxi Guild Manager — guía de reconstrucción

## Arquitectura

Aplicación Next.js App Router con Server Actions y rutas API. Supabase es el almacenamiento server-side. Discord proporciona OAuth y un bot para Interactions de Attendance. La sesión se cifra en una cookie HTTP-only con `ROSTER_SESSION_SECRET`.

## Funcionalidades

- Autenticación Discord OAuth, sesiones, aprobación y roles `pending`, `member`, `staff`, `admin`.
- Roster y perfiles con fotos privadas.
- Boards, Parties y asignaciones de roster.
- Attendance con eventos asociados a Board, código numérico de cuatro dígitos, duración, registros y `/attendance/status`.
- Announcements, Schedules, Appearance/Banner y panel administrativo.
- Discord Interactions para publicación y registro de Attendance.

## Variables de entorno

La lista canónica se deriva de `lib/setup/diagnostics.ts`. Incluye URLs/keys de Supabase, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, `DISCORD_PUBLIC_KEY`, `DISCORD_BOT_TOKEN`, `DISCORD_ATTENDANCE_CHANNEL_ID`, `DISCORD_SCHEDULE_CHANNEL_ID` opcional, `ROSTER_SESSION_SECRET` e `INITIAL_ADMIN_DISCORD_ID`. Nunca almacenar valores aquí ni mostrar secrets.

## Supabase

Aplicar las migrations existentes en orden cronológico, sin eliminar historial. Las tablas requeridas son `guild_users`, `roster_members`, `announcements`, `boards`, `board_parties`, `board_party_members`, `attendance_events`, `attendance_records`, `schedules` y `appearance_settings`. El bucket privado requerido es `profile-photos`; se usa para banners y fotos de perfil. `/setup` solo verifica; no crea tablas, buckets, policies ni datos.

## Discord

Registrar OAuth Redirect URI como `https://<deployment>/api/auth/discord/callback`. Registrar Interactions Endpoint URL como `https://<deployment>/api/discord/interactions`. Configurar permisos del bot para el canal de Attendance y cualquier canal de Schedule. La Public Key verifica firmas Ed25519. No inventar IDs, tokens o secrets.

## Orden de instalación

1. Crear un proyecto Supabase aislado y aplicar las migrations del repositorio.
2. Crear/verificar el bucket privado `profile-photos`.
3. Configurar las variables en Vercel por entorno.
4. Configurar OAuth, Bot e Interactions en Discord Developer Portal.
5. Hacer redeploy y abrir `/setup` con el usuario administrador inicial.
6. Validar login, roles, roster, Board, Attendance, Schedule, Announcements, Profile y Appearance.

## Reglas de seguridad

No inventar secrets. No inventar IDs. No mostrar secrets. No modificar datos reales de producción durante una instalación limpia. No eliminar migrations históricas. No recrear funcionalidades que ya existen. Primero revisar el estado actual, después solicitar únicamente datos faltantes y validar cada integración.

## Checks posteriores

Ejecutar `pnpm exec tsc --noEmit` y `pnpm build`. Revisar `/setup` como `admin`; confirmar que otro rol es redirigido. Probar una variable faltante sin exponer su valor, una tabla ausente y un error externo: los checks restantes deben seguir renderizando.

## Datos que debe pedir una IA

La IA debe pedir al administrador únicamente secretos, IDs, permisos de Discord, URLs de deployment o decisiones que no pueda comprobar de forma segura. Nunca debe pedir ni copiar datos de producción para una instalación limpia.
