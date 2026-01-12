import { NextRequest, NextResponse } from 'next/server'

const COMPTOIR_API_URL = 'https://www.le-comptoir-de-la-copropriete.fr/api/copropriete'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const response = await fetch(`${COMPTOIR_API_URL}/${id}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Copropriété non trouvée' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur proxy API copropriété:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}
