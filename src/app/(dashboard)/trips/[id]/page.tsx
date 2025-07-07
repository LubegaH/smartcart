'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { TripHeader } from '@/components/trips/trip-header';
import { ItemList } from '@/components/trips/item-list';
import { AddItemForm } from '@/components/trips/add-item-form';
import { dataService } from '@/lib/data';
import type { ShoppingTrip, TripItem, CreateItemRequest } from '@/types';

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<ShoppingTrip | null>(null);
  const [items, setItems] = useState<TripItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadTripData = async () => {
    try {
      setError(null);
      
      // Load trip details and items in parallel
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
      } else {
        console.error('Failed to load items:', itemsResult.error);
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

  const handleAddItem = async (itemData: CreateItemRequest) => {
    try {
      const result = await dataService.tripItems.create(tripId, itemData);
      
      if (result.success) {
        setItems(prev => [...prev, result.data]);
        setShowAddForm(false);
        // Refresh trip totals
        loadTripData();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Failed to add item:', err);
      throw err;
    }
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<TripItem>) => {
    try {
      const result = await dataService.tripItems.update(itemId, updates);
      
      if (result.success) {
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        ));
        // Refresh trip totals if price changed
        if ('actual_price' in updates || 'quantity' in updates) {
          loadTripData();
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Failed to update item:', err);
      throw err;
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const result = await dataService.tripItems.delete(itemId);
      
      if (result.success) {
        setItems(prev => prev.filter(item => item.id !== itemId));
        // Refresh trip totals
        loadTripData();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
      throw err;
    }
  };

  const handleStartShopping = async () => {
    if (!trip) return;
    
    try {
      const result = await dataService.trips.updateStatus(trip.id, 'active');
      
      if (result.success) {
        setTrip(prev => prev ? { ...prev, status: 'active' } : null);
        router.push(`/trips/${trip.id}/shopping`);
      } else {
        console.error('Failed to start shopping:', result.error);
      }
    } catch (err) {
      console.error('Failed to start shopping:', err);
    }
  };

  if (isLoading) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-6'>
        <div className='animate-pulse'>
          <div className='h-8 bg-gray-200 rounded w-1/3 mb-2'></div>
          <div className='h-4 bg-gray-200 rounded w-1/2 mb-6'></div>
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-20 bg-gray-200 rounded-lg'></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className='max-w-4xl mx-auto px-4 py-6'>
        <div className='bg-white border border-red-200 rounded-lg shadow-sm p-6 text-center'>
          <div className='w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4'>
            <svg className='w-6 h-6 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Trip Not Found</h3>
          <p className='text-sm text-gray-600 mb-4'>
            {error || 'The trip you are looking for does not exist or has been deleted.'}
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
      <div className='max-w-4xl mx-auto px-4 py-6 space-y-6'>
        {/* Trip Header */}
        <TripHeader 
          trip={trip} 
          onEdit={() => router.push(`/trips/${trip.id}/edit`)}
          onStartShopping={handleStartShopping}
          onBack={() => router.push('/trips')}
          onContinueShopping={() => router.push(`/trips/${trip.id}/shopping`)}
        />

        {/* Items Section */}
        <div className='bg-white border border-gray-200 rounded-lg shadow-sm'>
          {/* Items Header */}
          <div className='p-4 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='text-lg font-semibold text-gray-900'>Shopping Items</h2>
                <p className='text-sm text-gray-600'>
                  {items.length === 0 
                    ? 'No items added yet' 
                    : `${items.length} item${items.length === 1 ? '' : 's'}`
                  }
                </p>
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                size='sm'
                className='bg-primary hover:bg-emerald-600 text-white'
              >
                <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
                </svg>
                Add Item
              </Button>
            </div>
          </div>

          {/* Add Item Form */}
          {showAddForm && (
            <div className='p-4 border-b border-gray-200 bg-gray-50'>
              <AddItemForm
                onSubmit={handleAddItem}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {/* Items List */}
          <ItemList
            items={items}
            tripStatus={trip.status}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            emptyStateAction={
              <Button
                onClick={() => setShowAddForm(true)}
                className='bg-primary hover:bg-emerald-600 text-white'
              >
                <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 6v6m0 0v6m0-6h6m-6 0H6' />
                </svg>
                Add your first item
              </Button>
            }
          />
        </div>
      </div>
    </div>
  );
}