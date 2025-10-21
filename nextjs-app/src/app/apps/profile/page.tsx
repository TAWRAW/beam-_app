"use client"

import { useState, useEffect } from 'react'
import { User, Camera, Save, Loader2, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  role: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: ''
  })
  const router = useRouter()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      // ⚠️ BYPASS pour le développement et l'environnement dev
      // TODO: RETIRER CE BYPASS EN PRODUCTION
      const isDevEnvironment =
        process.env.NODE_ENV === 'development' ||
        (typeof window !== 'undefined' &&
          (window.location.hostname.includes('dev.beamo') ||
           window.location.hostname.includes('localhost')))

      if (isDevEnvironment) {
        console.log('🚧 DEV MODE: Bypassing auth check for profile page')
        const mockProfile = {
          id: 'dev-user',
          full_name: 'Utilisateur de développement',
          email: 'dev@beamo.fr',
          avatar_url: '',
          role: 'admin'
        }
        setProfile(mockProfile)
        setFormData({
          full_name: mockProfile.full_name,
          email: mockProfile.email
        })
        setLoading(false)
        return
      }

      // Récupérer l'utilisateur connecté
      const supabase = createSupabaseBrowserClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.log('❌ No user found, redirecting to login')
        router.push('/auth/login')
        return
      }

      // Récupérer le token d'accès
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log('❌ No session found, redirecting to login')
        router.push('/auth/login')
        return
      }

      // Récupérer le profil via API
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        console.error('Error loading profile:', response.statusText)
        return
      }

      const { profile: profileData } = await response.json()

      setProfile(profileData)
      setFormData({
        full_name: profileData.full_name || '',
        email: profileData.email || ''
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    setUploading(true)
    try {
      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${profile.id}-${Date.now()}.${fileExt}`

      // Upload vers Supabase Storage
      const supabase = createSupabaseBrowserClient()
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('image_article')
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Erreur lors de l\'upload de l\'image')
        return
      }

      // Construire l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('image_article')
        .getPublicUrl(fileName)

      // Récupérer le token d'accès
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Session expirée')
        return
      }

      // Mettre à jour le profil avec la nouvelle URL d'avatar via API
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: publicUrl
        })
      })

      if (!response.ok) {
        console.error('Update error:', response.statusText)
        alert('Erreur lors de la mise à jour du profil')
        return
      }

      // Mettre à jour l'état local
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
      alert('Avatar mis à jour avec succès !')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      // Récupérer le token d'accès
      const supabase = createSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('Session expirée')
        return
      }

      // Mettre à jour le profil via API
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email
        })
      })

      if (!response.ok) {
        console.error('Error updating profile:', response.statusText)
        alert('Erreur lors de la sauvegarde')
        return
      }

      setProfile(prev => prev ? {
        ...prev,
        full_name: formData.full_name,
        email: formData.email
      } : null)
      alert('Profil mis à jour avec succès !')
    } catch (error) {
      console.error('Error:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center">
        <p className="text-gray-600">Impossible de charger le profil</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Paramètres du profil</h1>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="h-10 w-10 text-gray-600" />
              </div>
            )}

            <label className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>

            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Photo de profil</h3>
            <p className="text-sm text-gray-600">
              Cliquez sur l'icône appareil photo pour changer votre avatar
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="space-y-6">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet
            </label>
            <input
              type="text"
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rôle
            </label>
            <input
              type="text"
              value={profile.role}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Le rôle ne peut pas être modifié</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Sauvegarder
            </button>
          </div>
        </div>
      </div>

      {/* Lien vers les réglages d'intégrations sociales */}
      {profile.role === 'admin' || profile.role === 'employe' ? (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-2">Intégrations sociales</h2>
          <p className="text-gray-600 mb-4">
            Connectez vos comptes sociaux et configurez la publication automatique de vos articles
          </p>
          <Link
            href="/apps/settings/integrations"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Gérer les intégrations
          </Link>
        </div>
      ) : null}
    </div>
  )
}