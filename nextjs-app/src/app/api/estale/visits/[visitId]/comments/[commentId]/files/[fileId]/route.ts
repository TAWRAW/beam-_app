// src/app/api/estale/visits/[visitId]/comments/[commentId]/files/[fileId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { deleteVisitCommentFile, isEstaleConfigured } from '@/lib/estale-api'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { visitId: string; commentId: string; fileId: string } },
) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!
  if (!isEstaleConfigured()) {
    return NextResponse.json({ error: 'API Estale non configurée' }, { status: 503 })
  }

  try {
    await deleteVisitCommentFile(params.visitId, params.commentId, params.fileId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE file :', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
