import { createHash } from 'node:crypto'
import { EncryptJWT, jwtDecrypt } from 'jose'

const SESSION_COOKIE = 'roster_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

type DiscordSession = {
  discordUserId: string
  username: string
  email?: string
}

function getSecretKey() {
  const secret = process.env.ROSTER_SESSION_SECRET?.trim()
  if (!secret) {
    throw new Error('ROSTER_SESSION_SECRET is not configured')
  }

  return new Uint8Array(createHash('sha256').update(secret, 'utf8').digest())
}

export async function createSessionToken(session: DiscordSession) {
  return new EncryptJWT(session)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .encrypt(getSecretKey())
}

export async function readSessionToken(token: string) {
  try {
    const { payload } = await jwtDecrypt(token, getSecretKey())
    if (typeof payload.discordUserId !== 'string' || typeof payload.username !== 'string') {
      return null
    }

    return {
      discordUserId: payload.discordUserId,
      username: payload.username,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    }
  } catch {
    return null
  }
}

export { SESSION_COOKIE }
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
}
