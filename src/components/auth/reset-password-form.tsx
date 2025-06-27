'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/auth'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations'

export function ResetPasswordForm() {
  const { resetPassword, isLoading, error, clearError } = useAuthStore()
  const [showSuccess, setShowSuccess] = React.useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  })

  // Clear any existing errors when component mounts
  React.useEffect(() => {
    clearError()
  }, [clearError])

  const onSubmit = async (data: ResetPasswordFormData) => {
    const success = await resetPassword(data.email)
    
    if (success) {
      setShowSuccess(true)
    }
  }

  const isFormLoading = isLoading || isSubmitting

  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full space-y-8">
          {/* SmartCart Logo */}
          <div className="text-center space-y-4">
            <div className="text-5xl">🛒</div>
            <h1 className="text-2xl font-bold text-gray-900">SmartCart</h1>
          </div>

          {/* Success Message */}
          <Alert variant="success">
            <AlertTitle>Check your email!</AlertTitle>
            <AlertDescription>
              We&apos;ve sent you a password reset link. Please check your email and click the link to reset your password.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Didn&apos;t receive the email? Check your spam folder or try again.
            </p>
            <div className="space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setShowSuccess(false)}
              >
                Try Again
              </Button>
              <Link href="/auth/login">
                <Button variant="ghost">Back to Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full space-y-8">
        {/* SmartCart Logo */}
        <div className="text-center space-y-4">
          <div className="text-5xl">🛒</div>
          <h1 className="text-2xl font-bold text-gray-900">SmartCart</h1>
        </div>

        {/* Reset Password Form */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Reset your password</h2>
            <p className="text-sm text-gray-600 mt-2">
              Enter your email address and we&apos;ll send you a link to reset your password
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              error={errors.email?.message}
              disabled={isFormLoading}
              {...register('email')}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isFormLoading}
            >
              {isFormLoading ? 'Sending reset link...' : 'Send Reset Link'}
            </Button>
          </form>

          {/* Back to Login Link */}
          <div className="text-center">
            <Link 
              href="/auth/login"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}