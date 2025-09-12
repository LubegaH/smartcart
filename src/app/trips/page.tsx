'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiPlus } from 'react-icons/hi2';
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
      <div className='max-w-4xl mx-auto px-4 py-6 pb-nav'>
        {/* Navigation */}
        <nav className='flex items-center space-x-2 text-sm text-gray-500 mb-4'>
          <button
            onClick={() => router.push('/dashboard')}
            className='hover:text-gray-700 transition-colors duration-200'
          >
            Dashboard
          </button>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
          </svg>
          <span className='text-gray-900 font-medium'>Shopping Trips</span>
        </nav>

        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
          <div className='flex-1'>
            <h1 className='text-2xl font-bold text-gray-900'>Shopping Trips</h1>
            <p className='mt-1 text-sm text-gray-600'>
              Plan and track your shopping trips
            </p>
          </div>
          <div className='flex-shrink-0'>
            <Button
              onClick={() => router.push('/trips/new')}
              size='sm'
              className='w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md transition-all duration-200 focus-ring-primary'
              aria-label='Create new shopping trip'
            >
              <HiPlus className='w-4 h-4 mr-2 flex-shrink-0' aria-hidden='true' />
              <span className='font-medium'>Create Trip</span>
            </Button>
          </div>
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
              size='md'
              className='bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md transition-all duration-200 focus-ring-primary'
              aria-label='Create your first shopping trip'
            >
              <HiPlus className='w-5 h-5 mr-2 flex-shrink-0' aria-hidden='true' />
              <span className='font-medium'>Create your first trip</span>
            </Button>
          }
        />
      </div>
    </div>
  );
}