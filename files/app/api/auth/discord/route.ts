import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID
  const redirectUri = process.env.DISCORD_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Discord OAuth is not configured. Set DISCORD_CLIENT_ID and DISCORD_REDIRECT_URI.' },
      { status: 503 },
    )
  }

  const authorizationUrl = new URL('https://discord.com/oauth2/authorize')
  authorizationUrl.searchParams.set('client_id', clientId)
  authorizationUrl.searchParams.set('response_type', 'code')
  authorizationUrl.searchParams.set('redirect_uri', redirectUri)
  authorizationUrl.searchParams.set('scope', 'identify email')

  return NextResponse.redirect(authorizationUrl)
}
