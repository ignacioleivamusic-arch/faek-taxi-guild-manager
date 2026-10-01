'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { DashboardBoard } from '@/lib/dashboard'

type Props = { boards: DashboardBoard[] }

export function BoardBrowser({ boards }: Props) {
  const [index, setIndex] = useState(0)
  const board = boards[index]
  if (!board) return <p className="mt-8 rounded-2xl bg-white/5 p-5 text-sm text-muted-foreground">No hay boards creados.</p>
  const previous = () => setIndex((current) => (current - 1 + boards.length) % boards.length)
  const next = () => setIndex((current) => (current + 1) % boards.length)

  return <>
    <div className="flex items-center gap-2">
      <button type="button" onClick={previous} aria-label="Previous Board" className="rounded-lg border border-white/10 px-2 py-1 text-lg text-muted-foreground transition hover:border-violet-300/40 hover:text-foreground">←</button>
      <button type="button" onClick={next} aria-label="Next Board" className="rounded-lg border border-white/10 px-2 py-1 text-lg text-muted-foreground transition hover:border-violet-300/40 hover:text-foreground">→</button>
      <Link href={`/board?board=${board.id}`} className="ml-auto text-sm text-violet-300 hover:text-violet-200">Gestionar board <span aria-hidden="true">→</span></Link>
    </div>
    <h2 id="current-board" className="mt-2 text-2xl font-semibold">{board.title}</h2>
    <div className="mt-6 grid grid-cols-3 gap-3 text-center"><div className="rounded-2xl bg-white/5 p-4"><p className="text-2xl font-semibold">{board.parties}</p><p className="mt-1 text-xs text-muted-foreground">Parties</p></div><div className="rounded-2xl bg-white/5 p-4"><p className="text-2xl font-semibold">{board.assigned} <span className="text-sm font-normal text-muted-foreground">/ {board.capacity}</span></p><p className="mt-1 text-xs text-muted-foreground">Jugadores</p></div><div className="rounded-2xl bg-white/5 p-4"><p className="text-2xl font-semibold text-emerald-300">{board.available}</p><p className="mt-1 text-xs text-muted-foreground">Disponibles</p></div></div>
    <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-sm"><span className="text-muted-foreground">DPS <strong className="ml-2 text-foreground">{board.roles.DPS}</strong></span><span className="text-muted-foreground">HEAL <strong className="ml-2 text-foreground">{board.roles.HEAL}</strong></span><span className="text-muted-foreground">TANK <strong className="ml-2 text-foreground">{board.roles.TANK}</strong></span></div>
  </>
}
