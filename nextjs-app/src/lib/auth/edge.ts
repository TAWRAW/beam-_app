type SessionPayload = {
  email: string
  exp: number
}

function b64urlToBytes(b64url: string): Uint8Array {
  const pad = '='.repeat((4 - (b64url.length % 4)) % 4)
  const base64 = (b64url + pad).replace(/-/g, '+').replace(/_/g, '/')
  const str = atob(base64)
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i)
  return bytes
}

function bytesToB64url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes))
  const base64 = btoa(bin)
  return base64.replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export async function verifySessionEdge(token: string | undefined | null, secret: string): Promise<SessionPayload | null> {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, payload, sig] = parts
  const data = `${header}.${payload}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const expected = bytesToB64url(signature)
  // timing safe-ish compare
  if (expected.length !== sig.length) return null
  let ok = 0
  for (let i = 0; i < expected.length; i++) ok |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  if (ok !== 0) return null

  try {
    const json = JSON.parse(new TextDecoder().decode(b64urlToBytes(payload))) as SessionPayload
    if (json.exp < Math.floor(Date.now() / 1000)) return null
    return json
  } catch {
    return null
  }
}
