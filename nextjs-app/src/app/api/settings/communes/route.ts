import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { requireAdmin } from '@/lib/server-auth'

const DATA_FILE = path.join(process.cwd(), 'data', 'communes.json')

async function readData(): Promise<Record<string, unknown>> {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}

async function writeData(data: Record<string, unknown>): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export async function GET() {
  // Réservé au cabinet : le middleware ne filtre que /apps/*, une route API
  // reste joignable depuis Internet sans garde explicite ici.
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const data = await readData()
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  // Réservé au cabinet : le middleware ne filtre que /apps/*, une route API
  // reste joignable depuis Internet sans garde explicite ici.
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  try {
    const body = await request.json()
    await writeData(body)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erreur sauvegarde communes:', error)
    return NextResponse.json({ error: 'Erreur sauvegarde' }, { status: 500 })
  }
}
