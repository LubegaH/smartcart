import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility functions for SmartCart
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export function getBudgetStatus(spent: number, budget: number): 'good' | 'warning' | 'over' {
  const percentage = (spent / budget) * 100
  if (percentage >= 100) return 'over'
  if (percentage >= 85) return 'warning'
  return 'good'
}

// Fuzzy matching for item names
export function fuzzyMatch(query: string, target: string): number {
  const queryLower = query.toLowerCase().trim()
  const targetLower = target.toLowerCase().trim()
  
  if (queryLower === targetLower) return 1
  if (targetLower.includes(queryLower)) return 0.8
  
  // Simple character-based similarity
  const longer = queryLower.length > targetLower.length ? queryLower : targetLower
  const shorter = queryLower.length > targetLower.length ? targetLower : queryLower
  
  if (longer.length === 0) return 1
  
  const matches = shorter.split('').filter(char => longer.includes(char)).length
  return matches / longer.length
}

// Generate trip name from retailer and date
export function generateTripName(retailerName: string, date: string): string {
  const formattedDate = formatDate(date)
  return `${retailerName} - ${formattedDate}`
}