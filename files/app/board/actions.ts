'use server'

import { revalidatePath } from 'next/cache'
import { canManageAsActor, getCurrentGuildUser, requireApprovedUser } from '@/lib/auth/users'
import { assignMember, createBoardRecord, createPartyRecord, deleteBoardRecord, deletePartyRecord, moveMember, removeMember, reorderMembers, reorderParties, updateBoardRecord, updatePartyRecord, validateBoardTitle, validatePartyTitle, validateUuid } from '@/lib/board'

async function requireStaff() {
  const user = await getCurrentGuildUser()
  const approved = await requireApprovedUser()
  if (!user || !approved || !canManageAsActor(user)) throw new Error('Solo Staff y Administradores pueden gestionar el board.')
  return user
}

async function requireBoardViewer() {
  const user = await getCurrentGuildUser()
  const approved = await requireApprovedUser()
  if (!user || !approved) throw new Error('Debes tener acceso aprobado para ver el board.')
  return user
}
function text(formData: FormData, name: string) { return String(formData.get(name) ?? '').trim() }

export async function createBoard(formData: FormData) { const user = await requireStaff(); const title = text(formData, 'title'); validateBoardTitle(title); await createBoardRecord(title, user.discord_user_id); revalidatePath('/board') }
export async function updateBoard(formData: FormData) { await requireStaff(); const id = text(formData, 'id'); const title = text(formData, 'title'); validateUuid(id); validateBoardTitle(title); await updateBoardRecord(id, title); revalidatePath('/board') }
export async function deleteBoard(formData: FormData) { await requireStaff(); const id = text(formData, 'id'); validateUuid(id); await deleteBoardRecord(id); revalidatePath('/board') }
export async function createParty(formData: FormData) { await requireStaff(); const boardId = text(formData, 'boardId'); const title = text(formData, 'title'); validateUuid(boardId); validatePartyTitle(title); await createPartyRecord(boardId, title, Number(formData.get('sortOrder') ?? 0)); revalidatePath('/board') }
export async function updateParty(formData: FormData) { await requireStaff(); const id = text(formData, 'id'); const title = text(formData, 'title'); validateUuid(id); validatePartyTitle(title); await updatePartyRecord(id, title); revalidatePath('/board') }
export async function deleteParty(formData: FormData) { await requireStaff(); const id = text(formData, 'id'); validateUuid(id); await deletePartyRecord(id); revalidatePath('/board') }
export async function assignRosterMember(formData: FormData) { await requireStaff(); const boardId = text(formData, 'boardId'); const partyId = text(formData, 'partyId'); const rosterMemberId = text(formData, 'rosterMemberId'); validateUuid(boardId); validateUuid(partyId); validateUuid(rosterMemberId); await assignMember(boardId, partyId, rosterMemberId, Number(formData.get('sortOrder') ?? 0)); revalidatePath('/board') }
export async function moveRosterMember(formData: FormData) { await requireStaff(); const boardId = text(formData, 'boardId'); const id = text(formData, 'id'); const partyId = text(formData, 'partyId'); validateUuid(boardId); validateUuid(id); validateUuid(partyId); await moveMember(boardId, id, partyId, Number(formData.get('sortOrder') ?? 0)); revalidatePath('/board') }
export async function removeRosterMemberFromBoard(formData: FormData) { await requireStaff(); const id = text(formData, 'id'); validateUuid(id); await removeMember(id); revalidatePath('/board') }
export async function reorderBoardParties(formData: FormData) { await requireStaff(); await reorderParties(JSON.parse(text(formData, 'orders'))); revalidatePath('/board') }
export async function reorderBoardMembers(formData: FormData) { await requireStaff(); await reorderMembers(JSON.parse(text(formData, 'orders'))); revalidatePath('/board') }
