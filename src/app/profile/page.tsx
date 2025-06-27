'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/auth'
import { offlineProfileService } from '@/lib/offline-profile'
import { useOnlineStatus } from '@/components/ui/offline-indicator'

const profileSchema = z.object({
  display_name: z.string().optional(),
  default_budget: z.number().optional(),
  notifications_enabled: z.boolean(),
  dark_mode: z.boolean(),
  default_currency: z.string().min(1, 'Currency is required')
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, updateProfile, isLoading, error, clearError } = useAuthStore()
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)
  const [showDeleteAccount, setShowDeleteAccount] = React.useState(false)
  const isOnline = useOnlineStatus()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile?.display_name || '',
      default_budget: profile?.default_budget || undefined,
      notifications_enabled: profile?.preferences?.notifications_enabled ?? true,
      dark_mode: profile?.preferences?.dark_mode ?? false,
      default_currency: profile?.preferences?.default_currency || 'USD'
    }
  })

  // Reset form when profile loads
  React.useEffect(() => {
    if (profile) {
      reset({
        display_name: profile.display_name || '',
        default_budget: profile.default_budget || undefined,
        notifications_enabled: profile.preferences?.notifications_enabled ?? true,
        dark_mode: profile.preferences?.dark_mode ?? false,
        default_currency: profile.preferences?.default_currency || 'USD'
      })
    }
  }, [profile, reset])

  // Clear any existing errors when component mounts
  React.useEffect(() => {
    clearError()
  }, [clearError])

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  const onSubmit = async (data: ProfileFormData) => {
    setSuccessMessage(null)
    
    const success = await updateProfile({
      display_name: data.display_name || undefined,
      default_budget: data.default_budget,
      preferences: {
        notifications_enabled: data.notifications_enabled,
        dark_mode: data.dark_mode,
        default_currency: data.default_currency
      }
    })
    
    if (success) {
      setSuccessMessage('Profile updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const handleExportData = async () => {
    try {
      const result = await offlineProfileService.exportUserData()
      if (result.success) {
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `smartcart-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        const message = isOnline ? 'Data exported successfully!' : 'Data exported from offline cache!'
        setSuccessMessage(message)
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch {
      // Silent fail for export in production
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const result = await offlineProfileService.deleteAccount()
      if (result.success) {
        // Redirect to home page after successful deletion
        router.push('/')
      }
    } catch (error) {
      console.error('Account deletion failed:', error)
    }
  }

  if (!user) {
    return null // Will redirect
  }

  const isFormLoading = isLoading || isSubmitting

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="text-4xl">👤</div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-sm text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <Alert variant="success">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Display Name */}
          <Input
            label="Display Name"
            placeholder="Enter your display name"
            error={errors.display_name?.message}
            disabled={isFormLoading}
            {...register('display_name')}
          />

          {/* Default Budget */}
          <Input
            label="Default Budget ($)"
            type="number"
            step="0.01"
            placeholder="Enter your default budget"
            error={errors.default_budget?.message}
            disabled={isFormLoading}
            {...register('default_budget')}
          />

          {/* Currency */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Currency</label>
            <select 
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isFormLoading}
              {...register('default_currency')}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD ($)</option>
            </select>
            {errors.default_currency && (
              <p className="text-red-600 text-sm">{errors.default_currency.message}</p>
            )}
          </div>

          {/* Notifications Toggle */}
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              disabled={isFormLoading}
              {...register('notifications_enabled')}
            />
            <span className="text-sm font-medium text-gray-700">Enable notifications</span>
          </label>

          {/* Dark Mode Toggle */}
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              disabled={isFormLoading}
              {...register('dark_mode')}
            />
            <span className="text-sm font-medium text-gray-700">Dark mode</span>
          </label>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isFormLoading}
          >
            {isFormLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>

        {/* Data Controls Section */}
        <div className="border-t pt-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Data & Privacy</h2>
          
          {/* Export Data */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleExportData}
          >
            Export My Data
          </Button>

          {/* Delete Account */}
          {!showDeleteAccount ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="w-full"
              onClick={() => setShowDeleteAccount(true)}
            >
              Delete Account
            </Button>
          ) : (
            <div className="space-y-3">
              <Alert variant="error">
                <AlertTitle>Warning: This action cannot be undone</AlertTitle>
                <AlertDescription>
                  Deleting your account will permanently remove all your data including trips, items, and price history.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteAccount(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleDeleteAccount}
                >
                  Confirm Delete
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="text-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}