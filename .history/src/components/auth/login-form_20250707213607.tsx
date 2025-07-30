'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/auth';
import { loginSchema, type LoginFormData } from '@/lib/validations';

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Clear any existing errors when component mounts
  React.useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: LoginFormData) => {
    const success = await login(data.email, data.password);

    if (success) {
      // Redirect to dashboard after successful login
      router.push('/dashboard');
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <>
      <div className='mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg'>
        <div className='text-responsive-sm text-primary font-medium'>
          Responsive Test (remove this after testing)
        </div>
        <div className='mt-2 space-y-2'>
          <div className='h-12 bg-primary/20 rounded touch-target-large'></div>
          <div className='text-xs text-muted-foreground'>
            Mobile: 16px padding | Tablet: 24px | Desktop: 32px
          </div>
        </div>
      </div>
      <div className='min-h-screen flex flex-col items-center justify-center p-6 bg-background'>
        <div className='max-w-md w-full space-y-8'>
          {/* SmartCart Logo */}
          <div className='text-center space-y-4'>
            <div className='text-5xl'>🛒</div>
            <h1 className='text-2xl font-bold text-gray-900'>SmartCart</h1>
          </div>

          {/* Login Form */}
          <div className='space-y-6'>
            <div className='text-center'>
              <h2 className='text-xl font-semibold text-gray-900'>
                Welcome back!
              </h2>
              <p className='text-sm text-gray-600 mt-2'>
                Sign in to your account
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant='error'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              {/* Email Field */}
              <Input
                label='Email Address'
                type='email'
                placeholder='Enter your email'
                error={errors.email?.message}
                disabled={isFormLoading}
                {...register('email')}
              />

              {/* Password Field */}
              <Input
                label='Password'
                type='password'
                placeholder='Enter your password'
                error={errors.password?.message}
                disabled={isFormLoading}
                {...register('password')}
              />

              {/* Forgot Password Link */}
              <div className='text-right'>
                <Link
                  href='/auth/reset-password'
                  className='text-sm text-primary hover:text-primary/80 transition-colors'
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type='submit'
                size='lg'
                className='w-full'
                disabled={isFormLoading}
              >
                {isFormLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className='text-center text-sm text-gray-600'>
              Don&apos;t have an account?{' '}
              <Link
                href='/auth/register'
                className='text-primary font-medium hover:text-primary/80 transition-colors'
              >
                Sign up here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
