import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth/session'
import { syncGuildUserOnLogin } from '@/lib/auth/users'

type DiscordTokenResponse = {
  access_token: string
  token_type: string
}

type DiscordUser = {
  id: string
  username: string
  global_name?: string | null
  email?: string | null
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const oauthError = request.nextUrl.searchParams.get('error')
  const clientId = process.env.DISCORD_CLIENT_ID
  const clientSecret = process.env.DISCORD_CLIENT_SECRET
  const redirectUri = process.env.DISCORD_REDIRECT_URI

  if (oauthError) {
    return NextResponse.redirect(new URL('/?error=discord_denied', request.url))
  }

  if (!code || !clientId || !clientSecret || !redirectUri || !process.env.ROSTER_SESSION_SECRET) {
    return NextResponse.json(
      { error: 'Discord OAuth is not fully configured on the server.' },
      { status: 503 },
    )
  }

  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
    cache: 'no-store',
  })

  if (!tokenResponse.ok) {
    return NextResponse.json({ error: 'Discord token exchange failed.' }, { status: 502 })
  }

  const tokenData = (await tokenResponse.json()) as DiscordTokenResponse
  const userResponse = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `${tokenData.token_type} ${tokenData.access_token}` },
    cache: 'no-store',
  })

  if (!userResponse.ok) {
    return NextResponse.json({ error: 'Discord identity lookup failed.' }, { status: 502 })
  }

  const user = (await userResponse.json()) as DiscordUser
  try {
    await syncGuildUserOnLogin({
      discordUserId: user.id,
      username: user.global_name || user.username,
      email: user.email || undefined,
    })
  } catch (error) {
    console.error('[v0] Discord callback: guild user sync failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json({ error: 'User record sync failed.' }, { status: 500 })
  }
  let sessionToken: string
  try {
    sessionToken = await createSessionToken({
      discordUserId: user.id,
      username: user.global_name || user.username,
      email: user.email || undefined,
    })
  } catch (error) {
    console.error('[v0] Discord callback: session creation failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json({ error: 'Session creation failed.' }, { status: 500 })
  }
  const response = NextResponse.redirect(new URL('/authenticated', request.url))
  response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions)
  return response
}
