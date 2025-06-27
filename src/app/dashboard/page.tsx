'use client'

import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuthStore()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  return (
    <main className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.email}!</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>

        {/* Status Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Authentication Complete! ✅
          </h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✅ User successfully authenticated</p>
            <p>✅ Session management working</p>
            <p>✅ Logout functionality ready</p>
            <p>⏳ Dashboard UI (Phase 2.2 next)</p>
            <p>⏳ Shopping trip management (Phase 2.4)</p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">User ID:</span> {user.id}</p>
            <p><span className="font-medium">Created:</span> {new Date(user.created_at).toLocaleDateString()}</p>
            <p><span className="font-medium">Email Confirmed:</span> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="text-center text-sm text-gray-600">
          <p>Phase 2: MVP Core Development</p>
          <p className="font-medium text-green-600">✅ Checkpoint 2.1 COMPLETE</p>
          <p className="mt-2">Ready for Checkpoint 2.2: Core Data Models & Database</p>
        </div>
      </div>
    </main>
  )
}