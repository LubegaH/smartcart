'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ItemCard } from './item-card';
import { DeleteItemModal } from './delete-item-modal';
import type { TripItem, TripStatus } from '@/types';

interface ItemListProps {
  items: TripItem[];
  tripStatus: TripStatus;
  onUpdateItem: (itemId: string, updates: Partial<TripItem>) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  emptyStateAction?: React.ReactNode;
}

export function ItemList({
  items,
  tripStatus,
  onUpdateItem,
  onDeleteItem,
  emptyStateAction,
}: ItemListProps) {
  const [itemToDelete, setItemToDelete] = useState<TripItem | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const handleDeleteSuccess = async () => {
    if (itemToDelete) {
      try {
        await onDeleteItem(itemToDelete.id);
        setItemToDelete(null);
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  const handleDeleteClick = (item: TripItem) => {
    setItemToDelete(item);
  };

  const handleToggleComplete = async (item: TripItem) => {
    await onUpdateItem(item.id, { is_completed: !item.is_completed });
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<TripItem>) => {
    await onUpdateItem(itemId, updates);
    setEditingItemId(null);
  };

  if (items.length === 0) {
    return (
      <div className='p-8 text-center'>
        <div className='w-16 h-16 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 mx-auto mb-4'>
          <svg
            className='w-8 h-8'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
            />
          </svg>
        </div>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          No items in this trip
        </h3>
        <p className='text-sm text-gray-600 mb-6 leading-relaxed'>
          Add items to your shopping list to start tracking prices and planning your trip.
        </p>
        {emptyStateAction}
      </div>
    );
  }

  // Group items by completion status
  const completedItems = items.filter(item => item.is_completed);
  const pendingItems = items.filter(item => !item.is_completed);

  return (
    <div className='divide-y divide-gray-200'>
      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <div className='p-4'>
          {tripStatus === 'active' && (
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-sm font-medium text-gray-700'>
                Shopping List ({pendingItems.length} remaining)
              </h3>
              <span className='text-xs text-gray-500'>
                Tap items to mark as found
              </span>
            </div>
          )}
          <div className='space-y-3'>
            {pendingItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                tripStatus={tripStatus}
                isEditing={editingItemId === item.id}
                onToggleComplete={handleToggleComplete}
                onUpdateItem={handleUpdateItem}
                onStartEdit={() => setEditingItemId(item.id)}
                onCancelEdit={() => setEditingItemId(null)}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Items */}
      {completedItems.length > 0 && (
        <div className='p-4'>
          <h3 className='text-sm font-medium text-gray-700 mb-4'>
            Completed ({completedItems.length})
          </h3>
          <div className='space-y-3'>
            {completedItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                tripStatus={tripStatus}
                isEditing={editingItemId === item.id}
                onToggleComplete={handleToggleComplete}
                onUpdateItem={handleUpdateItem}
                onStartEdit={() => setEditingItemId(item.id)}
                onCancelEdit={() => setEditingItemId(null)}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <DeleteItemModal
          item={itemToDelete}
          isOpen={true}
          onClose={() => setItemToDelete(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}