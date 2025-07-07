'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { dataService } from '@/lib/data';
import type { ShoppingTrip, TripItem } from '@/types';

export default function ShoppingModePage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<ShoppingTrip | null>(null);
  const [items, setItems] = useState<TripItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTripData = async () => {
    try {
      setError(null);
      
      const [tripResult, itemsResult] = await Promise.all([
        dataService.trips.getById(tripId),
        dataService.tripItems.getByTripId(tripId),
      ]);

      if (tripResult.success) {
        setTrip(tripResult.data);
      } else {
        setError(tripResult.error);
        return;
      }

      if (itemsResult.success) {
        setItems(itemsResult.data);
      }
    } catch (err) {
      setError('Failed to load trip data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      loadTripData();
    }
  }, [tripId]);

  const handleToggleComplete = async (item: TripItem) => {
    try {
      const result = await dataService.tripItems.update(item.id, { 
        is_completed: !item.is_completed 
      });
      
      if (result.success) {
        setItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, is_completed: !i.is_completed } : i
        ));
      }
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };

  const handleUpdatePrice = async (item: TripItem, actualPrice: number) => {
    try {
      const result = await dataService.tripItems.update(item.id, { 
        actual_price: actualPrice 
      });
      
      if (result.success) {
        setItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, actual_price: actualPrice } : i
        ));
      }
    } catch (err) {
      console.error('Failed to update price:', err);
    }
  };

  const completedItems = items.filter(item => item.is_completed);
  const pendingItems = items.filter(item => !item.is_completed);
  const progress = items.length > 0 ? Math.round((completedItems.length / items.length) * 100) : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading shopping mode...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <div className='bg-white border border-red-200 rounded-lg shadow-sm p-6 text-center max-w-md'>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Shopping Mode Error</h3>
          <p className='text-sm text-gray-600 mb-4'>
            {error || 'Unable to load shopping trip'}
          </p>
          <Button onClick={() => router.push('/trips')} variant='outline'>
            Back to Trips
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 sticky top-0 z-10'>
        <div className='max-w-md mx-auto px-4 py-4'>
          <div className='flex items-center justify-between mb-3'>
            <Button
              variant='ghost'
              onClick={() => router.push(`/trips/${trip.id}`)}
              className='p-2'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
              </svg>
            </Button>
            <h1 className='text-lg font-semibold text-gray-900'>Active Shopping</h1>
            <span className='bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium'>
              {progress}%
            </span>
          </div>
          
          <div className='text-center'>
            <h2 className='font-medium text-gray-900'>{trip.name}</h2>
            <p className='text-sm text-gray-600'>{trip.retailer?.name}</p>
          </div>
          
          {/* Progress Bar */}
          <div className='mt-3'>
            <div className='flex justify-between text-sm text-gray-600 mb-1'>
              <span>{completedItems.length} of {items.length} items</span>
              <span>{progress}% complete</span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-primary h-2 rounded-full transition-all duration-300'
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shopping List */}
      <div className='max-w-md mx-auto px-4 py-4 space-y-4'>
        {/* Pending Items */}
        {pendingItems.length > 0 && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
            <div className='p-4 border-b border-gray-200'>
              <h3 className='font-medium text-gray-900'>
                Shopping List ({pendingItems.length} remaining)
              </h3>
            </div>
            <div className='divide-y divide-gray-200'>
              {pendingItems.map((item) => (
                <ShoppingItem
                  key={item.id}
                  item={item}
                  onToggleComplete={handleToggleComplete}
                  onUpdatePrice={handleUpdatePrice}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
            <div className='p-4 border-b border-gray-200'>
              <h3 className='font-medium text-gray-500'>
                Completed ({completedItems.length})
              </h3>
            </div>
            <div className='divide-y divide-gray-200'>
              {completedItems.map((item) => (
                <ShoppingItem
                  key={item.id}
                  item={item}
                  onToggleComplete={handleToggleComplete}
                  onUpdatePrice={handleUpdatePrice}
                />
              ))}
            </div>
          </div>
        )}

        {/* Complete Shopping Button */}
        {pendingItems.length === 0 && items.length > 0 && (
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center'>
            <div className='w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3'>
              <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Shopping Complete!</h3>
            <p className='text-sm text-gray-600 mb-4'>
              All items have been collected. Ready to checkout?
            </p>
            <Button
              onClick={() => {
                // Complete the trip and return to trip details
                dataService.trips.updateStatus(trip.id, 'completed');
                router.push(`/trips/${trip.id}`);
              }}
              className='bg-primary hover:bg-emerald-600 text-white'
            >
              Complete Trip
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Shopping Item Component for Active Shopping Mode
function ShoppingItem({ 
  item, 
  onToggleComplete, 
  onUpdatePrice 
}: {
  item: TripItem;
  onToggleComplete: (item: TripItem) => void;
  onUpdatePrice: (item: TripItem, price: number) => void;
}) {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(item.actual_price?.toString() || '');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSavePrice = () => {
    const price = parseFloat(priceInput);
    if (!isNaN(price) && price >= 0) {
      onUpdatePrice(item, price);
      setIsEditingPrice(false);
    }
  };

  return (
    <div className={`p-4 ${item.is_completed ? 'bg-gray-50' : 'bg-white'}`}>
      <div className='flex items-center space-x-3'>
        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(item)}
          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
            item.is_completed
              ? 'bg-primary border-primary text-white'
              : 'border-gray-300 hover:border-primary'
          }`}
        >
          {item.is_completed && (
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                clipRule='evenodd'
              />
            </svg>
          )}
        </button>

        {/* Item Info */}
        <div className='flex-1 min-w-0'>
          <h4 className={`font-medium ${item.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {item.item_name}
          </h4>
          <div className='flex items-center justify-between mt-1'>
            <span className='text-sm text-gray-600'>Qty: {item.quantity}</span>
            
            {/* Price Display/Edit */}
            <div className='flex items-center space-x-2'>
              {isEditingPrice ? (
                <div className='flex items-center space-x-2'>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePrice();
                      if (e.key === 'Escape') setIsEditingPrice(false);
                    }}
                    className='w-20 px-2 py-1 text-sm border border-gray-300 rounded'
                    placeholder='0.00'
                    autoFocus
                  />
                  <Button size='sm' onClick={handleSavePrice} className='h-6 px-2 text-xs'>
                    Save
                  </Button>
                </div>
              ) : (
                <div className='flex items-center space-x-2'>
                  {item.actual_price ? (
                    <span className='text-sm font-medium text-gray-900'>
                      {formatCurrency(item.actual_price)}
                    </span>
                  ) : item.estimated_price ? (
                    <span className='text-sm text-gray-600'>
                      Est: {formatCurrency(item.estimated_price)}
                    </span>
                  ) : (
                    <span className='text-sm text-gray-400'>No price</span>
                  )}
                  
                  {!item.is_completed && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => {
                        setPriceInput(item.actual_price?.toString() || item.estimated_price?.toString() || '');
                        setIsEditingPrice(true);
                      }}
                      className='h-6 px-2 text-xs'
                    >
                      {item.actual_price ? 'Edit' : 'Set Price'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}