// Navigation context utilities for shopping session management
import { shoppingSessionService } from './shopping-session'
import { dataService } from './data'
import type { ShoppingTrip, NavigationContext } from './shopping-session'

export interface NavigationHelpers {
  isInActiveShoppingMode: () => Promise<boolean>
  getCurrentShoppingTrip: () => Promise<ShoppingTrip | null>
  startShopping: (tripId: string) => Promise<boolean>
  exitShopping: () => Promise<void>
  updateProgress: (tripId: string) => Promise<void>
  handlePageNavigation: (page: NavigationContext['currentPage'], context?: Partial<NavigationContext>) => Promise<void>
  getShoppingContext: () => Promise<NavigationContext | null>
  shouldShowShoppingNavigation: () => Promise<boolean>
}

/**
 * Navigation context service for shopping session management
 * Provides easy-to-use utilities for the frontend components
 */
export const navigationContext: NavigationHelpers = {
  /**
   * Check if user is currently in Active Shopping Mode
   * This is the main utility the frontend will use to determine navigation behavior
   */
  async isInActiveShoppingMode(): Promise<boolean> {
    return await shoppingSessionService.isInActiveShoppingMode()
  },

  /**
   * Get current shopping trip if in shopping mode
   */
  async getCurrentShoppingTrip(): Promise<ShoppingTrip | null> {
    try {
      const sessionResult = await shoppingSessionService.getCurrentSession()
      if (sessionResult.success && sessionResult.data) {
        return sessionResult.data.trip
      }
      return null
    } catch (error) {
      return null
    }
  },

  /**
   * Start shopping session and update trip status
   */
  async startShopping(tripId: string): Promise<boolean> {
    try {
      // Start the session
      const sessionResult = await shoppingSessionService.startSession(tripId)
      
      if (sessionResult.success) {
        // Update trip status to active
        const statusResult = await dataService.trips.updateStatus(tripId, 'active')
        
        if (!statusResult.success) {
          // If we can't set trip to active, end the session
          await shoppingSessionService.endSession()
          return false
        }
        
        return true
      }
      
      return false
    } catch (error) {
      return false
    }
  },

  /**
   * Exit shopping mode and clean up
   */
  async exitShopping(): Promise<void> {
    try {
      const tripId = await shoppingSessionService.getActiveShoppingTripId()
      
      // End the session first
      await shoppingSessionService.endSession()
      
      // If we have a trip ID, update its status
      if (tripId) {
        // Set trip back to planned if not completed
        const tripResult = await dataService.trips.getById(tripId)
        if (tripResult.success && tripResult.data.status === 'active') {
          await dataService.trips.updateStatus(tripId, 'planned')
        }
      }
    } catch (error) {
      // Silent failure for cleanup
    }
  },

  /**
   * Update progress when items change during shopping
   */
  async updateProgress(tripId: string): Promise<void> {
    try {
      await shoppingSessionService.updateTripProgress(tripId)
    } catch (error) {
      // Silent failure for progress updates
    }
  },

  /**
   * Handle navigation between pages during shopping
   */
  async handlePageNavigation(
    page: NavigationContext['currentPage'], 
    context?: Partial<NavigationContext>
  ): Promise<void> {
    try {
      const isInShopping = await this.isInActiveShoppingMode()
      
      if (isInShopping) {
        const currentContext = await shoppingSessionService.getNavigationContext()
        
        await shoppingSessionService.updateNavigationContext({
          previousPage: currentContext?.currentPage,
          currentPage: page,
          ...context
        })
      }
    } catch (error) {
      // Silent failure for navigation tracking
    }
  },

  /**
   * Get current shopping context for UI state
   */
  async getShoppingContext(): Promise<NavigationContext | null> {
    return await shoppingSessionService.getNavigationContext()
  },

  /**
   * Determine if shopping-specific navigation should be shown
   */
  async shouldShowShoppingNavigation(): Promise<boolean> {
    try {
      const context = await this.getShoppingContext()
      return context !== null && 
             context.isInShoppingMode && 
             (context.currentPage === 'shopping-mode' || context.currentPage === 'trip-details')
    } catch (error) {
      return false
    }
  }
}

/**
 * React hook helpers for shopping session management
 * These can be used directly in React components
 */
