import 'server-only'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { readSessionToken, SESSION_COOKIE } from '@/lib/auth/session'

export const ROLES = ['pending', 'member', 'staff', 'admin'] as const
export type Role = (typeof ROLES)[number]

export type GuildUser = {
  discord_user_id: string
  username: string
  email: string | null
  role: Role
  approved_by: string | null
  approved_at: string | null
  created_at: string
  last_login_at: string
  updated_at?: string
}

const USER_COLUMNS = 'discord_user_id, username, email, role, approved_by, approved_at, created_at, last_login_at, updated_at'

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

export function isManagementRole(role: Role | null | undefined): role is 'staff' | 'admin' {
  return role === 'staff' || role === 'admin'
}

export function canManageAsActor(user: GuildUser | null | undefined) {
  return Boolean(user && (isInitialAdmin(user.discord_user_id) || isManagementRole(user.role)))
}

export function isInitialAdmin(discordUserId: string) {
  const initialAdminId = process.env.INITIAL_ADMIN_DISCORD_ID?.trim()
  return Boolean(initialAdminId) && initialAdminId === discordUserId
}

export async function syncGuildUserOnLogin(identity: { discordUserId: string; username: string; email?: string }) {
  const now = new Date().toISOString()
  const record: Record<string, unknown> = {
    discord_user_id: identity.discordUserId,
    username: identity.username,
    email: identity.email ?? null,
    last_login_at: now,
    updated_at: now,
  }
  if (isInitialAdmin(identity.discordUserId)) record.role = 'admin'

  const { error } = await getSupabaseAdmin().from('guild_users').upsert(record, { onConflict: 'discord_user_id' })
  if (error) throw new Error(`Failed to sync guild user: ${error.message}`)
}

export async function getGuildUser(discordUserId: string) {
  const { data, error } = await getSupabaseAdmin().from('guild_users').select(USER_COLUMNS).eq('discord_user_id', discordUserId).maybeSingle<GuildUser>()
  if (error) throw new Error(`Failed to load guild user: ${error.message}`)
  return data
}

export async function getCurrentGuildUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = token ? await readSessionToken(token) : null
  return session ? getGuildUser(session.discordUserId) : null
}

export async function listGuildUsers() {
  const { data, error } = await getSupabaseAdmin().from('guild_users').select(USER_COLUMNS).order('role').order('created_at').returns<GuildUser[]>()
  if (error) throw new Error(`Failed to list guild users: ${error.message}`)
  return data ?? []
}

export async function setGuildUserRole(params: { targetDiscordUserId: string; role: Role; actorDiscordUserId: string }) {
  if (isInitialAdmin(params.targetDiscordUserId) || params.targetDiscordUserId === params.actorDiscordUserId) {
    throw new Error('The owner administrator cannot be modified')
  }
  const actor = await getGuildUser(params.actorDiscordUserId)
  if (!actor || !isManagementRole(actor.role)) throw new Error('Not authorized')
  if (actor.role === 'staff' && params.role === 'admin') throw new Error('Staff cannot grant administrator privileges')

  const now = new Date().toISOString()
  const { error } = await getSupabaseAdmin().from('guild_users').update({ role: params.role, approved_by: params.role === 'pending' ? null : params.actorDiscordUserId, approved_at: params.role === 'pending' ? null : now, updated_at: now }).eq('discord_user_id', params.targetDiscordUserId)
  if (error) throw new Error(`Failed to update role: ${error.message}`)
}

import { getProfileImageUrls } from '@/lib/profile-images'

