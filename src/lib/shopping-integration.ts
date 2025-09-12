// Integration utilities for existing shopping components
// This file provides minimal changes to integrate shopping session management

import { dataService } from './data'
import type { ShoppingTrip, TripItem } from '@/types'

/**
 * Enhanced trip item handlers that integrate with shopping session
 */
export const createShoppingHandlers = (tripId: string) => {
  
  /**
   * Handle item completion with session-aware progress tracking
   */
  const handleToggleComplete = async (item: TripItem, originalHandler: (item: TripItem) => Promise<void>) => {
    // Call the original handler first
    await originalHandler(item)
    
    // Update shopping session progress if in active mode
    const isInShopping = await dataService.shopping.isInActiveShoppingMode()
    if (isInShopping) {
      await dataService.shopping.updateProgress(tripId)
      await dataService.shopping.handlePageNavigation('shopping-mode', {
        lastViewedItemId: item.id,
        hasUnsavedChanges: false
      })
    }
  }

  /**
   * Handle price updates with session context
   */
  const handleUpdatePrice = async (
    item: TripItem, 
    actualPrice: number, 
    originalHandler: (item: TripItem, price: number) => Promise<void>
  ) => {
    // Call the original handler first
    await originalHandler(item, actualPrice)
    
    // Update shopping session progress if in active mode
    const isInShopping = await dataService.shopping.isInActiveShoppingMode()
    if (isInShopping) {
      await dataService.shopping.updateProgress(tripId)
      await dataService.shopping.handlePageNavigation('shopping-mode', {
        lastViewedItemId: item.id,
        hasUnsavedChanges: false
      })
    }
  }

  /**
   * Handle trip completion with session cleanup
   */
  const handleTripCompletion = async (
    trip: ShoppingTrip,
    actualTotal: number,
    originalHandler: () => Promise<void>
  ) => {
    // Call the original completion logic first
    await originalHandler()
    
    // Clean up shopping session
    const isInShopping = await dataService.shopping.isInActiveShoppingMode()
    if (isInShopping) {
      await dataService.shopping.exitShopping()
    }
  }

  /**
   * Initialize shopping session when entering shopping mode
   */
  const initializeShoppingMode = async () => {
    const isInShopping = await dataService.shopping.isInActiveShoppingMode()
    
    if (!isInShopping) {
      const success = await dataService.shopping.startShopping(tripId)
      if (success) {
        await dataService.shopping.handlePageNavigation('shopping-mode')
      }
      return success
    }
    
    // Already in shopping mode, just update navigation
    await dataService.shopping.handlePageNavigation('shopping-mode')
    return true
  }

  /**
   * Handle page navigation away from shopping mode
   */
  const handleNavigateAway = async (targetPath: string) => {
    const context = await dataService.shopping.getShoppingContext()
    
    if (context && context.hasUnsavedChanges) {
      // Could show a confirmation dialog here
      console.warn('Navigating away with unsaved changes')
    }
    
    // Update navigation context if still in shopping mode
    const isInShopping = await dataService.shopping.isInActiveShoppingMode()
    if (isInShopping) {
      // Determine the target page type
      let targetPage: 'trip-details' | 'shopping-mode' | 'add-item' | 'edit-item' = 'shopping-mode'
      
      if (targetPath.includes('/trips/') && !targetPath.includes('/shopping')) {
        targetPage = 'trip-details'
      } else if (targetPath.includes('/add')) {
        targetPage = 'add-item'
      } else if (targetPath.includes('/edit')) {
        targetPage = 'edit-item'
      }
      
      await dataService.shopping.handlePageNavigation(targetPage)
    }
  }

  return {
    handleToggleComplete,
    handleUpdatePrice,
    handleTripCompletion,
    initializeShoppingMode,
    handleNavigateAway
  }
}

/**
 * Utility to check if shopping context should be shown
 */
export const shouldShowShoppingContext = async (): Promise<boolean> => {
  return await dataService.shopping.shouldShowShoppingNavigation()
}

/**
 * Get current shopping progress for UI display
 */
export const getShoppingProgress = async (): Promise<{
  totalItems: number
  completedItems: number
  percentage: number
} | null> => {
  const context = await dataService.shopping.getShoppingContext()
  return context ? context.tripProgress : null
}

/**
 * Minimal integration for existing shopping page component
 * 
 * Usage in existing component:
 * 
 * ```typescript
 * import { createShoppingHandlers } from '@/lib/shopping-integration'
 * 
 * export default function ShoppingModePage() {
 *   const tripId = params.id as string
 *   const shoppingHandlers = createShoppingHandlers(tripId)
 *   
 *   useEffect(() => {
 *     shoppingHandlers.initializeShoppingMode()
 *   }, [tripId])
 *   
 *   const handleToggleComplete = async (item: TripItem) => {
 *     await shoppingHandlers.handleToggleComplete(item, async (item) => {
 *       // Original toggle logic here
 *       const result = await dataService.tripItems.update(item.id, { 
 *         is_completed: !item.is_completed 
 *       });
 *       
 *       if (result.success) {
 *         setItems(prev => prev.map(i => 
 *           i.id === item.id ? { ...i, is_completed: !item.is_completed } : i
 *         ));
 *       }
 *     })
 *   }
 * }
 * ```
 */

/**
 * Shopping session status utility for debugging/monitoring
 */
export const getShoppingSessionStatus = async () => {
  const isInShopping = await dataService.shopping.isInActiveShoppingMode()
  const context = await dataService.shopping.getShoppingContext()
  const currentTrip = await dataService.shopping.getCurrentShoppingTrip()
  
  return {
    isInShoppingMode: isInShopping,
    navigationContext: context,
    currentTrip: currentTrip ? {
      id: currentTrip.id,
      name: currentTrip.name,
      status: currentTrip.status
    } : null,
    timestamp: new Date().toISOString()
  }
}

/**
 * Force exit shopping session (for admin/debug purposes)
 */
export const forceExitShoppingSession = async () => {
  await dataService.shopping.exitShopping()
}