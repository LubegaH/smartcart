'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/hooks/useCurrency';
import { usePriceIntelligence } from '@/hooks/usePriceIntelligence';
import type { CreateItemRequest } from '@/types';

const createItemFormSchema = (hasDecimals: boolean) => z.object({
  item_name: z.string().min(1, 'Item name is required').max(100, 'Item name too long'),
  quantity: z.number().min(0.1, 'Quantity must be at least 0.1').max(1000, 'Quantity too large'),
  estimated_price: z.number().min(0, 'Price must be positive').optional(),
});

type ItemFormData = {
  item_name: string;
  quantity: number;
  estimated_price?: number;
};

interface AddItemFormProps {
  onSubmit: (data: CreateItemRequest) => Promise<void>;
  onCancel: () => void;
  retailerId?: string; // Optional for backward compatibility
}

export function AddItemForm({ onSubmit, onCancel, retailerId }: AddItemFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoPopulatedPrice, setAutoPopulatedPrice] = useState<number | null>(null);
  
  const { step, decimals, formatAmount } = useCurrency();
  const { 
    suggestion, 
    isLoading: suggestionLoading, 
    getSuggestion, 
    clearSuggestion,
    getHighConfidenceSuggestion 
  } = usePriceIntelligence();

  const itemFormSchema = createItemFormSchema(decimals);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  const itemName = watch('item_name');
  const currentPrice = watch('estimated_price');

  // Get price suggestions when item name changes
  useEffect(() => {
    if (itemName && itemName.length >= 2 && retailerId) {
      getSuggestion(itemName, retailerId);
    } else {
      clearSuggestion();
    }
    // Clear auto-populated price when item name changes
    setAutoPopulatedPrice(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemName, retailerId]); // Functions are stable from useCallback, omitting to prevent infinite loop

  // Auto-populate price for high confidence suggestions
  useEffect(() => {
    const autoPopulatePrice = async () => {
      if (itemName && itemName.length >= 3 && retailerId) {
        const highConfidenceSuggestion = await getHighConfidenceSuggestion(itemName, retailerId);
        if (highConfidenceSuggestion && highConfidenceSuggestion.suggestion.estimated) {
          setValue('estimated_price', highConfidenceSuggestion.suggestion.estimated);
          setAutoPopulatedPrice(highConfidenceSuggestion.suggestion.estimated);
        }
      }
    };

    const debounce = setTimeout(autoPopulatePrice, 500);
    return () => clearTimeout(debounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemName, retailerId]); // Functions are stable from useCallback, omitting to prevent infinite loop

  // Clear auto-population feedback when user manually changes price
  useEffect(() => {
    if (autoPopulatedPrice && currentPrice !== autoPopulatedPrice) {
      setAutoPopulatedPrice(null);
    }
  }, [currentPrice, autoPopulatedPrice]);

  const handleFormSubmit = async (data: ItemFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await onSubmit({
        item_name: data.item_name.trim(),
        quantity: data.quantity,
        estimated_price: data.estimated_price,
      });
      
      reset();
      clearSuggestion();
      setAutoPopulatedPrice(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setIsLoading(false);
    }
  };

  const applySuggestion = (suggestionData: { suggestion: { estimated?: number } }) => {
    if (suggestionData.suggestion.estimated) {
      setValue('estimated_price', suggestionData.suggestion.estimated);
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-gray-900'>Add Item</h3>
        <Button variant='ghost' size='sm' onClick={onCancel}>
          <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
          </svg>
        </Button>
      </div>

      {error && (
        <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
          <div className='flex items-start'>
            <svg className='w-5 h-5 text-red-400 mr-2 mt-0.5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            <p className='text-sm text-red-800'>{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4'>
        {/* Item Name */}
        <div>
          <label htmlFor='item_name' className='block text-sm font-medium text-gray-700 mb-1'>
            Item Name
          </label>
          <Input
            id='item_name'
            type='text'
            placeholder='e.g., Bananas, Milk, Bread'
            {...register('item_name')}
            error={errors.item_name?.message}
            className='w-full'
            autoFocus
          />
          {errors.item_name && (
            <p className='mt-1 text-sm text-red-600'>{errors.item_name.message}</p>
          )}
        </div>

        {/* Quantity and Price */}
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label htmlFor='quantity' className='block text-sm font-medium text-gray-700 mb-1'>
              Quantity
            </label>
            <Input
              id='quantity'
              type='number'
              step='0.1'
              min='0.1'
              placeholder='1'
              {...register('quantity', { valueAsNumber: true })}
              error={errors.quantity?.message}
              className='w-full'
            />
            {errors.quantity && (
              <p className='mt-1 text-sm text-red-600'>{errors.quantity.message}</p>
            )}
          </div>

          <div>
            <label htmlFor='estimated_price' className='block text-sm font-medium text-gray-700 mb-1'>
              Estimated Price
            </label>
            <Input
              id='estimated_price'
              type='number'
              step={step}
              min='0'
              placeholder={decimals ? '0.00' : '0'}
              {...register('estimated_price', { valueAsNumber: true })}
              error={errors.estimated_price?.message}
              className='w-full'
            />
            {errors.estimated_price && (
              <p className='mt-1 text-sm text-red-600'>{errors.estimated_price.message}</p>
            )}
            {/* Auto-population feedback */}
            {autoPopulatedPrice && (
              <p className='mt-1 text-xs text-blue-600 flex items-center'>
                <svg className='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                </svg>
                Auto-filled from purchase history
              </p>
            )}
          </div>
        </div>

        {/* Price Suggestions */}
        {(suggestionLoading || suggestion) && (
          <div className='space-y-2'>
            {/* Loading indicator */}
            {suggestionLoading && (
              <div className='p-3 bg-gray-50 border border-gray-200 rounded-lg'>
                <div className='flex items-center space-x-2'>
                  <svg className='w-4 h-4 animate-spin text-gray-400' fill='none' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                  </svg>
                  <span className='text-sm text-gray-600'>Finding price suggestions...</span>
                </div>
              </div>
            )}
            
            {/* Suggestion display */}
            {suggestion && (
              <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='flex items-center space-x-2 mb-3'>
                  <svg className='w-4 h-4 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                  <span className='text-sm font-medium text-blue-800'>Price Suggestion</span>
                </div>
                <div className='flex items-center justify-between bg-white p-2 rounded border'>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 truncate'>
                      {itemName}
                    </p>
                    <div className='flex items-center space-x-2 mt-1'>
                      <span className='text-sm text-blue-700 font-medium'>
                        {suggestion.formattedPrice}
                      </span>
                      {suggestion.suggestion.confidence === 'high' && (
                        <span className='px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium'>
                          High match
                        </span>
                      )}
                      {suggestion.suggestion.confidence === 'medium' && (
                        <span className='px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium'>
                          Medium match
                        </span>
                      )}
                      {suggestion.suggestion.confidence === 'low' && (
                        <span className='px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium'>
                          Low match
                        </span>
                      )}
                    </div>
                    {suggestion.suggestion.last_paid_date && (
                      <p className='text-xs text-gray-500 mt-1'>
                        Last bought {new Date(suggestion.suggestion.last_paid_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={() => applySuggestion(suggestion)}
                    className='ml-3 border-blue-300 text-blue-700 hover:bg-blue-50 flex-shrink-0'
                  >
                    Use
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className='flex space-x-3 pt-2'>
          <Button
            type='submit'
            disabled={isLoading}
            className='flex-1 bg-primary hover:bg-emerald-600 text-white'
          >
            {isLoading ? (
              <>
                <svg className='w-4 h-4 mr-2 animate-spin' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
                </svg>
                Adding...
              </>
            ) : (
              'Add Item'
            )}
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={isLoading}
            className='flex-1'
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}