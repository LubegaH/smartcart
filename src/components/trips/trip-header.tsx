'use client';

import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import type { ShoppingTrip } from '@/types';

interface TripHeaderProps {
  trip: ShoppingTrip;
  onEdit: () => void;
  onStartShopping: () => void;
  onBack: () => void;
  onContinueShopping?: () => void;
}

export function TripHeader({ trip, onEdit, onStartShopping, onBack, onContinueShopping }: TripHeaderProps) {
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

  const getCompletionStats = () => {
    if (!trip.items || trip.items.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    const completed = trip.items.filter(item => item.is_completed).length;
    const total = trip.items.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  const stats = getCompletionStats();

  return (
    <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
      {/* Header with Back Button */}
      <div className='flex items-center mb-4'>
        <Button
          variant='ghost'
          onClick={onBack}
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
        <div className='flex-1'>
          <h1 className='text-2xl font-bold text-gray-900'>{trip.name}</h1>
          <div className='flex items-center space-x-2 mt-1'>
            <p className='text-sm text-gray-600'>
              {trip.retailer?.name || 'Unknown retailer'}
            </p>
            <span className='text-gray-300'>•</span>
            <p className='text-sm text-gray-600'>
              {format(new Date(trip.date), 'EEEE, MMMM dd, yyyy')}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
            trip.status
          )}`}
        >
          {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
        </span>
      </div>

      {/* Trip Stats */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-500'>Items</p>
              <p className='text-xl font-semibold text-gray-900'>
                {stats.total}
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center'>
              <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' />
              </svg>
            </div>
          </div>
        </div>

        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-500'>Estimated Total</p>
              <p className='text-xl font-semibold text-gray-900'>
                {trip.estimated_total ? formatCurrency(trip.estimated_total) : 'Not set'}
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
              <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' />
              </svg>
            </div>
          </div>
        </div>

        {trip.status === 'completed' && trip.actual_total ? (
          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Actual Total</p>
                <p className='text-xl font-semibold text-gray-900'>
                  {formatCurrency(trip.actual_total)}
                </p>
                {trip.estimated_total && (
                  <p className={`text-xs font-medium ${
                    trip.actual_total > trip.estimated_total ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {trip.actual_total > trip.estimated_total ? '+' : ''}
                    {formatCurrency(trip.actual_total - trip.estimated_total)} vs. estimated
                  </p>
                )}
              </div>
              <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
                <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
            </div>
          </div>
        ) : (
          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Progress</p>
                <p className='text-xl font-semibold text-gray-900'>
                  {stats.percentage}%
                </p>
                <p className='text-xs text-gray-600'>
                  {stats.completed} of {stats.total} completed
                </p>
              </div>
              <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
                <svg className='w-5 h-5 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar (for active trips) */}
      {trip.status === 'active' && stats.total > 0 && (
        <div className='mb-6'>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-sm font-medium text-gray-700'>Shopping Progress</span>
            <span className='text-sm font-medium text-gray-900'>{stats.percentage}%</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-3'>
            <div
              className='bg-primary h-3 rounded-full transition-all duration-300'
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className='flex space-x-3'>
        {trip.status === 'planned' && (
          <>
            <Button
              onClick={onEdit}
              variant='outline'
              className='flex-1'
            >
              <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
              </svg>
              Edit Trip
            </Button>
            {stats.total > 0 && (
              <Button
                onClick={onStartShopping}
                className='flex-1 bg-primary hover:bg-emerald-600 text-white'
              >
                <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
                </svg>
                Start Shopping
              </Button>
            )}
          </>
        )}
        
        {trip.status === 'active' && (
          <Button
            onClick={onContinueShopping}
            className='flex-1 bg-primary hover:bg-emerald-600 text-white'
          >
            <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' />
            </svg>
            Continue Shopping
          </Button>
        )}
      </div>
    </div>
  );
}