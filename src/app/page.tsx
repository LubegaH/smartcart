'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

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
          <div className='mb-6 flex justify-center'>
            <Image
              src='/smartcart_icon.svg'
              alt='SmartCart'
              width={80}
              height={80}
              className='w-20 h-20'
            />
          </div>
          <h1 className='text-3xl font-bold text-gray-900'>SmartCart</h1>
          <p className='text-gray-600'>Loading...</p>
          <div className='animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto'></div>
        </div>
      </main>
    );
  }

  // Show welcome page if not authenticated
  return (
    <main className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      <div className='container mx-auto px-4 py-12'>
        <div className='max-w-4xl mx-auto'>
          {/* Hero Section */}
          <div className='text-center mb-16'>
            <div className='mb-8'>
              <div className='mb-8 flex justify-center'>
                <Image
                  src='/smartcart_logo.png'
                  alt='SmartCart'
                  width={300}
                  height={120}
                  className='h-24 w-auto'
                  priority
                />
              </div>
              <p className='text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed'>
                Intelligent grocery shopping with real-time price tracking
              </p>
              <p className='text-lg text-gray-500 max-w-2xl mx-auto'>
                Save money, reduce waste, and shop smarter with our comprehensive grocery management platform
              </p>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row gap-4 justify-center mb-12'>
              <Link href='/auth/register'>
                <Button size='lg' className='w-full sm:w-auto px-8 py-3 text-lg'>
                  Get Started Free
                </Button>
              </Link>
              <Link href='/auth/login'>
                <Button variant='outline' size='lg' className='w-full sm:w-auto px-8 py-3 text-lg'>
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className='grid md:grid-cols-3 gap-8 mb-16'>
            <div className='text-center p-6 bg-white rounded-lg shadow-soft'>
              <div className='w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center'>
                <svg className='w-6 h-6 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-3'>Price Tracking</h3>
              <p className='text-gray-600'>
                Monitor prices across different retailers and get alerts when items go on sale
              </p>
            </div>
            
            <div className='text-center p-6 bg-white rounded-lg shadow-soft'>
              <div className='w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center'>
                <svg className='w-6 h-6 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-6m0 0V3a2 2 0 012-2h4a2 2 0 012 2v2M7 7h10m-5 3v6m-2-3h4' />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-3'>Smart Lists</h3>
              <p className='text-gray-600'>
                Create intelligent shopping lists that help you stay organized and within budget
              </p>
            </div>
            
            <div className='text-center p-6 bg-white rounded-lg shadow-soft'>
              <div className='w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-lg flex items-center justify-center'>
                <svg className='w-6 h-6 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-3'>Budget Management</h3>
              <p className='text-gray-600'>
                Set budgets, track spending, and get insights to optimize your grocery expenses
              </p>
            </div>
          </div>


          {/* Call to Action */}
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              Ready to transform your grocery shopping?
            </h2>
            <p className='text-gray-600 mb-6'>
              Join thousands of smart shoppers who are saving money and time with SmartCart
            </p>
            <Link href='/auth/register'>
              <Button size='lg' className='px-8 py-3 text-lg'>
                Start Shopping Smarter Today
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
