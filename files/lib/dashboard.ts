import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { Announcement, GuildUser, RosterMember } from '@/lib/auth/users'
import type { Board, BoardAssignment, BoardParty } from '@/lib/board'

export type DashboardBoard = { id: string; title: string; parties: number; assigned: number; available: number; capacity: number; roles: { DPS: number; HEAL: number; TANK: number } }
export type DashboardData = {
  user: { username: string; role: GuildUser['role'] }
  summary: { activeMembers: number | null; staff: number | null; pendingUsers: number | null; boardPlayers: number | null }
  boards: DashboardBoard[]
  currentBoard: (Board & { parties: BoardParty[]; assignments: BoardAssignment[]; roster: RosterMember[] }) | null
  announcements: Array<Omit<Announcement, 'author_username'> & { author_username?: string }>
  pendingUsers: GuildUser[]
  status: { authentication: boolean; database: boolean; roster: boolean; boards: boolean }
}

export async function getDashboardData(user: { username: string; role: GuildUser['role'] }): Promise<DashboardData> {
  const db = getSupabaseAdmin()
  const [usersResult, rosterResult, boardResult, announcementsResult] = await Promise.all([
    db.from('guild_users').select('discord_user_id, username, email, role, approved_by, approved_at, created_at, last_login_at, updated_at').order('created_at', { ascending: false }).returns<GuildUser[]>(),
    db.from('roster_members').select('id, discord_user_id, display_name, class_name, combat_role, weapon_1, weapon_2, note, is_active, created_at, updated_at').eq('is_active', true).returns<RosterMember[]>(),
    db.from('boards').select('id, title, is_current, created_by, created_at, updated_at').order('created_at').returns<Board[]>(),
    db.from('announcements').select('id, title, body, author_discord_user_id, created_at').order('created_at', { ascending: false }).limit(3).returns<Array<Omit<Announcement, 'author_username'>>>(),
  ])

  const users = usersResult.data ?? []
  const roster = rosterResult.data ?? []
  const boards = boardResult.data ?? []
  const boardDetails = await Promise.all(boards.map(async (board) => {
    const [partiesResult, assignmentsResult] = await Promise.all([
      db.from('board_parties').select('id, board_id, title, sort_order, created_at, updated_at').eq('board_id', board.id).order('sort_order').order('created_at').returns<BoardParty[]>(),
      db.from('board_party_members').select('id, board_id, party_id, roster_member_id, sort_order, created_at, updated_at').eq('board_id', board.id).order('sort_order').order('created_at').returns<BoardAssignment[]>(),
    ])
    const parties = partiesResult.data ?? []
    const assignments = assignmentsResult.data ?? []
    const rosterById = new Map(roster.map((member) => [member.id, member]))
    const assignedIds = new Set(assignments.map((assignment) => assignment.roster_member_id).filter((id) => rosterById.has(id)))
    const roles = assignments.reduce((counts, assignment) => { const role = rosterById.get(assignment.roster_member_id)?.combat_role; if (role) counts[role] += 1; return counts }, { DPS: 0, HEAL: 0, TANK: 0 })
    return { board, parties, assignments, loadSucceeded: !partiesResult.error && !assignmentsResult.error, summary: { id: board.id, title: board.title, parties: parties.length, assigned: assignedIds.size, available: Math.max(0, roster.length - assignedIds.size), capacity: parties.length * 6, roles } }
  }))
  const current = boardDetails[0]
  const currentBoard = current ? { ...current.board, parties: current.parties, assignments: current.assignments, roster } : null
  const boardLoadSucceeded = !boardResult.error && boardDetails.every((item) => item.loadSucceeded)

  const announcements = announcementsResult.data ?? []
  const authorIds = [...new Set(announcements.map((item) => item.author_discord_user_id))]
  const authorsResult = authorIds.length
    ? await db.from('guild_users').select('discord_user_id, username').in('discord_user_id', authorIds)
    : { data: [], error: null }
  const authorNames = new Map((authorsResult.data ?? []).map((author) => [author.discord_user_id, author.username]))

  const databaseOk = !usersResult.error && !rosterResult.error && !boardResult.error && !announcementsResult.error && !authorsResult.error
  const pendingUsers = users.filter((item) => item.role === 'pending')

  return {
    user,
    summary: {
      activeMembers: rosterResult.error ? null : roster.length,
      staff: usersResult.error ? null : users.filter((item) => item.role === 'staff' || item.role === 'admin').length,
      pendingUsers: usersResult.error ? null : pendingUsers.length,
      boardPlayers: currentBoard ? currentBoard.assignments.length : boardResult.error ? null : 0,
    },
    boards: boardDetails.map((item) => item.summary),
    currentBoard,
    announcements: announcements.map((item) => ({ ...item, author_username: authorNames.get(item.author_discord_user_id) })),
    pendingUsers,
    status: { authentication: true, database: databaseOk, roster: !rosterResult.error, boards: boardLoadSucceeded },
  }
}

export function formatRelativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'hace unos segundos'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} día${days === 1 ? '' : 's'}`
}
