'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/hooks/useCurrency';
import { dataService } from '@/lib/data';
import type { ShoppingTrip, TripItem } from '@/types';


export default function ShoppingModePage() {
  const { formatAmount } = useCurrency();
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<ShoppingTrip | null>(null);
  const [items, setItems] = useState<TripItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Haptic feedback helper (works on supported mobile browsers)
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate([50, 10, 50]);
          break;
      }
    }
  };


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
      const newCompletedState = !item.is_completed;
      
      // Haptic feedback: medium pulse for checking off, light for unchecking
      triggerHapticFeedback(newCompletedState ? 'medium' : 'light');
      
      // Note: Undo functionality removed for better shopping experience
      // Users prefer focused shopping without distracting notifications

      const result = await dataService.tripItems.update(item.id, { 
        is_completed: newCompletedState 
      });
      
      if (result.success) {
        setItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, is_completed: newCompletedState } : i
        ));
      }
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };

  const handleUpdatePrice = async (item: TripItem, actualPrice: number) => {
    try {
      // Haptic feedback for price updates
      triggerHapticFeedback('light');

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

  // Calculate running totals
  const calculateItemTotal = (item: TripItem) => {
    const price = item.actual_price || item.estimated_price || 0;
    return price * item.quantity;
  };

  const completedTotal = completedItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const estimatedTotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const totalItemsWithPrices = items.filter(item => item.actual_price || item.estimated_price).length;

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
      <div className='max-w-md mx-auto px-4 py-4 pb-nav space-y-4'>
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
              onClick={async () => {
                // Haptic feedback for trip completion (celebration!)
                triggerHapticFeedback('heavy');
                
                // Calculate actual total from completed items
                const actualTotal = items.reduce((sum, item) => {
                  const price = item.actual_price || item.estimated_price || 0;
                  return sum + (price * item.quantity);
                }, 0);
                
                // Complete the trip with actual total and return to trip details
                await dataService.trips.complete(trip.id, actualTotal);
                router.push(`/trips/${trip.id}`);
              }}
              className='bg-primary hover:bg-emerald-600 text-white'
            >
              Complete Trip
            </Button>
          </div>
        )}

      </div>

      {/* Sticky Running Total */}
      {items.length > 0 && totalItemsWithPrices > 0 && (
        <div className='fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40'>
          <div className='max-w-md mx-auto px-4 py-3'>
            <div className='flex items-center justify-between'>
              <div className='flex-1'>
                <div className='flex items-center space-x-2'>
                  <svg className='w-5 h-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' />
                  </svg>
                  <div>
                    <p className='text-sm font-medium text-gray-900'>Running Total</p>
                    <p className='text-xs text-gray-600'>
                      {completedItems.length > 0 && completedItems.length < items.length 
                        ? `${completedItems.length} of ${items.length} items` 
                        : `${items.length} items`}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className='text-right'>
                {completedItems.length > 0 && completedItems.length < items.length ? (
                  // Show both completed total and estimated remaining
                  <div>
                    <p className='text-lg font-bold text-gray-900'>
                      {formatAmount(completedTotal)}
                    </p>
                    <p className='text-xs text-gray-600'>
                      Est. total: {formatAmount(estimatedTotal)}
                    </p>
                  </div>
                ) : completedItems.length === items.length ? (
                  // All items completed - show final total
                  <div>
                    <p className='text-lg font-bold text-green-600'>
                      {formatAmount(completedTotal)}
                    </p>
                    <p className='text-xs text-green-600'>
                      Final total
                    </p>
                  </div>
                ) : (
                  // No items completed yet - show estimated total
                  <div>
                    <p className='text-lg font-bold text-gray-700'>
                      {formatAmount(estimatedTotal)}
                    </p>
                    <p className='text-xs text-gray-500'>
                      Estimated
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress indicator */}
            {completedItems.length > 0 && completedItems.length < items.length && (
              <div className='mt-2'>
                <div className='flex justify-between text-xs text-gray-500 mb-1'>
                  <span>Collected: {formatAmount(completedTotal)}</span>
                  <span>Remaining: {formatAmount(estimatedTotal - completedTotal)}</span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-1'>
                  <div
                    className='bg-primary h-1 rounded-full transition-all duration-300'
                    style={{ width: `${estimatedTotal > 0 ? (completedTotal / estimatedTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Shopping Item Component for Active Shopping Mode with Gesture Support
function ShoppingItem({ 
  item, 
  onToggleComplete, 
  onUpdatePrice 
}: {
  item: TripItem;
  onToggleComplete: (item: TripItem) => void;
  onUpdatePrice: (item: TripItem, price: number) => void;
}) {
  const { formatAmount, step, decimals } = useCurrency();
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(item.actual_price?.toString() || '');
  
  // Swipe gesture state
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  // Touch/swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const distance = currentX - startX;
    
    // Limit swipe distance and add resistance at extremes
    const maxDistance = 120;
    const constrainedDistance = Math.max(-maxDistance, Math.min(maxDistance, distance));
    setSwipeDistance(constrainedDistance);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const threshold = 60; // Distance needed to trigger action
    
    if (Math.abs(swipeDistance) > threshold) {
      if (swipeDistance > 0) {
        // Swipe right: toggle completion
        onToggleComplete(item);
      } else {
        // Swipe left: start price editing
        setIsEditingPrice(true);
        setPriceInput(item.actual_price?.toString() || item.estimated_price?.toString() || '');
      }
    }
    
    // Reset swipe state
    setSwipeDistance(0);
    setIsDragging(false);
  };

  const handleSavePrice = () => {
    const price = parseFloat(priceInput);
    if (!isNaN(price) && price >= 0) {
      onUpdatePrice(item, price);
      setIsEditingPrice(false);
    }
  };

  return (
    <div 
      className={`p-4 relative overflow-hidden transition-all duration-200 ${
        item.is_completed ? 'bg-gray-50' : 'bg-white'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        transform: `translateX(${swipeDistance}px)`,
        backgroundColor: swipeDistance > 60 
          ? '#dcfce7' // Green tint for right swipe (complete)
          : swipeDistance < -60 
            ? '#fef3c7' // Yellow tint for left swipe (edit price)
            : undefined
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe Action Indicators */}
      {isDragging && (
        <>
          {/* Right swipe indicator (complete) */}
          {swipeDistance > 30 && (
            <div className='absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center text-green-600'>
              <svg className='w-6 h-6 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
              <span className='text-sm font-medium'>
                {item.is_completed ? 'Uncheck' : 'Complete'}
              </span>
            </div>
          )}
          
          {/* Left swipe indicator (edit price) */}
          {swipeDistance < -30 && (
            <div className='absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center text-yellow-600'>
              <span className='text-sm font-medium mr-2'>Edit Price</span>
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' />
              </svg>
            </div>
          )}
        </>
      )}
      
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
                    step={step}
                    min='0'
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePrice();
                      if (e.key === 'Escape') setIsEditingPrice(false);
                    }}
                    className='w-20 px-2 py-1 text-sm border border-gray-300 rounded'
                    placeholder={decimals ? '0.00' : '0'}
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
                      {formatAmount(item.actual_price)}
                    </span>
                  ) : item.estimated_price ? (
                    <span className='text-sm text-gray-600'>
                      Est: {formatAmount(item.estimated_price)}
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