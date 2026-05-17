// src/lib/estale/visit-mutations.ts
// Helpers GraphQL pour les visites d'immeubles : upload multipart (spec graphql-multipart-request).

import type { EstaleVisitFile } from './visit-types'

const BASE = process.env.ESTALE_API_BASE_URL || 'https://api.estale.app'
const COMMON_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Origin: 'https://app.estale.app',
  Referer: 'https://app.estale.app/',
}

/**
 * Upload d'une photo vers estale via la mutation createFile.
 *
 * Le binding GraphQL d'estale supporte spec graphql-multipart-request : on envoie un
 * FormData avec 3 parts (operations, map, 0) et fetch natif.
 *
 * @param sessionAuth header Cookie OU "Bearer xxx" — récupéré par l'appelant via estale-api
 * @returns le File créé côté estale
 */
export async function uploadCommentFileMultipart(
  sessionAuth: string,
  visitId: string,
  commentId: string,
  file: Blob,
  filename: string,
): Promise<EstaleVisitFile> {
  const operations = {
    query: `mutation($visitId: ID!, $commentId: ID!, $file: Upload!) {
      updateVisit(id: $visitId) {
        updateComment(id: $commentId) {
          createFile(file: $file) {
            id
            documents {
              id
              filename
            }
          }
        }
      }
    }`,
    variables: {
      visitId,
      commentId,
      file: null,
    },
  }

  const map = { '0': ['variables.file'] }

  const form = new FormData()
  form.append('operations', JSON.stringify(operations))
  form.append('map', JSON.stringify(map))
  form.append('0', file, filename)

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...COMMON_HEADERS,
  }
  if (sessionAuth.startsWith('Bearer ')) {
    headers['Authorization'] = sessionAuth
  } else {
    headers['Cookie'] = sessionAuth
  }

  const response = await fetch(`${BASE}/graphql/intranet`, {
    method: 'POST',
    headers,
    body: form,
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Estale upload failed: ${response.status} — ${body.slice(0, 200)}`)
  }

  const json = await response.json()
  if (json.errors?.length) {
    throw new Error(`Estale upload GraphQL error: ${json.errors[0].message}`)
  }

  const docs: EstaleVisitFile[] = json.data?.updateVisit?.updateComment?.createFile?.documents || []
  const uploaded = docs[docs.length - 1]
  if (!uploaded) {
    throw new Error('Estale upload : aucun document retourné')
  }
  return uploaded
}
