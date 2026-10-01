function DiscordMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-current">
      <path d="M19.54 5.04A16.3 16.3 0 0 0 15.4 3.76l-.5 1.02a15.1 15.1 0 0 0-5.8 0l-.5-1.02a16.3 16.3 0 0 0-4.14 1.28C1.84 8.84 1.13 12.54 1.5 16.2a16.7 16.7 0 0 0 5.06 2.56l1.22-1.67c-.67-.25-1.3-.56-1.9-.92l.46-.35c3.67 1.7 7.65 1.7 11.28 0l.47.35c-.61.36-1.25.67-1.91.92l1.22 1.67a16.7 16.7 0 0 0 5.05-2.56c.44-4.24-.74-7.9-2.91-11.16ZM8.35 14.1c-1.1 0-2-.98-2-2.18s.88-2.18 2-2.18 2 .98 2 2.18-.9 2.18-2 2.18Zm7.3 0c-1.1 0-2-.98-2-2.18s.88-2.18 2-2.18 2 .98 2 2.18-.9 2.18-2 2.18Z" />
    </svg>
  )
}

export function LoginCard() {
  return (
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-card/95 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10" aria-labelledby="login-title">
      <div className="flex flex-col items-center text-center">
        <div className="mb-7 flex size-16 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-2xl font-semibold tracking-tight text-violet-200 shadow-lg shadow-violet-950/30">
          FT
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/80">Faek Taxi</p>
        <h1 id="login-title" className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Guild Manager
        </h1>
        <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
          Sign in with your Discord account to access your guild workspace.
        </p>

        <a href="/api/auth/discord" className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] text-sm font-medium text-white transition-colors hover:bg-[#4752C4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
          <DiscordMark />
          Continue with Discord
        </a>
        <p className="mt-4 text-xs text-muted-foreground/70">Secure sign-in with Discord.</p>
      </div>
    </section>
  )
}

export default LoginCard
