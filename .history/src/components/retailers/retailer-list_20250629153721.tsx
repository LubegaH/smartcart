'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RetailerCard } from './retailer-card'
import { DeleteRetailerModal } from './delete-retailer-modal'
import type { Retailer } from '@/types'

interface RetailerListProps {
  retailers: Retailer[]
  onEdit: (retailer: Retailer) => void
  onRefresh: () => void
  onSelect?: (retailer: Retailer) => void
  selectedRetailerId?: string
  showActions?: boolean
  emptyStateAction?: React.ReactNode
}

type SortOption = 'name' | 'trips' | 'recent'

export function RetailerList({ 
  retailers, 
  onEdit, 
  onRefresh,
  onSelect,
  selectedRetailerId,
  showActions = true,
  emptyStateAction
}: RetailerListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [retailerToDelete, setRetailerToDelete] = useState<Retailer | null>(null)

  // Filter and sort retailers
  const filteredAndSortedRetailers = useMemo(() => {
    let filtered = retailers

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = retailers.filter(retailer => 
        retailer.name.toLowerCase().includes(query) ||
        (retailer.location && retailer.location.toLowerCase().includes(query))
      )
    }

    // Sort retailers
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'trips':
          return (b.trip_count || 0) - (a.trip_count || 0)
        case 'recent':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        default:
          return 0
      }
    })
  }, [retailers, searchQuery, sortBy])

  const handleDeleteSuccess = () => {
    onRefresh()
    setRetailerToDelete(null)
  }

  if (retailers.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm text-center py-12">
        <div className="max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600 mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v7.5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No retailers yet
          </h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Add stores where you shop to track prices and organize your shopping trips.
          </p>
          {emptyStateAction}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-4">
        {/* Search */}
        <div>
          <Input
            type="search"
            placeholder="Search retailers by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-base"
          />
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700 flex items-center">
              <svg className="mr-1 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            >
              <option value="name">Name (A-Z)</option>
              <option value="trips">Most trips</option>
              <option value="recent">Recently added</option>
            </select>
          </div>

          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {filteredAndSortedRetailers.length} of {retailers.length} retailers
          </span>
        </div>
      </div>

      {/* Results */}
      {filteredAndSortedRetailers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm text-center py-12">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            No retailers found
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            No retailers match &quot;{searchQuery}&quot;
          </p>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={() => setSearchQuery('')}
          >
            Clear search
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredAndSortedRetailers.map(retailer => (
            <RetailerCard
              key={retailer.id}
              retailer={retailer}
              onEdit={onEdit}
              onDelete={setRetailerToDelete}
              onSelect={onSelect}
              showActions={showActions}
              isSelected={selectedRetailerId === retailer.id}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {retailerToDelete && (
        <DeleteRetailerModal
          retailer={retailerToDelete}
          isOpen={true}
          onClose={() => setRetailerToDelete(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  )
}