'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dataService } from '@/lib/data';
import type { Retailer } from '@/types';

const retailerSchema = z.object({
  name: z
    .string()
    .min(1, 'Retailer name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  location: z
    .string()
    .max(200, 'Location must be less than 200 characters')
    .optional()
    .or(z.literal('')),
});

type RetailerFormData = z.infer<typeof retailerSchema>;

interface RetailerFormProps {
  retailer?: Retailer;
  onSuccess: (retailer: Retailer) => void;
  onCancel: () => void;
}

export function RetailerForm({
  retailer,
  onSuccess,
  onCancel,
}: RetailerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RetailerFormData>({
    resolver: zodResolver(retailerSchema),
    defaultValues: {
      name: retailer?.name || '',
      location: retailer?.location || '',
    },
  });

  const onSubmit = async (data: RetailerFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = retailer
        ? await dataService.retailers.update(retailer.id, {
            name: data.name,
            location: data.location || undefined,
          })
        : await dataService.retailers.create({
            name: data.name,
            location: data.location || undefined,
          });

      if (result.success) {
        onSuccess(result.data);
      } else {
        setSubmitError(result.error);
      }
    } catch (error) {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200'>
      {/* Header */}
      <div className='border-b border-gray-200 px-4 py-4'>
        <div className='flex items-center space-x-3 mb-2'>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              retailer
                ? 'bg-blue-100 text-blue-600'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <svg
              className='w-5 h-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              {retailer ? (
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                />
              ) : (
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                />
              )}
            </svg>
          </div>
          <div>
            <h2 className='text-xl font-semibold text-gray-900'>
              {retailer ? 'Edit retailer' : 'Add retailer'}
            </h2>
            <p className='text-sm text-gray-600'>
              {retailer
                ? 'Update retailer information'
                : 'Add a new store where you shop'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className='px-4 py-4 space-y-4'>
        {/* Retailer Name */}
        <div>
          <Input
            label='Store name'
            placeholder='e.g. Target, Whole Foods, Safeway'
            error={errors.name?.message}
            {...register('name')}
          />
        </div>

        {/* Location */}
        <div>
          <Input
            label='Location (optional)'
            placeholder='e.g. Downtown, 5th Street, Mall location'
            error={errors.location?.message}
            {...register('location')}
          />
          <p className='mt-2 text-xs text-gray-500'>
            Help distinguish between different locations of the same store
          </p>
        </div>

        {/* Error Message */}
        {submitError && (
          <div className='rounded-md border border-red-200 bg-red-50 p-3'>
            <div className='flex items-start'>
              <svg
                className='w-4 h-4 text-red-400 mr-2 mt-0.5 flex-shrink-0'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
              <div>
                <h4 className='text-sm font-medium text-red-800'>
                  Unable to save retailer
                </h4>
                <p className='text-sm text-red-700 mt-1'>{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className='flex items-center justify-end space-x-3 pt-4 border-t border-gray-200'>
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={isSubmitting}
            className='min-w-[100px]'
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={isSubmitting}
            className='bg-primary hover:bg-emerald-600 text-white min-w-[140px]'
          >
            {isSubmitting ? (
              <div className='flex items-center'>
                <svg
                  className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
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
                  ></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                Saving...
              </div>
            ) : retailer ? (
              'Save changes'
            ) : (
              'Add retailer'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
