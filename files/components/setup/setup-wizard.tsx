'use client'

import { useState } from 'react'
import type { CheckState, SetupCheck, SetupSection, SetupSnapshot } from '@/lib/setup/diagnostics'

const tones: Record<CheckState, string> = { CONFIGURADO: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-200', FALTA: 'border-rose-300/20 bg-rose-400/10 text-rose-200', 'REQUIERE CONFIGURACIÓN MANUAL': 'border-amber-300/20 bg-amber-400/10 text-amber-200', ERROR: 'border-rose-300/20 bg-rose-400/10 text-rose-200', 'NO REQUERIDO': 'border-white/10 bg-white/[0.04] text-muted-foreground' }

function CheckRow({ check }: { check: SetupCheck }) {
  return <li className="flex flex-col gap-2 border-b border-white/[0.07] py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6"><div><h3 className="font-medium">{check.label}{check.secret && <span className="ml-2 text-xs text-muted-foreground">SECRET</span>}</h3><p className="mt-1 text-sm text-muted-foreground">{check.detail}</p></div><span className={`w-fit shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${tones[check.state]}`}>{check.state}</span></li>
}

function Section({ section }: { section: SetupSection }) {
  return <section className="rounded-3xl border border-white/10 bg-card/70 p-5 sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80">Diagnóstico</p><h2 className="mt-2 text-xl font-semibold">{section.title}</h2><p className="mt-2 text-sm text-muted-foreground">{section.purpose}</p></div><ul className="mt-4">{section.checks.map((check) => <CheckRow key={check.id} check={check} />)}</ul></section>
}

function Guide({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-3xl border border-white/10 bg-card/70 p-5 sm:p-6"><h2 className="text-xl font-semibold">{title}</h2><ol className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">{items.map((item, index) => <li key={item} className="flex gap-3"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-400/15 text-xs font-semibold text-violet-200">{index + 1}</span><span>{item}</span></li>)}</ol></section>
}

export function SetupDashboard({ snapshot }: { snapshot: SetupSnapshot }) {
  const [active, setActive] = useState('all')
  const visible = active === 'all' ? snapshot.sections : snapshot.sections.filter((section) => section.id === active)
  const summaryState = snapshot.summary.ERROR > 0 ? 'ERROR' : snapshot.summary.FALTA > 0 ? 'CONFIGURACIÓN INCOMPLETA' : snapshot.summary['REQUIERE CONFIGURACIÓN MANUAL'] > 0 ? 'REQUIERE REVISIÓN MANUAL' : 'CONFIGURACIÓN COMPLETA'
  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12"><div className="mx-auto max-w-6xl"><header className="flex flex-wrap items-start justify-between gap-6"><div><p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/80">Faek Taxi Guild Manager</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Diagnóstico del proyecto</h1><p className="mt-3 max-w-2xl text-muted-foreground">Estado de servicios, variables, esquema y configuración externa. Esta pantalla solo lee; nunca crea, modifica ni elimina nada.</p></div><button type="button" onClick={() => window.location.reload()} className="rounded-xl border border-violet-300/30 px-4 py-2 text-sm font-semibold text-violet-200 hover:bg-violet-400/10">Actualizar</button></header>
  <section className="mt-8 rounded-3xl border border-violet-300/20 bg-violet-400/[0.08] p-5 sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Estado del sistema</p><div className="mt-2 flex flex-wrap items-end justify-between gap-5"><h2 className="text-2xl font-semibold">{summaryState}</h2><div className="flex flex-wrap gap-3 text-xs font-semibold"><span className="text-emerald-200">CONFIGURADO {snapshot.summary.CONFIGURADO}</span><span className="text-rose-200">FALTA {snapshot.summary.FALTA}</span><span className="text-amber-200">MANUAL {snapshot.summary['REQUIERE CONFIGURACIÓN MANUAL']}</span><span className="text-rose-200">ERROR {snapshot.summary.ERROR}</span></div></div></section>
  <nav className="mt-6 overflow-x-auto" aria-label="Filtrar diagnósticos"><div className="flex min-w-max gap-2">{[['all', 'Todo'], ...snapshot.sections.map((section) => [section.id, section.title])].map(([id, label]) => <button key={id} type="button" onClick={() => setActive(id)} className={`rounded-full border px-3 py-2 text-sm ${active === id ? 'border-violet-300 bg-violet-400 text-black' : 'border-white/10 text-muted-foreground hover:bg-white/5'}`}>{label}</button>)}</div></nav>
  <div className="mt-6 grid gap-6 lg:grid-cols-2">{visible.map((section) => <Section key={section.id} section={section} />)}</div>
  <div className="mt-6 grid gap-6 lg:grid-cols-2"><Guide title="Instrucciones para IA" items={snapshot.instructionsAi} /><Guide title="Guía para el administrador" items={snapshot.instructionsAdmin} /></div>
  <footer className="mt-6 rounded-3xl border border-amber-300/20 bg-amber-400/[0.06] p-5 text-sm text-amber-100"><strong>Seguridad:</strong> los valores de secrets, tokens, passwords e IDs sensibles no se muestran. La configuración externa de Discord y Vercel requiere revisión humana. No se ejecutan migrations desde esta página.</footer></div></main>
}
