"use client"

import { useEffect, useState } from 'react'
import { useUserRole } from '@/hooks/useUserRole'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function DebugAuthPage() {
  const { role, loading, isAdmin } = useUserRole()
  const [apiResponse, setApiResponse] = useState(null)
  const [supabaseDebug, setSupabaseDebug] = useState<any>(null)

  useEffect(() => {
    async function fetchRoleDebug() {
      try {
        const response = await fetch('/api/user/role')
        const data = await response.json()
        setApiResponse(data)
      } catch (error) {
        console.error('Error fetching role debug:', error)
        setApiResponse({ error: error.message })
      }
    }

    async function debugSupabase() {
      try {
        const supabase = createSupabaseBrowserClient()

        // Check current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        // Check profile if user exists
        let profile = null
        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          profile = { data: profileData, error: profileError?.message }
        }

        setSupabaseDebug({
          user: user ? { id: user.id, email: user.email, role: user.role } : null,
          userError: userError?.message,
          session: session ? {
            expires_at: session.expires_at,
            access_token: session.access_token ? 'present' : 'missing'
          } : null,
          sessionError: sessionError?.message,
          profile,
          env: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
            anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing'
          }
        })
      } catch (error) {
        setSupabaseDebug({ error: error.message })
      }
    }

    fetchRoleDebug()
    debugSupabase()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Debug Authentification</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Hook useUserRole()</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
            <p><strong>Role:</strong> {role || 'null'}</p>
            <p><strong>Is Admin:</strong> {isAdmin ? 'true' : 'false'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">API Response</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Supabase Debug</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(supabaseDebug, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Cookies</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {typeof document !== 'undefined' ? document.cookie : 'SSR'}
          </pre>
        </div>
      </div>
    </div>
  )
}