export type RosterMember = {
  id: string
  discord_user_id: string
  display_name: string | null
  class_name: string | null
  combat_role: 'DPS' | 'HEAL' | 'TANK'
  weapon_1: string | null
  weapon_2: string | null
  note: string | null
  gear_score: number | null
  build_type: 'PvP' | 'PvE' | 'Hybrid' | null
  profile_image_url: string | null
  profile_image_signed_url?: string | null
  guild_role?: 'admin' | 'staff' | 'member' | 'pending'
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function listRosterMembers(includeInactive = false) {
  let query = getSupabaseAdmin()
    .from('roster_members')
    .select('id, discord_user_id, display_name, class_name, combat_role, weapon_1, weapon_2, note, gear_score, build_type, profile_image_url, is_active, created_at, updated_at')
    .order('is_active', { ascending: false })
    .order('combat_role')
    .order('display_name')
  if (!includeInactive) query = query.eq('is_active', true)
  const { data, error } = await query.returns<RosterMember[]>()
  if (error) throw new Error(`Failed to list roster members: ${error.message}`)
  const members = data ?? []
  const [urls, guildUsers] = await Promise.all([
    getProfileImageUrls(members.map((member) => member.profile_image_url)),
    getSupabaseAdmin().from('guild_users').select('discord_user_id, role').in('discord_user_id', members.map((member) => member.discord_user_id)),
  ])
  if (guildUsers.error) throw new Error(`Failed to list roster guild roles: ${guildUsers.error.message}`)
  const roles = new Map((guildUsers.data ?? []).map((user) => [user.discord_user_id, user.role as RosterMember['guild_role']]))
  return members.map((member) => ({ ...member, guild_role: roles.get(member.discord_user_id), profile_image_signed_url: member.profile_image_url ? urls.get(member.profile_image_url) ?? null : null }))
}

export async function listApprovedGuildUsers() {
  const { data, error } = await getSupabaseAdmin()
    .from('guild_users')
    .select('discord_user_id, username, role')
    .neq('role', 'pending')
    .order('username')
    .returns<Array<Pick<GuildUser, 'discord_user_id' | 'username' | 'role'>>>()
  if (error) throw new Error(`Failed to list approved guild users: ${error.message}`)
  return data ?? []
}

export type Announcement = { id: string; title: string; body: string; author_discord_user_id: string; author_username?: string; author_profile_image_url?: string | null; created_at: string }

export async function listAnnouncements() {
  const { data, error } = await getSupabaseAdmin().from('announcements').select('id, title, body, author_discord_user_id, created_at').order('created_at', { ascending: false }).returns<Array<Omit<Announcement, 'author_username'>>>()
  if (error) throw new Error(`Failed to list announcements: ${error.message}`)
  const announcements = data ?? []
  const authorIds = [...new Set(announcements.map((announcement) => announcement.author_discord_user_id))]
  if (authorIds.length === 0) return announcements
  const { data: authors, error: authorsError } = await getSupabaseAdmin().from('guild_users').select('discord_user_id, username').in('discord_user_id', authorIds)
  if (authorsError) throw new Error(`Failed to list announcement authors: ${authorsError.message}`)
  const { data: roster, error: rosterError } = await getSupabaseAdmin().from('roster_members').select('discord_user_id, profile_image_url').in('discord_user_id', authorIds)
  if (rosterError) throw new Error(`Failed to list announcement author profiles: ${rosterError.message}`)
  const usernames = new Map((authors ?? []).map((author) => [author.discord_user_id, author.username]))
  const imageUrls = await getProfileImageUrls((roster ?? []).map((member) => member.profile_image_url))
  const images = new Map((roster ?? []).map((member) => [member.discord_user_id, member.profile_image_url ? imageUrls.get(member.profile_image_url) ?? null : null]))
  return announcements.map((announcement) => ({ ...announcement, author_username: usernames.get(announcement.author_discord_user_id), author_profile_image_url: images.get(announcement.author_discord_user_id) ?? null }))
}

export async function createAnnouncement(params: { title: string; body: string; authorDiscordUserId: string }) {
  const { error } = await getSupabaseAdmin().from('announcements').insert({ title: params.title, body: params.body, author_discord_user_id: params.authorDiscordUserId })
  if (error) throw new Error(`Failed to create announcement: ${error.message}`)
}

export async function updateAnnouncement(params: { id: string; title: string; body: string }) {
  const { error } = await getSupabaseAdmin()
    .from('announcements')
    .update({ title: params.title, body: params.body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
  if (error) throw new Error(`Failed to update announcement: ${error.message}`)
}

export async function deleteAnnouncement(id: string) {
  const { error } = await getSupabaseAdmin().from('announcements').delete().eq('id', id)
  if (error) throw new Error(`Failed to delete announcement: ${error.message}`)
}

export async function requireManagementUser() {
  const user = await getCurrentGuildUser()
  if (!user || !isManagementRole(user.role)) return null
  return user
}

export async function requireApprovedUser() {
  const user = await getCurrentGuildUser()
  return user && (user.role !== 'pending' || isInitialAdmin(user.discord_user_id)) ? user : null
}

export async function getSessionIdentity() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return token ? readSessionToken(token) : null
}

export { USER_COLUMNS }
