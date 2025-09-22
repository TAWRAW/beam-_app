"use client"

import { useState, useEffect } from 'react'

export type UserRole = 'visiteur' | 'inscrit' | 'payant' | 'employe' | 'admin' | 'vip'

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const response = await fetch('/api/user/role')
        if (response.ok) {
          const data = await response.json()
          setRole(data.role)
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [])

  const isAdmin = role === 'admin' || role === 'employe'

  return { role, loading, isAdmin }
}