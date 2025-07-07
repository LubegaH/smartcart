'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { dataService } from '@/lib/data';
import type { ShoppingTrip } from '@/types';

interface DeleteTripModalProps {
  trip: ShoppingTrip;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteTripModal({ trip, isOpen, onClose, onSuccess }: DeleteTripModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      const result = await dataService.trips.delete(trip.id);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to delete trip');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full'>
        <div className='p-6'>
          {/* Header */}
          <div className='flex items-center mb-4'>
            <div className='w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3'>
              <svg
                className='w-5 h-5 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>
            <h3 className='text-lg font-semibold text-gray-900'>Delete Trip</h3>
          </div>

          {/* Content */}
          <div className='mb-6'>
            <p className='text-sm text-gray-600 mb-4'>
              Are you sure you want to delete the trip <strong>&quot;{trip.name}&quot;</strong>?
            </p>
            
            {trip.items && trip.items.length > 0 && (
              <div className='bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4'>
                <div className='flex items-start'>
                  <svg
                    className='w-5 h-5 text-amber-400 mr-2 mt-0.5 flex-shrink-0'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                    />
                  </svg>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-amber-800'>
                      This trip contains {trip.items.length} item{trip.items.length === 1 ? '' : 's'}
                    </p>
                    <p className='text-sm text-amber-700 mt-1'>
                      All items and their price history will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className='text-sm text-gray-600'>
              This action cannot be undone. All trip data will be permanently deleted.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
              <div className='flex items-start'>
                <svg
                  className='w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-red-800'>
                    Failed to delete trip
                  </p>
                  <p className='text-sm text-red-700 mt-1'>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className='flex space-x-3'>
            <Button
              variant='outline'
              onClick={onClose}
              disabled={isDeleting}
              className='flex-1'
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className='flex-1 bg-red-600 hover:bg-red-700 text-white'
            >
              {isDeleting ? (
                <>
                  <svg
                    className='w-4 h-4 mr-2 animate-spin'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  Deleting...
                </>
              ) : (
                'Delete Trip'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}