import { cookies } from 'next/headers'
import crypto from 'node:crypto'

const COOKIE_NAME = 'app_session'

type SessionPayload = {
  email: string
  exp: number // epoch seconds
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is required')
  return secret
}

export function signSession(email: string, ttlSeconds = 60 * 60 * 24 * 7) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload: SessionPayload = { email, exp: Math.floor(Date.now() / 1000) + ttlSeconds }
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const data = `${header}.${payloadB64}`
  const h = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url')
  return `${data}.${h}`
}

export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, payload, sig] = parts
  const data = `${header}.${payload}`
  const expected = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url')
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return null
    if (!crypto.timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  try {
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionPayload
    if (json.exp < Math.floor(Date.now() / 1000)) return null
    return json
  } catch {
    return null
  }
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export function clearSessionCookie() {
  const cookieStore = cookies()
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

export function getSessionFromCookies(): SessionPayload | null {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return verifySession(token)
}

export const SessionCookieName = COOKIE_NAME

