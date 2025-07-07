'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TripItem, TripStatus } from '@/types';

interface ItemCardProps {
  item: TripItem;
  tripStatus: TripStatus;
  isEditing: boolean;
  onToggleComplete: (item: TripItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<TripItem>) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (item: TripItem) => void;
}

export function ItemCard({
  item,
  tripStatus,
  isEditing,
  onToggleComplete,
  onUpdateItem,
  onStartEdit,
  onCancelEdit,
  onDelete,
}: ItemCardProps) {
  const [editPrice, setEditPrice] = useState(item.actual_price?.toString() || item.estimated_price?.toString() || '');
  const [editQuantity, setEditQuantity] = useState(item.quantity.toString());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSave = () => {
    const price = parseFloat(editPrice);
    const quantity = parseFloat(editQuantity);
    
    // Validate inputs
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }
    
    if (editPrice && (isNaN(price) || price < 0)) {
      alert('Please enter a valid price (0 or greater)');
      return;
    }
    
    // Update both quantity and price if changed
    const updates: Partial<TripItem> = {};
    
    if (quantity !== item.quantity) {
      updates.quantity = quantity;
    }
    
    if (editPrice && price !== (item.actual_price || item.estimated_price)) {
      if (item.actual_price !== undefined) {
        updates.actual_price = price;
      } else {
        updates.estimated_price = price;
      }
    }
    
    // Only update if there are changes
    if (Object.keys(updates).length > 0) {
      onUpdateItem(item.id, updates);
    }
    
    onCancelEdit();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const handleBlur = () => {
    // Auto-save on blur (when user clicks outside)
    handleSave();
  };

  const getItemTotal = () => {
    const price = item.actual_price || item.estimated_price || 0;
    return price * item.quantity;
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        item.is_completed
          ? 'bg-gray-50 border-gray-200'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className='flex items-start space-x-3'>
        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(item)}
          className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            item.is_completed
              ? 'bg-primary border-primary text-white'
              : 'border-gray-300 hover:border-primary'
          }`}
        >
          {item.is_completed && (
            <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                clipRule='evenodd'
              />
            </svg>
          )}
        </button>

        {/* Item Content */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between'>
            <div className='flex-1 min-w-0'>
              <h4
                className={`font-medium text-gray-900 ${
                  item.is_completed ? 'line-through text-gray-500' : ''
                }`}
              >
                {item.item_name}
              </h4>
              
              {/* Quantity and Price Display/Edit */}
              <div className='mt-2 space-y-2'>
                {isEditing ? (
                  <div className='grid grid-cols-2 gap-2'>
                    <div>
                      <label className='block text-xs text-gray-500 mb-1'>Quantity</label>
                      <Input
                        type='number'
                        step='0.1'
                        min='0.1'
                        value={editQuantity}
                        onChange={(e) => setEditQuantity(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={handleBlur}
                        className='text-sm h-8'
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className='block text-xs text-gray-500 mb-1'>
                        {item.actual_price ? 'Actual Price' : 'Price'}
                      </label>
                      <Input
                        type='number'
                        step='0.01'
                        min='0'
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={handleBlur}
                        className='text-sm h-8'
                        placeholder='0.00'
                      />
                    </div>
                  </div>
                ) : (
                  <div className='flex items-center justify-between text-sm'>
                    <div className='flex items-center space-x-3'>
                      <span className='text-gray-600'>
                        Qty: {item.quantity}
                      </span>
                      {item.actual_price ? (
                        <span className='text-gray-900 font-medium'>
                          {formatCurrency(item.actual_price)} each
                        </span>
                      ) : item.estimated_price ? (
                        <span className='text-gray-600'>
                          Est: {formatCurrency(item.estimated_price)} each
                        </span>
                      ) : (
                        <span className='text-gray-400'>No price set</span>
                      )}
                    </div>
                    
                    {/* Item Total */}
                    {(item.actual_price || item.estimated_price) && (
                      <div className='text-right'>
                        <span
                          className={`font-medium ${
                            item.actual_price ? 'text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          {formatCurrency(getItemTotal())}
                        </span>
                        {!item.actual_price && item.estimated_price && (
                          <p className='text-xs text-gray-500'>estimated</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Edit Actions */}
                {isEditing && (
                  <div className='flex space-x-2 pt-2'>
                    <Button
                      size='sm'
                      onClick={handleSave}
                      className='flex-1 h-7 text-xs bg-primary hover:bg-emerald-600 text-white'
                    >
                      Save Changes
                    </Button>
                    <Button
                      size='sm'
                      onClick={onCancelEdit}
                      variant='outline'
                      className='h-7 text-xs'
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                
                {/* Help Text for Auto-save */}
                {isEditing && (
                  <p className='text-xs text-gray-500 mt-1'>
                    Press Enter or click outside to auto-save
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            {!isEditing && tripStatus === 'planned' && (
              <div className='flex items-center space-x-1 ml-3'>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={onStartEdit}
                  className='h-8 w-8 p-0'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' />
                  </svg>
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => onDelete(item)}
                  className='h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' />
                  </svg>
                </Button>
              </div>
            )}

            {/* Shopping Mode Price Update */}
            {!isEditing && tripStatus === 'active' && !item.actual_price && (
              <Button
                size='sm'
                onClick={onStartEdit}
                variant='outline'
                className='ml-3'
              >
                Update Price
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}