export const useShoppingSession = () => {
  return {
    navigationContext,
    
    // Additional helper methods for React components
    async withShoppingCheck<T>(
      callback: () => Promise<T>, 
      fallback: () => T
    ): Promise<T> {
      const isInShopping = await navigationContext.isInActiveShoppingMode()
      if (isInShopping) {
        return await callback()
      } else {
        return fallback()
      }
    },

    async handleItemUpdate(tripId: string, itemId: string): Promise<void> {
      await navigationContext.updateProgress(tripId)
      await navigationContext.handlePageNavigation('shopping-mode', {
        lastViewedItemId: itemId,
        hasUnsavedChanges: false
      })
    },

    async handleTripCompletion(tripId: string): Promise<void> {
      await navigationContext.exitShopping()
    }
  }
}

/**
 * Initialize shopping session on app startup
 * Should be called in the main app component or layout
 */
export const initializeShoppingSession = async (): Promise<void> => {
  try {
    // Handle page reload scenario
    const reloadResult = await shoppingSessionService.handlePageReload()
    
    if (reloadResult.success && reloadResult.data) {
      // We recovered an active session
      console.log('Recovered shopping session:', reloadResult.data.tripId)
    }
    
    // Sync any pending changes if we're back online
    if (navigator.onLine) {
      const needsSync = await shoppingSessionService.needsSync()
      if (needsSync) {
        // Trigger sync through the existing data service
        await dataService.sync.syncPendingChanges()
      }
    }
  } catch (error) {
    // Silent failure for initialization
    console.warn('Failed to initialize shopping session:', error)
  }
}

/**
 * Shopping session event emitter for reactive UI updates
 * Components can listen to these events for real-time updates
 */
export class ShoppingSessionEvents extends EventTarget {
  // Event types
  static readonly EVENTS = {
    SESSION_STARTED: 'session-started',
    SESSION_ENDED: 'session-ended',
    PROGRESS_UPDATED: 'progress-updated',
    NAVIGATION_CHANGED: 'navigation-changed'
  } as const

  emitSessionStarted(tripId: string) {
    this.dispatchEvent(new CustomEvent(ShoppingSessionEvents.EVENTS.SESSION_STARTED, {
      detail: { tripId }
    }))
  }

  emitSessionEnded(tripId: string) {
    this.dispatchEvent(new CustomEvent(ShoppingSessionEvents.EVENTS.SESSION_ENDED, {
      detail: { tripId }
    }))
  }

  emitProgressUpdated(tripId: string, progress: NavigationContext['tripProgress']) {
    this.dispatchEvent(new CustomEvent(ShoppingSessionEvents.EVENTS.PROGRESS_UPDATED, {
      detail: { tripId, progress }
    }))
  }

  emitNavigationChanged(context: NavigationContext) {
    this.dispatchEvent(new CustomEvent(ShoppingSessionEvents.EVENTS.NAVIGATION_CHANGED, {
      detail: { context }
    }))
  }
}

// Global event emitter instance
export const shoppingEvents = new ShoppingSessionEvents()

// Integrate events with the shopping session service
if (typeof window !== 'undefined') {
  // Extend the existing service with event emission
  const originalStartSession = shoppingSessionService.startSession
  const originalEndSession = shoppingSessionService.endSession
  const originalUpdateProgress = shoppingSessionService.updateTripProgress
  const originalUpdateNavigation = shoppingSessionService.updateNavigationContext

  shoppingSessionService.startSession = async function(tripId: string) {
    const result = await originalStartSession.call(this, tripId)
    if (result.success) {
      shoppingEvents.emitSessionStarted(tripId)
    }
    return result
  }

  shoppingSessionService.endSession = async function() {
    const session = await shoppingSessionService.getCurrentSession()
    const tripId = session.success && session.data ? session.data.tripId : null
    
    const result = await originalEndSession.call(this)
    if (result.success && tripId) {
      shoppingEvents.emitSessionEnded(tripId)
    }
    return result
  }

  shoppingSessionService.updateTripProgress = async function(tripId: string) {
    const result = await originalUpdateProgress.call(this, tripId)
    if (result.success) {
      const context = await shoppingSessionService.getNavigationContext()
      if (context) {
        shoppingEvents.emitProgressUpdated(tripId, context.tripProgress)
      }
    }
    return result
  }

  shoppingSessionService.updateNavigationContext = async function(updates) {
    const result = await originalUpdateNavigation.call(this, updates)
    if (result.success) {
      const context = await shoppingSessionService.getNavigationContext()
      if (context) {
        shoppingEvents.emitNavigationChanged(context)
      }
    }
    return result
  }
}