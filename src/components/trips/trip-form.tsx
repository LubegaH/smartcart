'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RetailerSelector } from '@/components/retailers/retailer-selector';
import { dataService } from '@/lib/data';
import type { CreateTripRequest, Retailer } from '@/types';

const tripFormSchema = z.object({
  name: z.string().min(1, 'Trip name is required').max(100, 'Trip name too long'),
  date: z.string().min(1, 'Date is required'),
  retailer_id: z.string().min(1, 'Please select a retailer'),
});

type TripFormData = z.infer<typeof tripFormSchema>;

interface TripFormProps {
  onSubmit: (data: CreateTripRequest) => void;
  onCancel: () => void;
  isLoading: boolean;
  initialData?: Partial<CreateTripRequest>;
}

export function TripForm({ onSubmit, onCancel, isLoading, initialData }: TripFormProps) {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loadingRetailers, setLoadingRetailers] = useState(true);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TripFormData>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
      retailer_id: initialData?.retailer_id || '',
    },
  });

  const selectedRetailerId = watch('retailer_id');

  useEffect(() => {
    const loadRetailers = async () => {
      try {
        const result = await dataService.retailers.getAll();
        if (result.success) {
          setRetailers(result.data);
          
          // Set initial selected retailer if provided
          if (initialData?.retailer_id) {
            const retailer = result.data.find(r => r.id === initialData.retailer_id);
            if (retailer) {
              setSelectedRetailer(retailer);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load retailers:', error);
      } finally {
        setLoadingRetailers(false);
      }
    };

    loadRetailers();
  }, [initialData?.retailer_id]);

  // Update trip name when retailer changes
  useEffect(() => {
    if (selectedRetailer && !initialData?.name) {
      const today = new Date().toLocaleDateString();
      const suggestedName = `${selectedRetailer.name} - ${today}`;
      setValue('name', suggestedName);
    }
  }, [selectedRetailer, setValue, initialData?.name]);

  const handleRetailerSelect = (retailer: Retailer) => {
    setSelectedRetailer(retailer);
    setValue('retailer_id', retailer.id);
  };

  const handleFormSubmit = (data: TripFormData) => {
    onSubmit({
      name: data.name,
      date: data.date,
      retailer_id: data.retailer_id,
    });
  };

  return (
    <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
      <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-6'>
        {/* Trip Name */}
        <div>
          <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-2'>
            Trip Name
          </label>
          <Input
            id='name'
            type='text'
            placeholder='Enter trip name'
            {...register('name')}
            error={errors.name?.message}
            className='w-full'
          />
          {errors.name && (
            <p className='mt-1 text-sm text-red-600'>{errors.name.message}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label htmlFor='date' className='block text-sm font-medium text-gray-700 mb-2'>
            Shopping Date
          </label>
          <Input
            id='date'
            type='date'
            {...register('date')}
            error={errors.date?.message}
            className='w-full'
          />
          {errors.date && (
            <p className='mt-1 text-sm text-red-600'>{errors.date.message}</p>
          )}
        </div>

        {/* Retailer Selection */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Select Retailer
          </label>
          {loadingRetailers ? (
            <div className='p-4 bg-gray-50 rounded-lg'>
              <div className='animate-pulse'>
                <div className='h-4 bg-gray-200 rounded w-1/4 mb-2'></div>
                <div className='h-4 bg-gray-200 rounded w-1/2'></div>
              </div>
            </div>
          ) : retailers.length === 0 ? (
            <div className='p-4 bg-gray-50 rounded-lg text-center'>
              <p className='text-sm text-gray-600 mb-2'>
                No retailers found. You need to add at least one retailer.
              </p>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => window.open('/retailers/new', '_blank')}
              >
                Add Retailer
              </Button>
            </div>
          ) : (
            <RetailerSelector
              retailers={retailers}
              selectedRetailerId={selectedRetailerId}
              onSelect={handleRetailerSelect}
              showActions={false}
            />
          )}
          {errors.retailer_id && (
            <p className='mt-1 text-sm text-red-600'>{errors.retailer_id.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className='flex space-x-4 pt-4'>
          <Button
            type='submit'
            disabled={isLoading || loadingRetailers || retailers.length === 0}
            className='flex-1 bg-primary hover:bg-emerald-600 text-white shadow-sm hover:shadow-md transition-all duration-200'
          >
            {isLoading ? (
              <>
                <svg
                  className='w-4 h-4 mr-2 animate-spin'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  />
                </svg>
                Creating Trip...
              </>
            ) : (
              'Create Trip'
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