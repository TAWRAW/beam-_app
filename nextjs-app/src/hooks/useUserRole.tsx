"use client"

import { useState, useEffect } from 'react'

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserRole()
  }, [])

  const checkUserRole = async () => {
    try {
      // Use the API endpoint that already works
      const response = await fetch('/api/user/role')

      if (!response.ok) {
        throw new Error('Failed to fetch user role')
      }

      const data = await response.json()
      const userRole = data.role

      setRole(userRole)
      setIsAdmin(userRole === 'admin' || userRole === 'employe')
    } catch (error) {
      console.error('Error checking user role:', error)
      setRole(null)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  return { role, isAdmin, loading }
}