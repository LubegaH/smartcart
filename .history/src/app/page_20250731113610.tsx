'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const { user, isInitialized, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if user is authenticated
    if (isInitialized && user) {
      router.push('/dashboard');
    }
  }, [user, isInitialized, router]);

  // Show loading state while initializing auth
  if (!isInitialized || isLoading) {
    return (
      <main className='min-h-screen flex flex-col items-center justify-center p-6 bg-background'>
        <div className='max-w-md w-full text-center space-y-4'>
          <div className='text-5xl'>🛒</div>
          <h1 className='text-3xl font-bold text-gray-900'>SmartCart</h1>
          <p className='text-gray-600'>Loading...</p>
          <div className='animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto'></div>
        </div>
      </main>
    );
  }

  // Show welcome page if not authenticated
  return (
    <main className='min-h-screen flex flex-col items-center justify-center p-6 bg-background'>
      <div className='max-w-md w-full text-center space-y-8'>
        {/* SmartCart Logo/Header */}
        <div className='space-y-4'>
          <div className='text-5xl'>🛒</div>
          <h1 className='text-3xl font-bold text-gray-900'>SmartCart</h1>
          <p className='text-lg text-gray-600'>
            Intelligent grocery shopping with real-time price tracking
          </p>
        </div>

        {/* Action Buttons */}
        <div className='space-y-4'>
          <Link href='/auth/login'>
            <Button size='lg' className='w-full'>
              Sign In
            </Button>
          </Link>
          <Link href='/auth/register'>
            <Button variant='outline' size='lg' className='w-full'>
              Create Account
            </Button>
          </Link>
        </div>

        {/* Development Status */}
        <div className='text-sm text-gray-600'>
          <p>Phase 2: MVP Core Development</p>
          <p className='font-medium text-green-600'>
            ✅ Checkpoint 2.1 COMPLETE
          </p>
        </div>
      </div>
    </main>
  );
}
