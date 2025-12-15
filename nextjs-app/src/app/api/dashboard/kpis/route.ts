import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 minutes

export async function GET() {
  const webhookUrl = process.env.N8N_DASHBOARD_WEBHOOK_URL

  if (!webhookUrl) {
    console.error('[Dashboard KPIs] N8N_DASHBOARD_WEBHOOK_URL non configuree')
    return NextResponse.json(
      { error: 'Configuration serveur manquante' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      console.error(`[Dashboard KPIs] Erreur n8n: ${response.status}`)
      return NextResponse.json(
        { error: 'Erreur lors de la recuperation des KPIs' },
        { status: 500 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[Dashboard KPIs] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur de connexion au service de donnees' },
      { status: 500 }
    )
  }
}
