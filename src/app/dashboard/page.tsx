'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'

export default function DashboardPage() {
  const router = useRouter()
  const { user, profile, logout, isLoading } = useAuthStore()

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl">🛒</div>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="text-5xl">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900">SmartCart Dashboard</h1>
          <p className="text-sm text-gray-600">
            Welcome back, {profile?.display_name || user.email}!
          </p>
        </div>

        {/* Profile Summary */}
        <div className="bg-white rounded-lg border p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">Profile Info</h2>
          <p className="text-sm text-gray-600">Email: {user.email}</p>
          {profile?.display_name && (
            <p className="text-sm text-gray-600">Name: {profile.display_name}</p>
          )}
          {profile?.default_budget && (
            <p className="text-sm text-gray-600">
              Default Budget: {profile.preferences?.default_currency || 'USD'} {profile.default_budget}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push('/profile')}
          >
            Manage Profile
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled
          >
            Create Shopping Trip
            <span className="text-xs ml-2">(Coming Soon)</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled
          >
            View Price History
            <span className="text-xs ml-2">(Coming Soon)</span>
          </Button>
        </div>

        {/* Account Actions */}
        <div className="border-t pt-6 space-y-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}