"use client"

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { LoginForm } from "@/components/login-form"
import Galaxy from "@/components/animations/Galaxy"

function LoginContent() {
  const search = useSearchParams()
  const redirect = search.get('redirect') || '/apps'

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 overflow-hidden">
      {/* Galaxy Background */}
      <div className="absolute inset-0 z-0">
        <Galaxy
          mouseRepulsion={false}
          mouseInteraction={false}
          density={1.5}
          glowIntensity={0.3}
          saturation={0.2}
          hueShift={240}
          transparent={false}
        />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center font-medium text-white">
          <img
            src="/beamo-logo.png"
            alt="Beamô"
            className="size-8 rounded-md"
          />
          Beamô
        </a>
        <LoginForm redirect={redirect} />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-slate-900"></div>
        <div className="relative z-10 flex w-full max-w-sm flex-col gap-6">
          <div className="flex items-center gap-2 self-center font-medium text-white">
            <img
              src="/beamo-logo.png"
              alt="Beamô"
              className="size-8 rounded-md"
            />
            Beamô
          </div>
          <div className="animate-pulse text-white">Chargement...</div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
