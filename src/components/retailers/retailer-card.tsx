'use client'

import { useState, useRef, useEffect } from 'react'
import type { Retailer } from '@/types'

interface RetailerCardProps {
  retailer: Retailer
  onEdit: (retailer: Retailer) => void
  onDelete: (retailer: Retailer) => void
  onSelect?: (retailer: Retailer) => void
  showActions?: boolean
  isSelected?: boolean
}

export function RetailerCard({ 
  retailer, 
  onEdit, 
  onDelete, 
  onSelect,
  showActions = true,
  isSelected = false 
}: RetailerCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<'left' | 'right'>('right')
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Calculate menu position to prevent overflow
  useEffect(() => {
    if (isMenuOpen && menuButtonRef.current) {
      const buttonRect = menuButtonRef.current.getBoundingClientRect()
      const menuWidth = 192 // 12rem = 192px
      const viewportWidth = window.innerWidth
      const spaceRight = viewportWidth - buttonRect.right
      const spaceLeft = buttonRect.left
      
      // If not enough space on the right, show on the left
      if (spaceRight < menuWidth && spaceLeft > menuWidth) {
        setMenuPosition('left')
      } else {
        setMenuPosition('right')
      }
    }
  }, [isMenuOpen])

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(retailer)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(false)
    onEdit(retailer)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(false)
    onDelete(retailer)
  }

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <div 
      className={`
        bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-6 relative
        ${onSelect ? 'cursor-pointer hover:border-emerald-300' : ''}
        ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50' : ''}
      `}
      onClick={handleCardClick}
    >
      {/* Card Content */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Store Name */}
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {retailer.name}
          </h3>
          
          {/* Location */}
          {retailer.location && (
            <p className="mt-1 text-sm text-gray-500 truncate">
              <svg className="inline-block mr-1 h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {retailer.location}
            </p>
          )}
          
          {/* Trip Count Badge */}
          <div className="mt-3 flex items-center space-x-4">
            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <svg className="mr-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {retailer.trip_count || 0} trips
            </div>
          </div>
        </div>

        {/* Actions Menu */}
        {showActions && (
          <div className="relative">
            <button
              ref={menuButtonRef}
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors touch-target"
              onClick={handleMenuToggle}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />
                
                {/* Menu with smart positioning */}
                <div 
                  ref={menuRef}
                  className={`
                    absolute bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[12rem] top-10 
                    ${menuPosition === 'left' ? 'right-0' : 'left-0'}
                  `}
                >
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                    onClick={handleEdit}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 mr-3">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Edit retailer</div>
                      <div className="text-xs text-gray-500">Update name or location</div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm text-red-700 hover:bg-red-50 flex items-center transition-colors"
                    onClick={handleDelete}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 text-red-600 mr-3">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium">Delete retailer</div>
                      <div className="text-xs text-gray-500">Remove permanently</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}