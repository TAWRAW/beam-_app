import { NextRequest, NextResponse } from 'next/server'

const COMPTOIR_API_URL = 'https://www.le-comptoir-de-la-copropriete.fr/api/coproprietes/search'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const url = new URL(COMPTOIR_API_URL)

  // Forward all search params
  searchParams.forEach((value, key) => {
    url.searchParams.append(key, value)
  })

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erreur proxy API copropriétés:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    )
  }
}
