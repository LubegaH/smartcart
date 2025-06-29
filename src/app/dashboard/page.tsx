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
            onClick={() => router.push('/retailers')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v7.5" />
            </svg>
            Manage Retailers
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => router.push('/profile')}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Manage Profile
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Create Shopping Trip
            <span className="text-xs ml-2">(Coming Soon)</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
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