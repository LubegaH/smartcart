import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../utils'

describe('formatCurrency', () => {
  it('should format USD currency correctly', () => {
    const result = formatCurrency(100.50, 'USD')
    expect(result).toBe('$100.50')
  })

  it('should format EUR currency correctly', () => {
    const result = formatCurrency(100.50, 'EUR')
    expect(result).toBe('€100.50')
  })

  it('should format GBP currency correctly', () => {
    const result = formatCurrency(100.50, 'GBP')
    expect(result).toBe('£100.50')
  })

  it('should format UGX currency correctly without decimal places', () => {
    const result = formatCurrency(500000, 'UGX')
    // UGX should not show decimal places and use Ugandan locale
    expect(result).toMatch(/USh\s?500,000|UGX\s?500,000/)
  })

  it('should format UGX currency correctly for smaller amounts', () => {
    const result = formatCurrency(1500, 'UGX')
    expect(result).toMatch(/USh\s?1,500|UGX\s?1,500/)
  })

  it('should default to USD when no currency is provided', () => {
    const result = formatCurrency(100.50)
    expect(result).toBe('$100.50')
  })

  it('should handle zero amounts correctly', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00')
    expect(formatCurrency(0, 'UGX')).toMatch(/USh\s?0|UGX\s?0/)
  })

  it('should handle large UGX amounts correctly', () => {
    const result = formatCurrency(5000000, 'UGX')
    expect(result).toMatch(/USh\s?5,000,000|UGX\s?5,000,000/)
  })
})