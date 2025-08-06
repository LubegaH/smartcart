'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/auth'
import { registerSchema, type RegisterFormData } from '@/lib/validations'

const currencyOptions = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'UGX', label: 'Uganda Shillings (UGX)' }
]

export function RegisterForm() {
  const router = useRouter()
  const { register: registerUser, isLoading, error, clearError } = useAuthStore()
  const [showSuccess, setShowSuccess] = React.useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange'
  })

  // Clear any existing errors when component mounts
  React.useEffect(() => {
    clearError()
  }, [clearError])

  const onSubmit = async (data: RegisterFormData) => {
    const result = await registerUser(
      data.email, 
      data.password, 
      data.confirmPassword, 
      data.acceptTerms,
      data.preferredCurrency
    )
    
    if (result.success) {
      if (result.needsVerification) {
        setShowSuccess(true)
      } else {
        // User is logged in immediately, redirect to dashboard
        router.push('/dashboard')
      }
    }
  }

  const isFormLoading = isLoading || isSubmitting

  if (showSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full space-y-8">
          {/* SmartCart Logo */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Image
                src="/smartcart_logo.png"
                alt="SmartCart Logo"
                width={120}
                height={120}
                className="h-20 w-auto"
              />
            </div>
          </div>

          {/* Success Message */}
          <Alert variant="success">
            <AlertTitle>Check your email!</AlertTitle>
            <AlertDescription>
              We&apos;ve sent you a verification link. Please check your email and click the link to activate your account.
            </AlertDescription>
          </Alert>

          <div className="text-center">
            <Link 
              href="/auth/login"
              className="text-primary font-medium hover:text-primary/80 transition-colors"
            >
              Back to Sign In
            </Link>
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
          <div className="flex justify-center">
            <Image
              src="/smartcart_logo.png"
              alt="SmartCart Logo"
              width={120}
              height={120}
              className="h-20 w-auto"
            />
          </div>
        </div>

        {/* Registration Form */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Create your account</h2>
            <p className="text-sm text-gray-600 mt-2">Start saving on groceries</p>
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

            {/* Password Field */}
            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              error={errors.password?.message}
              disabled={isFormLoading}
              {...register('password')}
            />

            {/* Confirm Password Field */}
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              error={errors.confirmPassword?.message}
              disabled={isFormLoading}
              {...register('confirmPassword')}
            />

            {/* Currency Selection */}
            <Select
              label="Preferred Currency"
              options={currencyOptions}
              error={errors.preferredCurrency?.message}
              disabled={isFormLoading}
              {...register('preferredCurrency')}
            />

            {/* Terms Checkbox */}
            <Checkbox
              label="I agree to the Terms of Service"
              error={errors.acceptTerms?.message}
              disabled={isFormLoading}
              {...register('acceptTerms')}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isFormLoading}
            >
              {isFormLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              href="/auth/login"
              className="text-primary font-medium hover:text-primary/80 transition-colors"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}