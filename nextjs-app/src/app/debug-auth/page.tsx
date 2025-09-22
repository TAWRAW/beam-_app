"use client"

import { useEffect, useState } from 'react'
import { useUserRole } from '@/hooks/useUserRole'

export default function DebugAuthPage() {
  const { role, loading, isAdmin } = useUserRole()
  const [apiResponse, setApiResponse] = useState(null)

  useEffect(() => {
    async function fetchRoleDebug() {
      try {
        const response = await fetch('/api/user/role')
        const data = await response.json()
        setApiResponse(data)
      } catch (error) {
        console.error('Error fetching role debug:', error)
      }
    }
    fetchRoleDebug()
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
          <h2 className="text-lg font-semibold mb-4">Cookies</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {typeof document !== 'undefined' ? document.cookie : 'SSR'}
          </pre>
        </div>
      </div>
    </div>
  )
}