import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { requireUser } from '@/lib/server-auth'

export const runtime = 'nodejs'
export const maxDuration = 60

interface PDFRequestBody {
  html: string
  metadata?: {
    documentType?: string
    title?: string
    building?: string
    date?: string
  }
}

export async function POST(request: NextRequest) {
  // Génération PDF réservée aux utilisateurs connectés (la route était ouverte à tous)
  const auth = await requireUser()
  if (!auth.ok) return auth.response!

  try {
    const body: PDFRequestBody = await request.json()

    if (!body.html) {
      return NextResponse.json(
        { error: 'Le contenu HTML est requis' },
        { status: 400 }
      )
    }

    // Construire le HTML complet avec Tailwind CDN
    const fullHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${body.metadata?.title || 'Document'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      margin: 0;
      padding: 0;
    }
    /* Affiche Travaux */
    #document-preview-content {
      width: 210mm;
      min-height: 297mm;
      max-width: 210mm;
      margin: 0 auto;
      box-sizing: border-box;
    }
    /* Contacts Utiles - single page */
    .contacts-utiles-page {
      width: 210mm !important;
      height: 297mm !important;
      max-width: 210mm !important;
      margin: 0 !important;
      box-shadow: none !important;
    }
    /* Règlement Intérieur - multi-pages */
    .reglement-page {
      width: 210mm !important;
      height: 297mm !important;
      max-width: 210mm !important;
      margin: 0 !important;
      box-shadow: none !important;
      break-after: page;
    }
    /* Constat DDE - 3 exemplaires */
    .constat-page {
      width: 210mm !important;
      height: 297mm !important;
      max-width: 210mm !important;
      margin: 0 !important;
      box-shadow: none !important;
      break-after: page;
    }
    .page-gap {
      display: none !important;
    }
  </style>
</head>
<body>
  ${body.html}
</body>
</html>
`

    // Configuration de Chromium pour différents environnements
    let browser

    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      // Environnement serverless (Vercel, AWS Lambda)
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath(),
        headless: true,
      })
    } else {
      // Environnement local - utiliser Chrome installé
      const executablePath =
        process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : process.platform === 'win32'
            ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            : '/usr/bin/google-chrome'

      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath,
        headless: true,
      })
    }

    try {
      const page = await browser.newPage()

      // Définir le contenu HTML
      await page.setContent(fullHtml, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      })

      // Attendre que Tailwind soit chargé
      await page.waitForFunction(() => {
        return document.querySelector('script[src*="tailwindcss"]') !== null
      }, { timeout: 10000 }).catch(() => {
        // Ignorer si le timeout est atteint, continuer quand même
      })

      // Petit délai supplémentaire pour le rendu CSS
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Générer le PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
      })

      // Convertir en Buffer pour NextResponse
      const buffer = Buffer.from(pdfBuffer)

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${body.metadata?.title || 'document'}.pdf"`,
          'Cache-Control': 'no-store',
        },
      })
    } finally {
      await browser.close()
    }
  } catch (error) {
    console.error('Erreur génération PDF:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la génération du PDF',
      },
      { status: 500 }
    )
  }
}
