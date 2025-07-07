'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TripCard } from './trip-card';
import { DeleteTripModal } from './delete-trip-modal';
import type { ShoppingTrip } from '@/types';

interface TripListProps {
  trips: ShoppingTrip[];
  onEdit: (trip: ShoppingTrip) => void;
  onViewDetails: (trip: ShoppingTrip) => void;
  onRefresh: () => void;
  emptyStateAction?: React.ReactNode;
}

type FilterOption = 'all' | 'planned' | 'active' | 'completed' | 'archived';
type SortOption = 'date' | 'name' | 'status' | 'total';

export function TripList({
  trips,
  onEdit,
  onViewDetails,
  onRefresh,
  emptyStateAction,
}: TripListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [tripToDelete, setTripToDelete] = useState<ShoppingTrip | null>(null);

  // Filter and sort trips
  const filteredAndSortedTrips = useMemo(() => {
    let filtered = trips;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = trips.filter(
        (trip) =>
          trip.name.toLowerCase().includes(query) ||
          trip.retailer?.name.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filterBy !== 'all') {
      filtered = filtered.filter((trip) => trip.status === filterBy);
    }

    // Sort trips
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          const statusOrder = { planned: 1, active: 0, completed: 2, archived: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'total':
          return (b.estimated_total || 0) - (a.estimated_total || 0);
        default:
          return 0;
      }
    });
  }, [trips, searchQuery, filterBy, sortBy]);

  const handleDeleteSuccess = () => {
    onRefresh();
    setTripToDelete(null);
  };

  const getStatusCount = (status: FilterOption) => {
    if (status === 'all') return trips.length;
    return trips.filter(trip => trip.status === status).length;
  };

  if (trips.length === 0) {
    return (
      <div className='bg-white border border-gray-200 rounded-lg shadow-sm text-center py-12'>
        <div className='max-w-sm mx-auto'>
          <div className='w-16 h-16 rounded-full flex items-center justify-center bg-primary/10 text-primary mx-auto mb-4'>
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
                d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
              />
            </svg>
          </div>
          <h3 className='text-lg font-semibold text-gray-900 mb-2'>
            No trips yet
          </h3>
          <p className='text-sm text-gray-600 mb-6 leading-relaxed'>
            Create your first shopping trip to start tracking prices and managing your grocery shopping.
          </p>
          {emptyStateAction}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Search and Filters */}
      <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-4'>
        {/* Search */}
        <div>
          <Input
            type='search'
            placeholder='Search trips by name or retailer...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full text-base'
          />
        </div>

        {/* Filter Tabs */}
        <div className='flex flex-wrap gap-2'>
          {[
            { value: 'all', label: 'All' },
            { value: 'planned', label: 'Planned' },
            { value: 'active', label: 'Active' },
            { value: 'completed', label: 'Completed' },
            { value: 'archived', label: 'Archived' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterBy(filter.value as FilterOption)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterBy === filter.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
              <span className='ml-1 px-1.5 py-0.5 text-xs rounded-full bg-white/20'>
                {getStatusCount(filter.value as FilterOption)}
              </span>
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <span className='text-sm font-medium text-gray-700 flex items-center'>
              <svg
                className='mr-1 w-4 h-4 text-gray-500'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12'
                />
              </svg>
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className='text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors'
            >
              <option value='date'>Date (newest first)</option>
              <option value='name'>Name (A-Z)</option>
              <option value='status'>Status</option>
              <option value='total'>Estimated Total</option>
            </select>
          </div>

          <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700'>
            {filteredAndSortedTrips.length} of {trips.length} trips
          </span>
        </div>
      </div>

      {/* Results */}
      {filteredAndSortedTrips.length === 0 ? (
        <div className='bg-white border border-gray-200 rounded-lg shadow-sm text-center py-12'>
          <div className='w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 mx-auto mb-4'>
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </div>
          <h3 className='text-base font-semibold text-gray-900 mb-2'>
            No trips found
          </h3>
          <p className='text-sm text-gray-600 mb-4'>
            No trips match your current search and filter criteria.
          </p>
          <Button
            variant='outline'
            size='sm'
            className='border-gray-300 text-gray-700 hover:bg-gray-50'
            onClick={() => {
              setSearchQuery('');
              setFilterBy('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className='grid gap-3'>
          {filteredAndSortedTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onEdit={onEdit}
              onViewDetails={onViewDetails}
              onDelete={setTripToDelete}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {tripToDelete && (
        <DeleteTripModal
          trip={tripToDelete}
          isOpen={true}
          onClose={() => setTripToDelete(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}