'use client'

import { useState, useEffect } from 'react'
import { RetailerList } from './retailer-list'
import { Button } from '@/components/ui/button'
import { dataService } from '@/lib/data'
import type { Retailer } from '@/types'

interface RetailerSelectorProps {
  selectedRetailerId?: string
  onSelect: (retailer: Retailer) => void
  onCreateNew?: () => void
  className?: string
}

export function RetailerSelector({ 
  selectedRetailerId, 
  onSelect, 
  onCreateNew,
  className = ''
}: RetailerSelectorProps) {
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRetailers = async () => {
    try {
      setError(null)
      const result = await dataService.retailers.getAll()
      
      if (result.success) {
        setRetailers(result.data)
      } else {
        setError(result.error)
      }
    } catch {
      setError('Failed to load retailers')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRetailers()
  }, [])

  const handleEdit = () => {
    // For now, just refresh the list
    // In a full implementation, this would open an edit modal
    loadRetailers()
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded mb-2"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-red-600 hover:text-red-700"
            onClick={loadRetailers}
          >
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Select retailer
        </h3>
        {onCreateNew && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateNew}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add new
          </Button>
        )}
      </div>

      <RetailerList
        retailers={retailers}
        onEdit={handleEdit}
        onRefresh={loadRetailers}
        onSelect={onSelect}
        selectedRetailerId={selectedRetailerId}
        showActions={false}
        emptyStateAction={
          onCreateNew ? (
            <Button onClick={onCreateNew}>
              Add your first retailer
            </Button>
          ) : undefined
        }
      />
    </div>
  )
}