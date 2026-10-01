import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  subtitle: string
  eyebrow?: string
  tone?: 'gold' | 'purple'
  action?: ReactNode
}

export function PageHeader({ title, subtitle, eyebrow = 'Comunicaciones del gremio', tone = 'gold', action }: PageHeaderProps) {
  const theme = tone === 'purple' ? { panel: 'border-violet-300/60 bg-gradient-to-br from-violet-400/10 via-card/80 to-card/50 shadow-[0_0_24px_rgba(139,92,246,0.12)]', subtitle: 'text-violet-200' } : { panel: 'border-amber-300/60 bg-gradient-to-br from-amber-400/10 via-card/80 to-card/50 shadow-[0_0_24px_rgba(251,191,36,0.10)]', subtitle: 'text-amber-200' }
  return (
    <header aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-page-title`} className={`relative mb-8 overflow-hidden rounded-3xl p-6 sm:p-8 ${theme.panel}`}>
      <p className="text-sm text-muted-foreground">{eyebrow}</p>
      <h1 id={`${title.toLowerCase().replace(/\s+/g, '-')}-page-title`} className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className={`mt-2 ${theme.subtitle}`}>{subtitle}</p>
      {action && <div className="mt-4">{action}</div>}
    </header>
  )
}
