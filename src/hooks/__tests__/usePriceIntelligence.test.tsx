import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { usePriceIntelligence } from '../usePriceIntelligence'
import { priceIntelligenceService } from '@/lib/price-intelligence'
import { useCurrency } from '@/hooks/useCurrency'

// Mock dependencies
vi.mock('@/lib/price-intelligence')
vi.mock('@/hooks/useCurrency')

const mockPriceIntelligenceService = priceIntelligenceService as {
  getPriceSuggestion: Mock
}

const mockUseCurrency = useCurrency as Mock

describe('usePriceIntelligence', () => {
  const mockFormatAmount = vi.fn((amount: number) => `$${amount.toFixed(2)}`)

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCurrency.mockReturnValue({
      formatAmount: mockFormatAmount
    })
  })

  it('should initialize with null suggestion and no loading state', () => {
    const { result } = renderHook(() => usePriceIntelligence())

    expect(result.current.suggestion).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should get price suggestion and format it correctly', async () => {
    const mockSuggestion = {
      estimated: 3.99,
      confidence: 'high' as const,
      last_paid: 3.99,
      last_paid_date: '2025-08-09',
      retailer_name: 'Test Store'
    }

    mockPriceIntelligenceService.getPriceSuggestion.mockResolvedValue({
      success: true,
      data: mockSuggestion
    })

    const { result } = renderHook(() => usePriceIntelligence())

    await act(async () => {
      await result.current.getSuggestion('milk', 'test-retailer-id')
    })

    await waitFor(() => {
      expect(result.current.suggestion).not.toBeNull()
    })

    expect(result.current.suggestion?.formattedPrice).toBe('$3.99')
    expect(result.current.suggestion?.displayText).toBe('$3.99 (Last paid at Test Store)')
    expect(result.current.suggestion?.suggestion).toEqual(mockSuggestion)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle short item names by clearing suggestion', async () => {
    const { result } = renderHook(() => usePriceIntelligence())

    await act(async () => {
      await result.current.getSuggestion('m', 'test-retailer-id')
    })

    expect(result.current.suggestion).toBeNull()
    expect(mockPriceIntelligenceService.getPriceSuggestion).not.toHaveBeenCalled()
  })

  it('should handle API errors gracefully', async () => {
    mockPriceIntelligenceService.getPriceSuggestion.mockResolvedValue({
      success: false,
      error: 'API Error'
    })

    const { result } = renderHook(() => usePriceIntelligence())

    await act(async () => {
      await result.current.getSuggestion('milk', 'test-retailer-id')
    })

    await waitFor(() => {
      expect(result.current.error).toBe('API Error')
    })

    expect(result.current.suggestion).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('should handle no suggestion available', async () => {
    mockPriceIntelligenceService.getPriceSuggestion.mockResolvedValue({
      success: true,
      data: {
        estimated: null,
        confidence: 'low' as const
      }
    })

    const { result } = renderHook(() => usePriceIntelligence())

    await act(async () => {
      await result.current.getSuggestion('unknown-item', 'test-retailer-id')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.suggestion).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should debounce API calls', async () => {
    vi.useFakeTimers()

    mockPriceIntelligenceService.getPriceSuggestion.mockResolvedValue({
      success: true,
      data: {
        estimated: 3.99,
        confidence: 'high' as const,
        last_paid: 3.99,
        last_paid_date: '2025-08-09',
        retailer_name: 'Test Store'
      }
    })

    const { result } = renderHook(() => usePriceIntelligence())

    // Make multiple rapid calls
    act(() => {
      result.current.getSuggestion('milk', 'test-retailer-id')
      result.current.getSuggestion('milk organic', 'test-retailer-id')
      result.current.getSuggestion('milk 2%', 'test-retailer-id')
    })

    // Fast forward past debounce delay and wait for promises
    await act(async () => {
      vi.advanceTimersByTime(300)
      await vi.runOnlyPendingTimersAsync()
    })

    // Should only have been called once with the last query
    expect(mockPriceIntelligenceService.getPriceSuggestion).toHaveBeenCalledTimes(1)
    expect(mockPriceIntelligenceService.getPriceSuggestion).toHaveBeenLastCalledWith(
      'milk 2%',
      'test-retailer-id'
    )

    vi.useRealTimers()
  })

  it('should clear suggestion and error on clearSuggestion', () => {
    const { result } = renderHook(() => usePriceIntelligence())

    // Set some state first
    act(() => {
      result.current.clearSuggestion()
    })

    expect(result.current.suggestion).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should return high confidence suggestion only for getHighConfidenceSuggestion', async () => {
    // Mock high confidence suggestion
    mockPriceIntelligenceService.getPriceSuggestion.mockResolvedValue({
      success: true,
      data: {
        estimated: 3.99,
        confidence: 'high' as const,
        last_paid: 3.99,
        last_paid_date: '2025-08-09',
        retailer_name: 'Test Store'
      }
    })

    const { result } = renderHook(() => usePriceIntelligence())

    const highConfidenceSuggestion = await result.current.getHighConfidenceSuggestion(
      'milk',
      'test-retailer-id'
    )

    expect(highConfidenceSuggestion).not.toBeNull()
    expect(highConfidenceSuggestion?.formattedPrice).toBe('$3.99')
  })

  it('should return null for medium/low confidence suggestions in getHighConfidenceSuggestion', async () => {
    // Mock medium confidence suggestion
    mockPriceIntelligenceService.getPriceSuggestion.mockResolvedValue({
      success: true,
      data: {
        estimated: 3.99,
        confidence: 'medium' as const,
        last_paid: 3.99,
        last_paid_date: '2025-08-09',
        retailer_name: 'Test Store'
      }
    })

    const { result } = renderHook(() => usePriceIntelligence())

    const highConfidenceSuggestion = await result.current.getHighConfidenceSuggestion(
      'milk',
      'test-retailer-id'
    )

    expect(highConfidenceSuggestion).toBeNull()
  })

  it('should handle exceptions in getHighConfidenceSuggestion', async () => {
    mockPriceIntelligenceService.getPriceSuggestion.mockRejectedValue(
      new Error('Network error')
    )

    const { result } = renderHook(() => usePriceIntelligence())

    const highConfidenceSuggestion = await result.current.getHighConfidenceSuggestion(
      'milk',
      'test-retailer-id'
    )

    expect(highConfidenceSuggestion).toBeNull()
  })

  it('should format suggestion without retailer name when not available', async () => {
    const mockSuggestion = {
      estimated: 2.50,
      confidence: 'medium' as const
    }

    mockPriceIntelligenceService.getPriceSuggestion.mockResolvedValue({
      success: true,
      data: mockSuggestion
    })

    const { result } = renderHook(() => usePriceIntelligence())

    await act(async () => {
      await result.current.getSuggestion('bread', 'test-retailer-id')
    })

    await waitFor(() => {
      expect(result.current.suggestion).not.toBeNull()
    }, { timeout: 1000 })

    expect(result.current.suggestion?.displayText).toBe('$2.50')
  })
})