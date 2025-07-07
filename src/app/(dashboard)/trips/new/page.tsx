'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TripForm } from '@/components/trips/trip-form';
import { dataService } from '@/lib/data';
import type { CreateTripRequest } from '@/types';

export default function NewTripPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (tripData: CreateTripRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await dataService.trips.create(tripData);

      if (result.success) {
        router.push(`/trips/${result.data.id}`);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to create trip');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/trips');
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-2xl mx-auto px-4 py-6'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center mb-4'>
            <Button
              variant='ghost'
              onClick={handleCancel}
              className='mr-4 hover:bg-gray-100'
            >
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M10 19l-7-7m0 0l7-7m-7 7h18'
                />
              </svg>
            </Button>
            <h1 className='text-2xl font-bold text-gray-900'>Create New Trip</h1>
          </div>
          <p className='text-sm text-gray-600'>
            Plan your shopping trip with items and estimated prices
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className='mb-6 bg-white border border-red-200 rounded-lg shadow-sm p-4'>
            <div className='flex items-start'>
              <svg
                className='w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
              <div className='flex-1'>
                <h3 className='text-sm font-medium text-red-800'>
                  Unable to create trip
                </h3>
                <p className='text-sm text-red-700 mt-1'>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Trip Form */}
        <TripForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}