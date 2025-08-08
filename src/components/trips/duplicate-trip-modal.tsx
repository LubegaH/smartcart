'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dataService } from '@/lib/data';
import type { ShoppingTrip, Retailer } from '@/types';

interface DuplicateTripModalProps {
  trip: ShoppingTrip;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTrip: ShoppingTrip) => void;
}

export function DuplicateTripModal({ trip, isOpen, onClose, onSuccess }: DuplicateTripModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [formData, setFormData] = useState({
    name: `${trip.name} (Copy)`,
    date: new Date().toISOString().split('T')[0], // Today
    retailer_id: trip.retailer_id
  });

  // Load retailers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadRetailers();
      // Reset form data when modal opens
      setFormData({
        name: `${trip.name} (Copy)`,
        date: new Date().toISOString().split('T')[0],
        retailer_id: trip.retailer_id
      });
    }
  }, [isOpen, trip]);

  const loadRetailers = async () => {
    const result = await dataService.retailers.getAll();
    if (result.success) {
      setRetailers(result.data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await dataService.trips.duplicateTrip(trip.id, formData);
      
      if (result.success) {
        onSuccess(result.data);
        onClose();
      } else {
        alert(result.error || 'Failed to duplicate trip');
      }
    } catch (error) {
      alert('Failed to duplicate trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Duplicate Trip</h2>
                <p className="text-sm text-gray-600">Create a copy with customizations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Trip Name */}
          <div className="space-y-2">
            <label htmlFor="trip-name" className="block text-sm font-medium text-gray-700">
              Trip Name
            </label>
            <Input
              id="trip-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter trip name"
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label htmlFor="trip-date" className="block text-sm font-medium text-gray-700">
              Shopping Date
            </label>
            <Input
              id="trip-date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          {/* Retailer */}
          <div className="space-y-2">
            <label htmlFor="retailer" className="block text-sm font-medium text-gray-700">
              Retailer
            </label>
            <select
              id="retailer"
              value={formData.retailer_id}
              onChange={(e) => setFormData(prev => ({ ...prev, retailer_id: e.target.value }))}
              className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Select a retailer</option>
              {retailers.map((retailer) => (
                <option key={retailer.id} value={retailer.id}>
                  {retailer.name}
                  {retailer.location && ` - ${retailer.location}`}
                </option>
              ))}
            </select>
          </div>

          {/* Info about what gets copied */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">What gets duplicated:</p>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• All items and quantities</li>
                  <li>• Estimated prices</li>
                  <li>• Trip structure and organization</li>
                </ul>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim() || !formData.retailer_id}
            className="bg-primary hover:bg-emerald-600 text-white min-w-[120px]"
          >
            {isSubmitting ? 'Creating...' : 'Duplicate Trip'}
          </Button>
        </div>
      </div>
    </div>
  );
}