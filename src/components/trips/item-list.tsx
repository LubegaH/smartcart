'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ItemCard } from './item-card';
import { DeleteItemModal } from './delete-item-modal';
import { BulkActions } from './bulk-actions';
import type { TripItem, TripStatus, PriceSuggestion } from '@/types';

interface FormattedSuggestion {
  suggestion: PriceSuggestion
  displayText: string
  formattedPrice: string
}

interface ItemListProps {
  items: TripItem[];
  tripStatus: TripStatus;
  priceHints?: Record<string, FormattedSuggestion | null>; // Pre-fetched price hints by item name
  onUpdateItem: (itemId: string, updates: Partial<TripItem>) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onBulkDeleteItems?: (itemIds: string[]) => Promise<void>;
  emptyStateAction?: React.ReactNode;
}

export function ItemList({
  items,
  tripStatus,
  priceHints,
  onUpdateItem,
  onDeleteItem,
  onBulkDeleteItems,
  emptyStateAction,
}: ItemListProps) {
  const [itemToDelete, setItemToDelete] = useState<TripItem | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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

  const handleToggleSelection = (item: TripItem) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item.id)) {
        newSet.delete(item.id);
      } else {
        newSet.add(item.id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  const handleBulkDelete = async (itemIds: string[]) => {
    if (onBulkDeleteItems) {
      await onBulkDeleteItems(itemIds);
    } else {
      // Fallback to individual deletes
      for (const itemId of itemIds) {
        await onDeleteItem(itemId);
      }
    }
  };

  const handleBulkUpdateQuantity = async (itemIds: string[], quantity: number) => {
    for (const itemId of itemIds) {
      await onUpdateItem(itemId, { quantity });
    }
  };

  const selectedItemsArray = items.filter(item => selectedItems.has(item.id));

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
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='text-sm font-medium text-gray-700'>
                {tripStatus === 'active' 
                  ? `Shopping List (${pendingItems.length} remaining)`
                  : `Items (${pendingItems.length})`
                }
              </h3>
              {tripStatus === 'active' && (
                <span className='text-xs text-gray-500'>
                  Tap items to mark as found
                </span>
              )}
            </div>
            
            {/* Bulk Actions Toggle */}
            {tripStatus === 'planned' && pendingItems.length > 1 && (
              <div className='flex items-center space-x-2'>
                {isSelectionMode && (
                  <Button
                    onClick={handleSelectAll}
                    variant='outline'
                    size='sm'
                    className='text-xs'
                  >
                    {selectedItems.size === pendingItems.length ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (isSelectionMode) {
                      handleClearSelection();
                    } else {
                      setIsSelectionMode(true);
                    }
                  }}
                  variant={isSelectionMode ? 'default' : 'outline'}
                  size='sm'
                  className={`text-xs ${
                    isSelectionMode ? 'bg-primary hover:bg-emerald-600 text-white' : ''
                  }`}
                >
                  {isSelectionMode ? 'Done' : 'Select Multiple'}
                </Button>
              </div>
            )}
          </div>
          <div className='space-y-3'>
            {pendingItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                tripStatus={tripStatus}
                isEditing={editingItemId === item.id}
                priceHint={priceHints?.[item.item_name.toLowerCase().trim()]}
                onToggleComplete={handleToggleComplete}
                onUpdateItem={handleUpdateItem}
                onStartEdit={() => setEditingItemId(item.id)}
                onCancelEdit={() => setEditingItemId(null)}
                onDelete={handleDeleteClick}
                isSelectable={isSelectionMode}
                isSelected={selectedItems.has(item.id)}
                onToggleSelection={handleToggleSelection}
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
                priceHint={priceHints?.[item.item_name.toLowerCase().trim()]}
                onToggleComplete={handleToggleComplete}
                onUpdateItem={handleUpdateItem}
                onStartEdit={() => setEditingItemId(item.id)}
                onCancelEdit={() => setEditingItemId(null)}
                onDelete={handleDeleteClick}
                isSelectable={isSelectionMode}
                isSelected={selectedItems.has(item.id)}
                onToggleSelection={handleToggleSelection}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {isSelectionMode && (
        <BulkActions
          selectedItems={selectedItemsArray}
          onBulkDelete={handleBulkDelete}
          onBulkUpdateQuantity={handleBulkUpdateQuantity}
          onClearSelection={handleClearSelection}
        />
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