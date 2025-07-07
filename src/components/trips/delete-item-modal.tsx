'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { TripItem } from '@/types';

interface DeleteItemModalProps {
  item: TripItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function DeleteItemModal({ item, isOpen, onClose, onSuccess }: DeleteItemModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
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
                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                />
              </svg>
            </div>
            <h3 className='text-lg font-semibold text-gray-900'>Delete Item</h3>
          </div>

          {/* Content */}
          <div className='mb-6'>
            <p className='text-sm text-gray-600 mb-4'>
              Are you sure you want to remove <strong>&quot;{item.item_name}&quot;</strong> from this trip?
            </p>
            
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-3'>
              <div className='flex justify-between items-center text-sm'>
                <span className='text-gray-600'>Quantity:</span>
                <span className='font-medium text-gray-900'>{item.quantity}</span>
              </div>
              {(item.actual_price || item.estimated_price) && (
                <div className='flex justify-between items-center text-sm mt-1'>
                  <span className='text-gray-600'>
                    {item.actual_price ? 'Actual Price:' : 'Estimated Price:'}
                  </span>
                  <span className='font-medium text-gray-900'>
                    ${(item.actual_price || item.estimated_price)?.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <p className='text-sm text-gray-600 mt-4'>
              This action cannot be undone.
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
                    Failed to delete item
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
                'Delete Item'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}