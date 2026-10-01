import 'server-only'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { RosterMember } from '@/lib/auth/users'
import { getProfileImageUrls } from '@/lib/profile-images'

export type Board = { id: string; title: string; is_current: boolean; created_by: string; created_at: string; updated_at: string }
export type BoardParty = { id: string; board_id: string; title: string; sort_order: number; created_at: string; updated_at: string }
export type BoardAssignment = { id: string; board_id: string; party_id: string; roster_member_id: string; sort_order: number; created_at: string; updated_at: string }
const boardColumns = 'id, title, is_current, created_by, created_at, updated_at'

export async function listBoards() {
  const { data, error } = await getSupabaseAdmin().from('boards').select(boardColumns).order('created_at').returns<Board[]>()
  if (error) throw new Error(`Failed to list boards: ${error.message}`)
  return data ?? []
}
export async function listBoardData(boardId: string) {
  const db = getSupabaseAdmin()
  const [parties, assignments, roster] = await Promise.all([
    db.from('board_parties').select('id, board_id, title, sort_order, created_at, updated_at').eq('board_id', boardId).order('sort_order').order('created_at').returns<BoardParty[]>(),
    db.from('board_party_members').select('id, board_id, party_id, roster_member_id, sort_order, created_at, updated_at').eq('board_id', boardId).order('sort_order').order('created_at').returns<BoardAssignment[]>(),
    db.from('roster_members').select('id, discord_user_id, display_name, class_name, combat_role, weapon_1, weapon_2, note, gear_score, build_type, profile_image_url, is_active, created_at, updated_at').order('is_active', { ascending: false }).order('display_name').returns<RosterMember[]>(),
  ])
  if (parties.error) throw new Error(`Failed to list parties: ${parties.error.message}`)
  if (assignments.error) throw new Error(`Failed to list assignments: ${assignments.error.message}`)
  if (roster.error) throw new Error(`Failed to list roster members: ${roster.error.message}`)
  const members = roster.data ?? []
  const urls = await getProfileImageUrls(members.map((member) => member.profile_image_url))
  return { parties: parties.data ?? [], assignments: assignments.data ?? [], roster: members.map((member) => ({ ...member, profile_image_signed_url: member.profile_image_url ? urls.get(member.profile_image_url) ?? null : null })) }
}
export async function createBoardRecord(title: string, createdBy: string) {
  const db = getSupabaseAdmin()
  const { data, error } = await db.from('boards').insert({ title: title.trim(), created_by: createdBy, is_current: false }).select(boardColumns).single<Board>()
  if (error) throw new Error(`Failed to create board: ${error.message}`)
  return data
}
export async function updateBoardRecord(id: string, title: string) { const { error } = await getSupabaseAdmin().from('boards').update({ title: title.trim(), updated_at: new Date().toISOString() }).eq('id', id); if (error) throw new Error(`Failed to update board: ${error.message}`) }
export async function deleteBoardRecord(id: string) { const db = getSupabaseAdmin(); const { count, error: attendanceError } = await db.from('attendance_events').select('id', { count: 'exact', head: true }).eq('board_id', id); if (attendanceError) throw new Error(`Failed to check Board history: ${attendanceError.message}`); if ((count ?? 0) > 0) throw new Error('No se puede eliminar este Board porque tiene asistencias históricas asociadas. Renómbralo en su lugar.'); const { error } = await db.from('boards').delete().eq('id', id); if (error) { if (error.code === '23503') throw new Error('No se puede eliminar este Board porque está siendo usado por otros registros.'); throw new Error(`Failed to delete board: ${error.message}`) } }
export async function setCurrentBoardRecord(id: string) { const { error } = await getSupabaseAdmin().rpc('set_board_current', { board_id_to_set: id }); if (error) throw new Error(`Failed to set current board: ${error.message}`) }
export async function createPartyRecord(boardId: string, title: string, sortOrder: number) { const { data, error } = await getSupabaseAdmin().from('board_parties').insert({ board_id: boardId, title: title.trim(), sort_order: sortOrder }).select('*').single<BoardParty>(); if (error) throw new Error(`Failed to create party: ${error.message}`); return data }
export async function updatePartyRecord(id: string, title: string) { const { error } = await getSupabaseAdmin().from('board_parties').update({ title: title.trim(), updated_at: new Date().toISOString() }).eq('id', id); if (error) throw new Error(`Failed to update party: ${error.message}`) }
export async function deletePartyRecord(id: string) { const { error } = await getSupabaseAdmin().from('board_parties').delete().eq('id', id); if (error) throw new Error(`Failed to delete party: ${error.message}`) }
export async function assignMember(boardId: string, partyId: string, rosterMemberId: string, sortOrder: number) { const db = getSupabaseAdmin(); const { data: party, error: partyError } = await db.from('board_parties').select('id, board_id').eq('id', partyId).eq('board_id', boardId).maybeSingle<{ id: string; board_id: string }>(); if (partyError) throw new Error(`Failed to validate target party: ${partyError.message}`); if (!party) throw new Error('La party destino no pertenece a este board.'); const { count, error: countError } = await db.from('board_party_members').select('id', { count: 'exact', head: true }).eq('party_id', partyId); if (countError) throw new Error(`Failed to validate party capacity: ${countError.message}`); if ((count ?? 0) >= 6) throw new Error('Esta party ya tiene 6 jugadores.'); const { error } = await db.from('board_party_members').insert({ board_id: boardId, party_id: partyId, roster_member_id: rosterMemberId, sort_order: sortOrder }); if (error) { if (error.code === '23505') throw new Error('Este jugador ya está asignado a una party de este board.'); throw new Error(`Failed to assign roster member: ${error.message}`) } }
export async function moveMember(boardId: string, id: string, partyId: string, sortOrder: number) { const db = getSupabaseAdmin(); const { data: party, error: partyError } = await db.from('board_parties').select('id, board_id').eq('id', partyId).eq('board_id', boardId).maybeSingle<{ id: string; board_id: string }>(); if (partyError) throw new Error(`Failed to validate target party: ${partyError.message}`); if (!party) throw new Error('La party destino no pertenece a este board.'); const { count, error: countError } = await db.from('board_party_members').select('id', { count: 'exact', head: true }).eq('party_id', partyId).neq('id', id); if (countError) throw new Error(`Failed to validate party capacity: ${countError.message}`); if ((count ?? 0) >= 6) throw new Error('Esta party ya tiene 6 jugadores.'); const { error } = await db.from('board_party_members').update({ party_id: partyId, sort_order: sortOrder, updated_at: new Date().toISOString() }).eq('id', id).eq('board_id', boardId); if (error) throw new Error(`Failed to move roster member: ${error.message}`) }
export async function removeMember(id: string) { const { error } = await getSupabaseAdmin().from('board_party_members').delete().eq('id', id); if (error) throw new Error(`Failed to remove roster member: ${error.message}`) }
export async function reorderParties(orders: Array<{ id: string; sortOrder: number }>) { for (const order of orders) { const { error } = await getSupabaseAdmin().from('board_parties').update({ sort_order: order.sortOrder, updated_at: new Date().toISOString() }).eq('id', order.id); if (error) throw new Error(`Failed to reorder parties: ${error.message}`) } }
export async function reorderMembers(orders: Array<{ id: string; sortOrder: number }>) { for (const order of orders) { const { error } = await getSupabaseAdmin().from('board_party_members').update({ sort_order: order.sortOrder, updated_at: new Date().toISOString() }).eq('id', order.id); if (error) throw new Error(`Failed to reorder members: ${error.message}`) } }

export function validateBoardTitle(title: string) { if (title.trim().length < 1 || title.trim().length > 120) throw new Error('Board title must be between 1 and 120 characters') }
export function validatePartyTitle(title: string) { if (title.trim().length < 1 || title.trim().length > 80) throw new Error('Party title must be between 1 and 80 characters') }
export function validateUuid(value: string) { if (!/^[0-9a-f-]{36}$/i.test(value)) throw new Error('Invalid identifier') }

export { boardColumns }
