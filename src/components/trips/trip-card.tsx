'use client';

import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import type { ShoppingTrip } from '@/types';

interface TripCardProps {
  trip: ShoppingTrip;
  onEdit: (trip: ShoppingTrip) => void;
  onViewDetails: (trip: ShoppingTrip) => void;
  onDelete: (trip: ShoppingTrip) => void;
}

export function TripCard({ trip, onEdit, onViewDetails, onDelete }: TripCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getItemCount = () => {
    if (!trip.items || trip.items.length === 0) return 'No items';
    return `${trip.items.length} item${trip.items.length === 1 ? '' : 's'}`;
  };

  const getCompletionPercentage = () => {
    if (!trip.items || trip.items.length === 0) return 0;
    const completedItems = trip.items.filter(item => item.is_completed).length;
    return Math.round((completedItems / trip.items.length) * 100);
  };

  return (
    <div className='bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow'>
      <div className='p-4'>
        {/* Header */}
        <div className='flex items-start justify-between mb-3'>
          <div className='flex-1 min-w-0'>
            <h3 className='text-lg font-semibold text-gray-900 truncate'>
              {trip.name}
            </h3>
            <div className='flex items-center space-x-2 mt-1'>
              <p className='text-sm text-gray-600'>
                {trip.retailer?.name || 'Unknown retailer'}
              </p>
              <span className='text-gray-300'>•</span>
              <p className='text-sm text-gray-600'>
                {format(new Date(trip.date), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              trip.status
            )}`}
          >
            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
          </span>
        </div>

        {/* Trip Details */}
        <div className='grid grid-cols-2 gap-4 mb-4'>
          <div>
            <p className='text-sm text-gray-500'>Items</p>
            <p className='text-sm font-medium text-gray-900'>{getItemCount()}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Estimated Total</p>
            <p className='text-sm font-medium text-gray-900'>
              {trip.estimated_total ? formatCurrency(trip.estimated_total) : 'Not set'}
            </p>
          </div>
        </div>

        {/* Progress Bar (for active/completed trips) */}
        {trip.status === 'active' && trip.items && trip.items.length > 0 && (
          <div className='mb-4'>
            <div className='flex justify-between items-center mb-1'>
              <span className='text-sm text-gray-600'>Shopping Progress</span>
              <span className='text-sm font-medium text-gray-900'>
                {getCompletionPercentage()}%
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-primary h-2 rounded-full transition-all duration-300'
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>
          </div>
        )}

        {/* Actual Total (for completed trips) */}
        {trip.status === 'completed' && trip.actual_total && (
          <div className='mb-4 p-3 bg-gray-50 rounded-lg'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>Final Total</span>
              <span className='text-sm font-semibold text-gray-900'>
                {formatCurrency(trip.actual_total)}
              </span>
            </div>
            {trip.estimated_total && (
              <div className='flex justify-between items-center mt-1'>
                <span className='text-xs text-gray-500'>vs. Estimated</span>
                <span
                  className={`text-xs font-medium ${
                    trip.actual_total > trip.estimated_total
                      ? 'text-red-600'
                      : trip.actual_total < trip.estimated_total
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`}
                >
                  {trip.actual_total > trip.estimated_total ? '+' : ''}
                  {formatCurrency(trip.actual_total - trip.estimated_total)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onViewDetails(trip)}
            className='flex-1'
          >
            View Details
          </Button>
          
          {trip.status === 'planned' && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => onEdit(trip)}
            >
              Edit
            </Button>
          )}
          
          {trip.status === 'planned' && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => onDelete(trip)}
              className='text-red-600 hover:text-red-700 hover:bg-red-50'
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}