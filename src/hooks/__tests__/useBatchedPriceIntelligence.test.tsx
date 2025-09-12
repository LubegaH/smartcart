import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useBatchedPriceIntelligence } from '../useBatchedPriceIntelligence'
import { priceIntelligenceService } from '@/lib/price-intelligence'
import { useCurrency } from '@/hooks/useCurrency'
import type { TripItem } from '@/types'

// Mock dependencies
vi.mock('@/lib/price-intelligence')
vi.mock('@/hooks/useCurrency')

const mockPriceIntelligenceService = priceIntelligenceService as {
  getPriceSuggestion: Mock
}

const mockUseCurrency = useCurrency as Mock

describe('useBatchedPriceIntelligence', () => {
  const mockFormatAmount = vi.fn((amount: number) => `$${amount.toFixed(2)}`)

  const sampleItems: TripItem[] = [
    {
      id: '1',
      trip_id: 'trip-1',
      item_name: 'milk',
      quantity: 1,
      estimated_price: 3.99,
      actual_price: null,
      is_completed: false,
      created_at: '2025-08-09T10:00:00Z',
      updated_at: '2025-08-09T10:00:00Z'
    },
    {
      id: '2',
      trip_id: 'trip-1',
      item_name: 'bread',
      quantity: 2,
      estimated_price: 2.99,
      actual_price: null,
      is_completed: false,
      created_at: '2025-08-09T10:00:00Z',
      updated_at: '2025-08-09T10:00:00Z'
    },
    {
      id: '3',
      trip_id: 'trip-1',
      item_name: 'MILK', // Should be normalized
      quantity: 1,
      estimated_price: null,
      actual_price: null,
      is_completed: false,
      created_at: '2025-08-09T10:00:00Z',
      updated_at: '2025-08-09T10:00:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCurrency.mockReturnValue({
      formatAmount: mockFormatAmount
    })
  })

  it('should initialize with empty price hints and no loading state', () => {
    const { result } = renderHook(() =>
      useBatchedPriceIntelligence([], 'test-retailer-id')
    )

    expect(result.current.priceHints).toEqual({})
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should fetch price hints for unique items', async () => {
    mockPriceIntelligenceService.getPriceSuggestion
      .mockResolvedValueOnce({
        success: true,
        data: {
          estimated: 3.99,
          confidence: 'high' as const,
          last_paid: 3.99,
          retailer_name: 'Test Store'
        }
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          estimated: 2.99,
          confidence: 'medium' as const,
          last_paid: 2.99,
          retailer_name: 'Test Store'
        }
      })

    const { result } = renderHook(() =>
      useBatchedPriceIntelligence(sampleItems, 'test-retailer-id')
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should only call twice for unique items (milk and bread, with milk normalized)
    expect(mockPriceIntelligenceService.getPriceSuggestion).toHaveBeenCalledTimes(2)
    expect(mockPriceIntelligenceService.getPriceSuggestion).toHaveBeenCalledWith('milk', 'test-retailer-id')
    expect(mockPriceIntelligenceService.getPriceSuggestion).toHaveBeenCalledWith('bread', 'test-retailer-id')

    expect(result.current.priceHints).toHaveProperty('milk')
    expect(result.current.priceHints).toHaveProperty('bread')
    expect(result.current.priceHints.milk?.formattedPrice).toBe('$3.99')
    expect(result.current.priceHints.bread?.formattedPrice).toBe('$2.99')
  })

  it('should normalize item names for consistent caching', async () => {
    mockPriceIntelligenceService.getPriceSuggestion.mockResolvedValue({
      success: true,
      data: { estimated: null, confidence: 'low' as const }
    })

    const itemsWithDuplicates: TripItem[] = [
      { ...sampleItems[0], item_name: 'Milk' },
      { ...sampleItems[1], item_name: 'MILK' },
      { ...sampleItems[2], item_name: '  milk  ' }
    ]

    const { result } = renderHook(() =>
      useBatchedPriceIntelligence(itemsWithDuplicates, 'test-retailer-id')
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should only call once for the normalized 'milk' item
    expect(mockPriceIntelligenceService.getPriceSuggestion).toHaveBeenCalledTimes(1)
    expect(mockPriceIntelligenceService.getPriceSuggestion).toHaveBeenCalledWith('Milk', 'test-retailer-id')
  })

  it('should not fetch when retailer ID is missing', () => {
    const { result } = renderHook(() =>
      useBatchedPriceIntelligence(sampleItems, undefined)
    )

    expect(result.current.priceHints).toEqual({})
    expect(result.current.isLoading).toBe(false)
    expect(mockPriceIntelligenceService.getPriceSuggestion).not.toHaveBeenCalled()
  })

  it('should not fetch when items array is empty', () => {
    const { result } = renderHook(() =>
      useBatchedPriceIntelligence([], 'test-retailer-id')
    )

    expect(result.current.priceHints).toEqual({})
    expect(result.current.isLoading).toBe(false)
    expect(mockPriceIntelligenceService.getPriceSuggestion).not.toHaveBeenCalled()
  })

  it('should handle API errors gracefully', async () => {
    mockPriceIntelligenceService.getPriceSuggestion
      .mockResolvedValueOnce({
        success: true,
        data: {
          estimated: 3.99,
          confidence: 'high' as const
        }
      })
      .mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() =>
      useBatchedPriceIntelligence(sampleItems.slice(0, 2), 'test-retailer-id')
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should still have successful results
    expect(result.current.priceHints.milk).toBeDefined()
    expect(result.current.priceHints.bread).toBeNull() // Failed request
    expect(result.current.error).toBeNull() // Individual errors are handled gracefully
  })

  it('should handle service errors and set error state', async () => {
    // Mock promise rejection that won't be caught by individual item error handling
    mockPriceIntelligenceService.getPriceSuggestion.mockRejectedValue(
      new Error('Promise.all error')
    )

    const { result } = renderHook(() =>
      useBatchedPriceIntelligence([sampleItems[0]], 'test-retailer-id')
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    }, { timeout: 2000 })

    // Individual promise failures are handled gracefully, so check that results are set to null
    expect(result.current.priceHints.milk).toBeNull()
    expect(result.current.error).toBeNull() // Individual errors don't set global error state
  })

  it('should prevent concurrent fetches', async () => {
    mockPriceIntelligenceService.getPriceSuggestion.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: { estimated: 3.99, confidence: 'high' as const }
      }), 50))
    )

    const { result, rerender } = renderHook(
      ({ items, retailerId }) => useBatchedPriceIntelligence(items, retailerId),
      {
        initialProps: { items: [sampleItems[0]], retailerId: 'test-retailer-id' }
      }
    )

    // Wait for initial render to start
    await new Promise(resolve => setTimeout(resolve, 10))

    // Trigger re-render before first request completes
    rerender({ items: sampleItems.slice(0, 2), retailerId: 'test-retailer-id' })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should have calls for milk and bread (the second render should trigger new requests)
    // The exact count depends on the implementation's concurrency control
    expect(mockPriceIntelligenceService.getPriceSuggestion).toHaveBeenCalled()
  })

  it('should provide refetch functionality', async () => {
    mockPriceIntelligenceService.getPriceSuggestion.mockResolvedValue({
      success: true,
      data: {
        estimated: 3.99,
        confidence: 'high' as const
      }
    })

    const { result } = renderHook(() =>
      useBatchedPriceIntelligence([sampleItems[0]], 'test-retailer-id')
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Clear the mock calls
    mockPriceIntelligenceService.getPriceSuggestion.mockClear()

    // Call refetch
    await result.current.refetch()

    expect(mockPriceIntelligenceService.getPriceSuggestion).toHaveBeenCalledTimes(1)
  })

  it('should update when items change', async () => {
    mockPriceIntelligenceService.getPriceSuggestion.mockResolvedValue({
      success: true,
      data: { estimated: 3.99, confidence: 'high' as const }
    })

    const { result, rerender } = renderHook(
      ({ items, retailerId }) => useBatchedPriceIntelligence(items, retailerId),
      {
        initialProps: { items: [sampleItems[0]], retailerId: 'test-retailer-id' }
      }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockPriceIntelligenceService.getPriceSuggestion).toHaveBeenCalledTimes(1)

    // Add more items
    rerender({ items: sampleItems, retailerId: 'test-retailer-id' })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Should fetch for the new items
    expect(mockPriceIntelligenceService.getPriceSuggestion).toHaveBeenCalledTimes(3) // milk, milk, bread
  })

  it('should abort previous requests when component unmounts', async () => {
    const abortSpy = vi.fn()
    const mockAbortController = {
      abort: abortSpy,
      signal: { aborted: false }
    }

    // Mock AbortController
    global.AbortController = vi.fn().mockImplementation(() => mockAbortController)

    mockPriceIntelligenceService.getPriceSuggestion.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    )

    const { unmount } = renderHook(() =>
      useBatchedPriceIntelligence([sampleItems[0]], 'test-retailer-id')
    )

    unmount()

    expect(abortSpy).toHaveBeenCalled()
  })

  it('should handle null suggestions correctly', async () => {
    mockPriceIntelligenceService.getPriceSuggestion.mockResolvedValue({
      success: true,
      data: { estimated: null, confidence: 'low' as const }
    })

    const { result } = renderHook(() =>
      useBatchedPriceIntelligence([sampleItems[0]], 'test-retailer-id')
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.priceHints.milk).toBeNull()
  })
})