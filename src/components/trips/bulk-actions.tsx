'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TripItem } from '@/types';

interface BulkActionsProps {
  selectedItems: TripItem[];
  onBulkDelete: (itemIds: string[]) => Promise<void>;
  onBulkUpdateQuantity: (itemIds: string[], quantity: number) => Promise<void>;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedItems,
  onBulkDelete,
  onBulkUpdateQuantity,
  onClearSelection,
}: BulkActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
  const [showQuantityInput, setShowQuantityInput] = useState(false);
  const [quantityValue, setQuantityValue] = useState('1');

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedItems.length} selected items?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await onBulkDelete(selectedItems.map(item => item.id));
      onClearSelection();
    } catch (error) {
      console.error('Bulk delete failed:', error);
      alert('Failed to delete items. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkQuantityUpdate = async () => {
    const quantity = parseFloat(quantityValue);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity greater than 0');
      return;
    }

    setIsUpdatingQuantity(true);
    try {
      await onBulkUpdateQuantity(selectedItems.map(item => item.id), quantity);
      onClearSelection();
      setShowQuantityInput(false);
      setQuantityValue('1');
    } catch (error) {
      console.error('Bulk quantity update failed:', error);
      alert('Failed to update quantities. Please try again.');
    } finally {
      setIsUpdatingQuantity(false);
    }
  };

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {selectedItems.length}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'} selected
              </p>
              <p className="text-xs text-gray-500">
                Choose an action to apply to all selected items
              </p>
            </div>
          </div>
          <button
            onClick={onClearSelection}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quantity Update Input */}
        {showQuantityInput && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <label htmlFor="bulk-quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  New Quantity
                </label>
                <Input
                  id="bulk-quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantityValue}
                  onChange={(e) => setQuantityValue(e.target.value)}
                  placeholder="Enter quantity"
                  className="text-center"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleBulkQuantityUpdate}
                  disabled={isUpdatingQuantity}
                  size="sm"
                  className="bg-primary hover:bg-emerald-600 text-white"
                >
                  {isUpdatingQuantity ? 'Updating...' : 'Apply'}
                </Button>
                <Button
                  onClick={() => {
                    setShowQuantityInput(false);
                    setQuantityValue('1');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          {!showQuantityInput && (
            <>
              <Button
                onClick={() => setShowQuantityInput(true)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Update Quantities
              </Button>
              <Button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                variant="outline"
                size="sm"
                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isDeleting ? 'Deleting...' : 'Delete Items'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}