import { useState, useEffect, useMemo, useRef } from 'react'
import { priceIntelligenceService } from '@/lib/price-intelligence'
import { useCurrency } from '@/hooks/useCurrency'
import type { PriceSuggestion as APISuggestion, TripItem } from '@/types'

interface FormattedSuggestion {
  suggestion: APISuggestion
  displayText: string
  formattedPrice: string
}

interface UseBatchedPriceIntelligenceReturn {
  priceHints: Record<string, FormattedSuggestion | null>
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook for efficiently fetching price intelligence for multiple items
 * Prevents infinite loops and performance issues with proper memoization
 */
export function useBatchedPriceIntelligence(
  items: TripItem[],
  retailerId?: string
): UseBatchedPriceIntelligenceReturn {
  const { formatAmount } = useCurrency()
  const [priceHints, setPriceHints] = useState<Record<string, FormattedSuggestion | null>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Prevent concurrent fetches and infinite loops
  const isFetchingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Memoize unique item names to prevent unnecessary re-fetches
  const uniqueItemNames = useMemo(() => {
    const nameMap = new Map<string, string>()
    items.forEach(item => {
      const normalized = item.item_name.toLowerCase().trim()
      if (normalized && !nameMap.has(normalized)) {
        nameMap.set(normalized, item.item_name)
      }
    })
    return nameMap
  }, [items])

  // Create a stable cache key to prevent unnecessary re-fetches
  const cacheKey = useMemo(() => {
    if (!retailerId || uniqueItemNames.size === 0) return null
    const itemNamesStr = Array.from(uniqueItemNames.keys()).sort().join('|')
    return `${retailerId}:${itemNamesStr}`
  }, [retailerId, uniqueItemNames])

  // Memoize format function to prevent recreation
  const formatSuggestion = useMemo(() => {
    return (result: APISuggestion): FormattedSuggestion => {
      const formattedPrice = result.estimated ? formatAmount(result.estimated) : 'No price'
      let displayText = `${formattedPrice}`
      
      if (result.last_paid && result.retailer_name) {
        displayText += ` (Last paid at ${result.retailer_name})`
      }
      
      return {
        suggestion: result,
        displayText,
        formattedPrice
      }
    }
  }, [formatAmount])

  // Fetch function with proper cleanup and concurrency control
  const fetchPriceHints = async () => {
    // Prevent concurrent requests
    if (isFetchingRef.current) {
      return
    }

    // Clear state if no data to fetch
    if (!cacheKey) {
      setPriceHints({})
      return
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    const { signal } = abortControllerRef.current

    isFetchingRef.current = true
    setIsLoading(true)
    setError(null)
    
    try {
      // Batch fetch suggestions for all unique items
      const suggestions = await Promise.all(
        Array.from(uniqueItemNames.entries()).map(async ([normalizedName, originalName]) => {
          try {
            // Check if aborted
            if (signal.aborted) {
              throw new Error('Aborted')
            }

            const result = await priceIntelligenceService.getPriceSuggestion(originalName, retailerId!)
            
            return {
              normalizedName,
              suggestion: result.success && result.data.estimated ? formatSuggestion(result.data) : null
            }
          } catch (err) {
            if (signal.aborted) {
              throw err // Re-throw abort errors
            }
            // Silently handle expected errors for empty price history
            console.warn(`No price history found for ${originalName} - this is normal for new users`)
            return { normalizedName, suggestion: null }
          }
        })
      )
      
      // Check if aborted before updating state
      if (signal.aborted) {
        return
      }

      // Convert to record for easy lookup
      const hintsRecord: Record<string, FormattedSuggestion | null> = {}
      suggestions.forEach(({ normalizedName, suggestion }) => {
        hintsRecord[normalizedName] = suggestion
      })
      
      setPriceHints(hintsRecord)
    } catch (err) {
      if (signal.aborted) {
        return // Don't update state for aborted requests
      }
      // Don't show error for empty price history - it's expected for new users
      console.warn('Price intelligence temporarily unavailable - this is normal for new users:', err)
      setPriceHints({}) // Clear any stale hints
    } finally {
      isFetchingRef.current = false
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }
  
  // Effect with stable cacheKey dependency - prevents infinite loops
  useEffect(() => {
    fetchPriceHints()
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      isFetchingRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]) // Only re-run when cacheKey actually changes, fetchPriceHints is stable
  
  return {
    priceHints,
    isLoading,
    error,
    refetch: fetchPriceHints
  }
}