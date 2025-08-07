import React, { useState, useCallback, useRef } from 'react'
import { priceIntelligenceService } from '@/lib/price-intelligence'
import { useCurrency } from '@/hooks/useCurrency'
import type { PriceSuggestion as APISuggestion } from '@/types'

interface FormattedSuggestion {
  suggestion: APISuggestion
  displayText: string
  formattedPrice: string
}

interface UsePriceIntelligenceReturn {
  suggestion: FormattedSuggestion | null
  isLoading: boolean
  error: string | null
  getSuggestion: (itemName: string, retailerId: string) => Promise<void>
  clearSuggestion: () => void
  getHighConfidenceSuggestion: (itemName: string, retailerId: string) => Promise<FormattedSuggestion | null>
}

/**
 * Hook for price intelligence features including suggestions and history
 * Provides debounced search, formatted suggestions, and auto-population logic
 */
export function usePriceIntelligence(): UsePriceIntelligenceReturn {
  const { formatAmount } = useCurrency()
  const [suggestion, setSuggestion] = useState<FormattedSuggestion | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Debounce timer ref
  const debounceRef = useRef<NodeJS.Timeout>()
  
  const formatSuggestion = useCallback((result: APISuggestion): FormattedSuggestion => {
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
  }, [formatAmount])
  
  const getSuggestion = useCallback(async (itemName: string, retailerId: string) => {
    if (!itemName.trim() || itemName.length < 2) {
      setSuggestion(null)
      return
    }
    
    // Clear existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // Debounce the API call by 300ms
    debounceRef.current = setTimeout(async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const result = await priceIntelligenceService.getPriceSuggestion(itemName, retailerId)
        
        if (result.success && result.data.estimated) {
          const formattedSuggestion = formatSuggestion(result.data)
          setSuggestion(formattedSuggestion)
        } else {
          setSuggestion(null)
          if (!result.success) {
            setError(result.error)
          }
        }
      } catch (err) {
        setError('Failed to get price suggestion')
        setSuggestion(null)
      } finally {
        setIsLoading(false)
      }
    }, 300)
  }, [formatSuggestion])
  
  const clearSuggestion = useCallback(() => {
    setSuggestion(null)
    setError(null)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
  }, [])
  
  const getHighConfidenceSuggestion = useCallback(async (
    itemName: string, 
    retailerId: string
  ): Promise<FormattedSuggestion | null> => {
    try {
      const result = await priceIntelligenceService.getPriceSuggestion(itemName, retailerId)
      
      if (result.success && result.data.estimated) {
        // Only auto-populate if confidence is high
        if (result.data.confidence === 'high') {
          return formatSuggestion(result.data)
        }
      }
      
      return null
    } catch (err) {
      console.error('Failed to get high confidence suggestion:', err)
      return null
    }
  }, [formatSuggestion])
  
  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])
  
  return {
    suggestion,
    isLoading,
    error,
    getSuggestion,
    clearSuggestion,
    getHighConfidenceSuggestion
  }
}