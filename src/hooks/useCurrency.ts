import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/lib/utils'
import type { Currency } from '@/types'

/**
 * Hook to get the user's preferred currency and currency formatting functions
 * This ensures consistent currency usage throughout the application
 */
export function useCurrency() {
  const { profile } = useAuthStore()
  
  // Get user's preferred currency, fallback to USD if not set
  const currency: Currency = profile?.preferences?.default_currency || 'USD'
  
  // Get currency symbol for display
  const getCurrencySymbol = (curr?: Currency): string => {
    const targetCurrency = curr || currency
    switch (targetCurrency) {
      case 'USD': 
      case 'CAD': 
        return '$'
      case 'EUR': 
        return '€'
      case 'GBP': 
        return '£'
      case 'UGX': 
        return 'USh'
      default: 
        return '$'
    }
  }
  
  // Format amount using user's preferred currency
  const formatAmount = (amount: number, options?: { 
    currency?: Currency
    showSymbol?: boolean 
  }): string => {
    const targetCurrency = options?.currency || currency
    
    if (options?.showSymbol === false) {
      // Return just the number formatted according to currency rules
      if (targetCurrency === 'UGX') {
        return new Intl.NumberFormat('en-UG', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount)
      } else {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount)
      }
    }
    
    // Use the centralized formatCurrency utility
    return formatCurrency(amount, targetCurrency)
  }
  
  // Check if currency uses decimals
  const hasDecimals = (curr?: Currency): boolean => {
    const targetCurrency = curr || currency
    return targetCurrency !== 'UGX' // UGX doesn't use decimal places
  }
  
  // Get appropriate input step for number inputs
  const getInputStep = (curr?: Currency): string => {
    const targetCurrency = curr || currency
    return targetCurrency === 'UGX' ? '1' : '0.01'
  }
  
  return {
    currency,
    getCurrencySymbol,
    formatAmount,
    hasDecimals,
    getInputStep,
    // Convenience methods
    symbol: getCurrencySymbol(),
    step: getInputStep(),
    decimals: hasDecimals()
  }
}