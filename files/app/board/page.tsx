import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { BoardManager } from '@/components/guild/board-manager'
import { GuildNavigation } from '@/components/guild/navigation'
import { canManageAsActor, getCurrentGuildUser, requireApprovedUser } from '@/lib/auth/users'
import { listBoardData, listBoards } from '@/lib/board'

export const metadata: Metadata = { title: 'Board | Faek Taxi Guild Manager' }

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ board?: string }> }) {
  const user = await getCurrentGuildUser()
  const approved = await requireApprovedUser()
  if (!user) redirect('/')
  if (!approved) redirect('/authenticated')

  const boards = await listBoards()
  const params = await searchParams
  const activeBoard = boards.find((board) => board.id === params.board) ?? boards[0] ?? null
  const boardData = activeBoard ? await listBoardData(activeBoard.id) : { parties: [], assignments: [], roster: [] }
  const canManage = canManageAsActor(user)

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <GuildNavigation canManage={canManage} />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-3xl border border-amber-300/60 bg-gradient-to-br from-amber-400/10 via-card/80 to-card/50 p-6 shadow-[0_0_24px_rgba(251,191,36,0.10)] sm:p-8"><p className="text-sm text-muted-foreground">Organización de partidas</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Board</h1><p className="mt-2 text-amber-200">Coordina grupos, distribuye posiciones y organiza las actividades del gremio.</p></section>
        <div className="mt-8"><BoardManager boards={boards} activeBoard={activeBoard} parties={boardData.parties} assignments={boardData.assignments} roster={boardData.roster} canManage={canManage} /></div>
      </div>
    </main>
  )
}
