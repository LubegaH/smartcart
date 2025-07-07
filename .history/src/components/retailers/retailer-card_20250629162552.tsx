'use client';

import { useState, useRef, useEffect } from 'react';
import type { Retailer } from '@/types';

interface RetailerCardProps {
  retailer: Retailer;
  onEdit: (retailer: Retailer) => void;
  onDelete: (retailer: Retailer) => void;
  onSelect?: (retailer: Retailer) => void;
  showActions?: boolean;
  isSelected?: boolean;
}

export function RetailerCard({
  retailer,
  onEdit,
  onDelete,
  onSelect,
  showActions = true,
  isSelected = false,
}: RetailerCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<'left' | 'right'>('right');
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate menu position to prevent overflow
  useEffect(() => {
    if (isMenuOpen && menuButtonRef.current) {
      const buttonRect = menuButtonRef.current.getBoundingClientRect();
      const menuWidth = 192; // 12rem = 192px
      const viewportWidth = window.innerWidth;
      const spaceRight = viewportWidth - buttonRect.right;
      const spaceLeft = buttonRect.left;

      // If not enough space on the right, show on the left
      if (spaceRight < menuWidth && spaceLeft > menuWidth) {
        setMenuPosition('left');
      } else {
        setMenuPosition('right');
      }
    }
  }, [isMenuOpen]);

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(retailer);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onEdit(retailer);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDelete(retailer);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4 relative
        ${onSelect ? 'cursor-pointer hover:border-primary/30' : ''}
        ${
          isSelected ? 'border-primary ring-2 ring-primary/10 bg-primary/5' : ''
        }
      `}
      onClick={handleCardClick}
    >
      {/* Card Layout */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3 flex-1'>
          {/* Simple Store Icon */}
          <div className='w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0'>
            <svg
              className='w-4 h-4 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v7.5'
              />
            </svg>
          </div>

          <div className='flex-1 min-w-0'>
            {/* Store Name - Larger and bolder */}
            <h3 className='text-lg font-semibold text-gray-900 truncate'>
              {retailer.name}
            </h3>

            {/* Location - Smaller and subtle */}
            {retailer.location && (
              <p className='text-sm text-gray-500 truncate'>
                {retailer.location}
              </p>
            )}

            {/* Trip Count - Very subtle */}
            <p className='text-xs text-gray-400 mt-1'>
              {retailer.trip_count || 0} trips
            </p>
          </div>
        </div>

        {/* Simple menu button */}
        {showActions && (
          <div className='relative'>
            <button
              ref={menuButtonRef}
              type='button'
              className='p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors'
              onClick={handleMenuToggle}
            >
              <svg className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
                <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
              </svg>
            </button>
            {/* Keep the existing menu dropdown code */}
            {isMenuOpen && (
              <>
                {/* Backdrop */}
                <div
                  className='fixed inset-0 z-10'
                  onClick={() => setIsMenuOpen(false)}
                />

                {/* Menu with smart positioning */}
                <div
                  ref={menuRef}
                  className={`
                    absolute bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[10rem] top-10 
                    ${menuPosition === 'left' ? 'right-0' : 'left-0'}
                  `}
                >
                  <button
                    type='button'
                    className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors'
                    onClick={handleEdit}
                  >
                    <svg
                      className='w-4 h-4 text-gray-400 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                      />
                    </svg>
                    Edit retailer
                  </button>

                  <button
                    type='button'
                    className='w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center transition-colors'
                    onClick={handleDelete}
                  >
                    <svg
                      className='w-4 h-4 text-red-400 mr-2'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                      />
                    </svg>
                    Delete retailer
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className='absolute top-3 right-3'>
          <div className='w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm'>
            <svg
              className='w-4 h-4 text-white'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
