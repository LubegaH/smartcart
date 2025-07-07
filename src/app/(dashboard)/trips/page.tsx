'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TripList } from '@/components/trips/trip-list';
import { dataService } from '@/lib/data';
import type { ShoppingTrip } from '@/types';

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<ShoppingTrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = async () => {
    try {
      setError(null);
      const result = await dataService.trips.getAll();

      if (result.success) {
        setTrips(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load trips');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const handleEdit = (trip: ShoppingTrip) => {
    router.push(`/trips/${trip.id}/edit`);
  };

  const handleViewDetails = (trip: ShoppingTrip) => {
    router.push(`/trips/${trip.id}`);
  };

  const handleRefresh = () => {
    loadTrips();
  };

  if (isLoading) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-1/4 mb-2'></div>
          <div className='h-4 bg-gray-200 rounded w-1/2 mb-6'></div>
          <div className='space-y-3'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-24 bg-gray-200 rounded-lg'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto px-4 py-6'>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Shopping Trips</h1>
            <p className='mt-1 text-sm text-gray-600'>
              Plan and track your shopping trips
            </p>
          </div>
          <Button
            onClick={() => router.push('/trips/new')}
            className='bg-primary hover:bg-emerald-600 text-white shadow-sm hover:shadow-md transition-all duration-200'
          >
            <svg
              className='w-4 h-4 mr-2'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 6v6m0 0v6m0-6h6m-6 0H6'
              />
            </svg>
            Create Trip
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className='mb-4 bg-white border border-gray-200 rounded-lg shadow-sm p-4'>
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
                  Unable to load trips
                </h3>
                <p className='text-sm text-red-700 mt-1'>{error}</p>
                <Button
                  variant='outline'
                  size='sm'
                  className='mt-3 border-red-300 text-red-700 hover:bg-red-50'
                  onClick={handleRefresh}
                >
                  Try again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Trip List */}
        <TripList
          trips={trips}
          onEdit={handleEdit}
          onViewDetails={handleViewDetails}
          onRefresh={handleRefresh}
          emptyStateAction={
            <Button
              onClick={() => router.push('/trips/new')}
              className='bg-primary hover:bg-emerald-600 text-white shadow-sm hover:shadow-md transition-all duration-200'
            >
              <svg
                className='w-4 h-4 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                />
              </svg>
              Create your first trip
            </Button>
          }
        />
      </div>
    </div>
  );
}