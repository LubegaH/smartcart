'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/hooks/useCurrency';
import type { TripItem, TripStatus, PriceSuggestion } from '@/types';

interface FormattedSuggestion {
  suggestion: PriceSuggestion
  displayText: string
  formattedPrice: string
}

interface ItemCardProps {
  item: TripItem;
  tripStatus: TripStatus;
  isEditing: boolean;
  priceHint?: FormattedSuggestion | null; // Pre-fetched price suggestion
  onToggleComplete: (item: TripItem) => void;
  onUpdateItem: (itemId: string, updates: Partial<TripItem>) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (item: TripItem) => void;
  // Bulk selection props
  isSelectable?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (item: TripItem) => void;
}

export function ItemCard({
  item,
  tripStatus,
  isEditing,
  priceHint,
  onToggleComplete,
  onUpdateItem,
  onStartEdit,
  onCancelEdit,
  onDelete,
  isSelectable = false,
  isSelected = false,
  onToggleSelection,
}: ItemCardProps) {
  const { formatAmount, step, decimals } = useCurrency();
  const [editPrice, setEditPrice] = useState(item.actual_price?.toString() || item.estimated_price?.toString() || '');
  const [editQuantity, setEditQuantity] = useState(item.quantity.toString());
  
  // Reset edit values when entering edit mode or item changes
  React.useEffect(() => {
    if (isEditing) {
      setEditPrice(item.actual_price?.toString() || item.estimated_price?.toString() || '');
      setEditQuantity(item.quantity.toString());
    }
  }, [isEditing, item.actual_price, item.estimated_price, item.quantity]);

  const handleSave = () => {
    const price = editPrice.trim() ? parseFloat(editPrice) : null;
    const quantity = parseFloat(editQuantity);
    
    // Validate inputs
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }
    
    if (editPrice.trim() && (price === null || isNaN(price) || price < 0)) {
      alert('Please enter a valid price (0 or greater)');
      return;
    }
    
    // Update both quantity and price if changed
    const updates: Partial<TripItem> = {};
    
    if (quantity !== item.quantity) {
      updates.quantity = quantity;
    }
    
    // Handle price updates more reliably
    const currentPrice = item.actual_price ?? item.estimated_price ?? null;
    if (price !== currentPrice) {
      // Always set actual_price when updating price, regardless of whether estimated_price exists
      updates.actual_price = price;
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

  const handleBlur = (e: React.FocusEvent) => {
    // Only auto-save if focus is moving outside the edit container
    // Use setTimeout to let the browser update document.activeElement
    setTimeout(() => {
      const editContainer = e.currentTarget.closest('.edit-container');
      const newActiveElement = document.activeElement;
      
      // If the new focus is still within the edit container, don't save
      if (editContainer && editContainer.contains(newActiveElement)) {
        return;
      }
      
      // Auto-save when clicking outside the edit area
      handleSave();
    }, 0);
  };

  const getItemTotal = () => {
    const price = item.actual_price || item.estimated_price || 0;
    return price * item.quantity;
  };

  // Helper function to determine price trend
  const getPriceTrend = () => {
    if (!priceHint?.suggestion.estimated || !item.estimated_price) return null;
    
    const currentPrice = item.actual_price || item.estimated_price;
    const suggestedPrice = priceHint.suggestion.estimated;
    
    if (Math.abs(currentPrice - suggestedPrice) < 0.01) return null; // Same price
    
    return currentPrice > suggestedPrice ? 'higher' : 'lower';
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        item.is_completed
          ? 'bg-gray-50 border-gray-200'
          : isSelected
          ? 'bg-primary/5 border-primary/30'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className='flex items-start space-x-3'>
        {/* Bulk Selection Checkbox */}
        {isSelectable && onToggleSelection && (
          <button
            onClick={() => onToggleSelection(item)}
            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-primary border-primary text-white'
                : 'border-gray-300 hover:border-primary'
            }`}
          >
            {isSelected && (
              <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                  clipRule='evenodd'
                />
              </svg>
            )}
          </button>
        )}
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
                  <div className='grid grid-cols-2 gap-2 edit-container'>
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
                        step={step}
                        min='0'
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onBlur={handleBlur}
                        className='text-sm h-8'
                        placeholder={decimals ? '0.00' : '0'}
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
                          {formatAmount(item.actual_price)} each
                        </span>
                      ) : item.estimated_price ? (
                        <span className='text-gray-600'>
                          Est: {formatAmount(item.estimated_price)} each
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
                          {formatAmount(getItemTotal())}
                        </span>
                        {!item.actual_price && item.estimated_price && (
                          <p className='text-xs text-gray-500'>estimated</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Price Intelligence Hints */}
                {!isEditing && priceHint && tripStatus !== 'archived' && (
                  <div className='mt-2 space-y-1'>
                    {/* Last paid price hint */}
                    {priceHint.suggestion.last_paid_date && (
                      <p className='text-xs text-gray-500'>
                        <svg className='inline w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                        </svg>
                        Last paid {priceHint.formattedPrice} on {new Date(priceHint.suggestion.last_paid_date).toLocaleDateString()}
                        {priceHint.suggestion.retailer_name && ` at ${priceHint.suggestion.retailer_name}`}
                      </p>
                    )}
                    
                    {/* Price trend indicator */}
                    {getPriceTrend() && (
                      <div className='flex items-center space-x-1'>
                        {getPriceTrend() === 'higher' ? (
                          <>
                            <svg className='w-3 h-3 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                              <path fillRule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clipRule='evenodd' />
                            </svg>
                            <span className='text-xs text-red-600'>
                              Price higher than usual ({priceHint.formattedPrice} typical)
                            </span>
                          </>
                        ) : (
                          <>
                            <svg className='w-3 h-3 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
                              <path fillRule='evenodd' d='M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z' clipRule='evenodd' />
                            </svg>
                            <span className='text-xs text-green-600'>
                              Good price! (Usually {priceHint.formattedPrice})
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* Confidence indicator for low confidence suggestions */}
                    {priceHint.suggestion.confidence === 'low' && (
                      <p className='text-xs text-amber-600'>
                        <svg className='inline w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.312 16.5c-.77.833.192 2.5 1.732 2.5z' />
                        </svg>
                        Similar item price estimate
                      </p>
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