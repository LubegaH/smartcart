'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { TripForm } from '@/components/trips/trip-form'
import { Button } from '@/components/ui/button'
import { dataService } from '@/lib/data'
import type { ShoppingTrip, CreateTripRequest } from '@/types'

export default function EditTripPage() {
  const router = useRouter()
  const params = useParams()
  const tripId = params.id as string

  const [trip, setTrip] = useState<ShoppingTrip | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTrip = async () => {
      try {
        setError(null)
        const result = await dataService.trips.getById(tripId)
        
        if (result.success) {
          setTrip(result.data)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError('Failed to load trip')
      } finally {
        setIsLoading(false)
      }
    }

    if (tripId) {
      loadTrip()
    }
  }, [tripId])

  const handleSubmit = async (data: CreateTripRequest) => {
    if (!trip) return

    try {
      setIsSubmitting(true)
      const result = await dataService.trips.update(trip.id, {
        name: data.name,
        date: data.date,
        retailer_id: data.retailer_id,
      })

      if (result.success) {
        // Navigate back to trip detail page
        router.push(`/trips/${trip.id}`)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to update trip')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-2xl mx-auto px-4 py-6'>
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-200 rounded w-1/3 mb-2'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2 mb-6'></div>
            <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
              <div className='space-y-4'>
                <div className='h-4 bg-gray-200 rounded w-1/4'></div>
                <div className='h-10 bg-gray-200 rounded'></div>
                <div className='h-4 bg-gray-200 rounded w-1/4'></div>
                <div className='h-10 bg-gray-200 rounded'></div>
                <div className='h-4 bg-gray-200 rounded w-1/4'></div>
                <div className='h-10 bg-gray-200 rounded'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-2xl mx-auto px-4 py-6'>
          <div className='bg-white border border-red-200 rounded-lg shadow-sm p-6 text-center'>
            <div className='w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4'>
              <svg className='w-6 h-6 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Unable to Load Trip</h3>
            <p className='text-sm text-gray-600 mb-4'>
              {error || 'The trip you are trying to edit does not exist or has been deleted.'}
            </p>
            <div className='flex gap-3 justify-center'>
              <Button onClick={() => router.push('/trips')} variant='outline'>
                Back to Trips
              </Button>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-2xl mx-auto px-4 py-6'>
        {/* Header */}
        <div className='mb-6'>
          <div className='flex items-center space-x-2 text-sm text-gray-500 mb-4'>
            <button
              onClick={() => router.push('/trips')}
              className='hover:text-gray-700 transition-colors duration-200'
            >
              Shopping Trips
            </button>
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
            <button
              onClick={() => router.push(`/trips/${trip.id}`)}
              className='hover:text-gray-700 transition-colors duration-200'
            >
              {trip.name}
            </button>
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
            <span className='text-gray-900 font-medium'>Edit</span>
          </div>
          
          <h1 className='text-2xl font-bold text-gray-900'>Edit Shopping Trip</h1>
          <p className='mt-1 text-sm text-gray-600'>
            Update your trip details and settings
          </p>
        </div>

        {/* Trip Form */}
        <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
          <TripForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSubmitting}
            initialData={{
              name: trip.name,
              date: trip.date,
              retailer_id: trip.retailer_id,
              estimated_total: trip.estimated_total,
            }}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className='mt-4 bg-white border border-red-200 rounded-lg shadow-sm p-4'>
            <div className='flex items-start'>
              <svg className='w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0' viewBox='0 0 20 20' fill='currentColor'>
                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
              </svg>
              <div className='flex-1'>
                <h3 className='text-sm font-medium text-red-800'>Update Failed</h3>
                <p className='text-sm text-red-700 mt-1'>{error}</p>
                <Button
                  variant='outline'
                  size='sm'
                  className='mt-3 border-red-300 text-red-700 hover:bg-red-50'
                  onClick={() => setError(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}