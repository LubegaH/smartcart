// Shopping session management service for context-aware navigation
import { offlineStorage } from './offline-storage'
import { supabase } from './supabase'
import { 
  navigationContextSchema, 
  shoppingSessionSchema, 
  updateNavigationContextRequestSchema,
  startSessionRequestSchema 
} from './validations'
import type { ShoppingTrip, TripItem, Result } from '@/types'

// Session storage keys
const SESSION_KEYS = {
  currentSession: 'current_shopping_session',
  navigationState: 'navigation_state',
  sessionStartTime: 'session_start_time',
  lastActivity: 'last_activity'
}

export interface ShoppingSession {
  tripId: string
  trip: ShoppingTrip
  startTime: Date
  lastActivity: Date
  navigationContext: NavigationContext
  isActive: boolean
}

export interface NavigationContext {
  currentPage: 'trip-details' | 'shopping-mode' | 'add-item' | 'edit-item'
  previousPage?: string
  tripProgress: {
    totalItems: number
    completedItems: number
    percentage: number
  }
  lastViewedItemId?: string
  isInShoppingMode: boolean
  hasUnsavedChanges: boolean
}

export interface SessionPersistenceOptions {
  persistAcrossRefresh: boolean
  maxIdleTime: number // minutes
  cleanupInterval: number // minutes
}

const DEFAULT_OPTIONS: SessionPersistenceOptions = {
  persistAcrossRefresh: true,
  maxIdleTime: 60, // 60 minutes
  cleanupInterval: 5 // 5 minutes
}

export const shoppingSessionService = {
  /**
   * Start a new shopping session when user enters Active Shopping Mode
   */
  async startSession(tripId: string): Promise<Result<ShoppingSession>> {
    try {
      // Validate input
      const validationResult = startSessionRequestSchema.safeParse({ tripId })
      if (!validationResult.success) {
        return { success: false, error: 'Invalid trip ID format' }
      }

      // Get trip data first
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // First try to get trip from online source, fallback to cache
      let trip: ShoppingTrip | null = null
      
      if (navigator.onLine) {
        const { data: onlineTrip, error } = await supabase
          .from('shopping_trips')
          .select(`
            *,
            retailer:retailers(*),
            items:trip_items(*)
          `)
          .eq('id', tripId)
          .eq('user_id', user.id)
          .single()
          
        if (!error && onlineTrip) {
          trip = onlineTrip
        }
      }

      // Fallback to offline storage
      if (!trip) {
        const cachedTrips = await offlineStorage.getItem('trips') || []
        trip = cachedTrips.find((t: ShoppingTrip) => t.id === tripId)
      }

      if (!trip) {
        return { success: false, error: 'Trip not found' }
      }

      // Calculate progress
      const items = trip.items || []
      const completedItems = items.filter((item: TripItem) => item.is_completed).length
      const progress = items.length > 0 ? Math.round((completedItems / items.length) * 100) : 0

      const now = new Date()
      const session: ShoppingSession = {
        tripId,
        trip,
        startTime: now,
        lastActivity: now,
        navigationContext: {
          currentPage: 'shopping-mode',
          tripProgress: {
            totalItems: items.length,
            completedItems,
            percentage: progress
          },
          isInShoppingMode: true,
          hasUnsavedChanges: false
        },
        isActive: true
      }

      // Validate session before storing
      const sessionValidation = shoppingSessionSchema.safeParse(session)
      if (!sessionValidation.success) {
        return { success: false, error: 'Invalid session data created' }
      }

      // Persist session
      await offlineStorage.setItem(SESSION_KEYS.currentSession, 'shopping_session', sessionValidation.data)
      await offlineStorage.setItem(SESSION_KEYS.sessionStartTime, 'timestamp', now.getTime())
      await this.updateActivity()

      return { success: true, data: sessionValidation.data }
    } catch (error) {
      return { success: false, error: 'Failed to start shopping session' }
    }
  },

  /**
   * Get current active shopping session
   */
  async getCurrentSession(): Promise<Result<ShoppingSession | null>> {
    try {
      const session = await offlineStorage.getItem(SESSION_KEYS.currentSession)
      
      if (!session) {
        return { success: true, data: null }
      }

      // Check if session has expired
      const lastActivity = new Date(session.lastActivity)
      const now = new Date()
      const idleMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60)

      if (idleMinutes > DEFAULT_OPTIONS.maxIdleTime) {
        await this.endSession()
        return { success: true, data: null }
      }

      return { success: true, data: session }
    } catch (error) {
      return { success: false, error: 'Failed to get current session' }
    }
  },

  /**
   * Update navigation context during active shopping
   */
  async updateNavigationContext(updates: Partial<NavigationContext>): Promise<Result<void>> {
    try {
      // Validate input
      const validationResult = updateNavigationContextRequestSchema.safeParse(updates)
      if (!validationResult.success) {
        return { success: false, error: 'Invalid navigation context updates' }
      }

      const sessionResult = await this.getCurrentSession()
      if (!sessionResult.success || !sessionResult.data) {
        return { success: false, error: 'No active session found' }
      }

      const session = sessionResult.data
      const updatedContext = {
        ...session.navigationContext,
        ...validationResult.data
      }

      // Validate the complete navigation context
      const contextValidation = navigationContextSchema.safeParse(updatedContext)
      if (!contextValidation.success) {
        return { success: false, error: 'Invalid navigation context state' }
      }

      session.navigationContext = contextValidation.data
      session.lastActivity = new Date()

      // Validate complete session before storing
      const sessionValidation = shoppingSessionSchema.safeParse(session)
      if (!sessionValidation.success) {
        return { success: false, error: 'Invalid session state' }
      }

      await offlineStorage.setItem(SESSION_KEYS.currentSession, 'shopping_session', sessionValidation.data)
      await this.updateActivity()

      return { success: true, data: undefined }
    } catch (error) {
      return { success: false, error: 'Failed to update navigation context' }
    }
  },

  /**
   * Update trip progress in session
   */
  async updateTripProgress(tripId: string): Promise<Result<void>> {
    try {
      const sessionResult = await this.getCurrentSession()
      if (!sessionResult.success || !sessionResult.data) {
        return { success: true, data: undefined } // No session to update
      }

      const session = sessionResult.data
      if (session.tripId !== tripId) {
        return { success: true, data: undefined } // Different trip
      }

      // Get updated items from cache
      const items = await offlineStorage.getItem(`trip_items_${tripId}`) || []
      const completedItems = items.filter((item: TripItem) => item.is_completed).length
      const progress = items.length > 0 ? Math.round((completedItems / items.length) * 100) : 0

      await this.updateNavigationContext({
        tripProgress: {
          totalItems: items.length,
          completedItems,
          percentage: progress
        }
      })

      return { success: true, data: undefined }
    } catch (error) {
      return { success: false, error: 'Failed to update trip progress' }
    }
  },

  /**
   * Update last activity timestamp to prevent session timeout
   */
  async updateActivity(): Promise<void> {
    try {
      const now = new Date().getTime()
      await offlineStorage.setItem(SESSION_KEYS.lastActivity, 'timestamp', now)
    } catch (error) {
      // Silent fail - activity tracking is not critical
    }
  },

  /**
   * Check if user is currently in Active Shopping Mode
   */
  async isInActiveShoppingMode(): Promise<boolean> {
    try {
      const sessionResult = await this.getCurrentSession()
      return sessionResult.success && 
             sessionResult.data !== null && 
             sessionResult.data.isActive &&
             sessionResult.data.navigationContext.isInShoppingMode
    } catch (error) {
      return false
    }
  },

  /**
   * Get the active trip ID if in shopping mode
   */
  async getActiveShoppingTripId(): Promise<string | null> {
    try {
      const sessionResult = await this.getCurrentSession()
      if (sessionResult.success && sessionResult.data && sessionResult.data.isActive) {
        return sessionResult.data.tripId
      }
      return null
    } catch (error) {
      return null
    }
  },

  /**
   * End the current shopping session
   */
  async endSession(): Promise<Result<void>> {
    try {
      // Get current session to preserve some data
      const sessionResult = await this.getCurrentSession()
      
      if (sessionResult.success && sessionResult.data) {
        const session = sessionResult.data
        
        // Mark session as inactive
        session.isActive = false
        session.navigationContext.isInShoppingMode = false
        
        // Store completion time
        const completionData = {
          tripId: session.tripId,
          completedAt: new Date().toISOString(),
          duration: Date.now() - session.startTime.getTime(),
          finalProgress: session.navigationContext.tripProgress
        }
        
        // Store in history for analytics (optional)
        await offlineStorage.setItem(`session_history_${session.tripId}`, 'session_completion', completionData)
      }

      // Clear active session data
      await offlineStorage.removeItem(SESSION_KEYS.currentSession)
      await offlineStorage.removeItem(SESSION_KEYS.sessionStartTime)
      await offlineStorage.removeItem(SESSION_KEYS.lastActivity)
      await offlineStorage.removeItem(SESSION_KEYS.navigationState)

      return { success: true, data: undefined }
    } catch (error) {
      return { success: false, error: 'Failed to end session' }
    }
  },

  /**
   * Pause session (for background/minimize scenarios)
   */
  async pauseSession(): Promise<Result<void>> {
    try {
      const sessionResult = await this.getCurrentSession()
      if (!sessionResult.success || !sessionResult.data) {
        return { success: true, data: undefined }
      }

      await this.updateNavigationContext({
        hasUnsavedChanges: true, // Assume there might be unsaved changes
        previousPage: sessionResult.data.navigationContext.currentPage
      })

      return { success: true, data: undefined }
    } catch (error) {
      return { success: false, error: 'Failed to pause session' }
    }
  },

  /**
   * Resume session (for returning from background)
   */
  async resumeSession(): Promise<Result<ShoppingSession | null>> {
    try {
      const sessionResult = await this.getCurrentSession()
      if (!sessionResult.success || !sessionResult.data) {
        return { success: true, data: null }
      }

      // Update activity and ensure session is active
      await this.updateActivity()
      
      const session = sessionResult.data
      session.isActive = true
      session.lastActivity = new Date()

      await offlineStorage.setItem(SESSION_KEYS.currentSession, 'shopping_session', session)

      return { success: true, data: session }
    } catch (error) {
      return { success: false, error: 'Failed to resume session' }
    }
  },

  /**
   * Cleanup expired sessions (should be called periodically)
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const session = await offlineStorage.getItem(SESSION_KEYS.currentSession)
      if (!session) return

      const lastActivity = new Date(session.lastActivity)
      const now = new Date()
      const idleMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60)

      if (idleMinutes > DEFAULT_OPTIONS.maxIdleTime) {
        await this.endSession()
      }
    } catch (error) {
      // Silent cleanup failure
    }
  },

  /**
   * Get navigation context for UI state management
   */
  async getNavigationContext(): Promise<NavigationContext | null> {
    try {
      const sessionResult = await this.getCurrentSession()
      if (sessionResult.success && sessionResult.data) {
        return sessionResult.data.navigationContext
      }
      return null
    } catch (error) {
      return null
    }
  },

  /**
   * Handle browser refresh/reload scenarios
   */
  async handlePageReload(): Promise<Result<ShoppingSession | null>> {
    try {
      // Check if there was an active session before reload
      const session = await offlineStorage.getItem(SESSION_KEYS.currentSession)
      
      if (!session) {
        return { success: true, data: null }
      }

      // Check if session is still valid
      const lastActivity = new Date(session.lastActivity)
      const now = new Date()
      const idleMinutes = (now.getTime() - lastActivity.getTime()) / (1000 * 60)

      if (idleMinutes > DEFAULT_OPTIONS.maxIdleTime) {
        await this.endSession()
        return { success: true, data: null }
      }

      // Mark that we recovered from a refresh
      await this.updateNavigationContext({
        hasUnsavedChanges: false, // Assume refresh cleared any unsaved state
        currentPage: 'shopping-mode' // Default to shopping mode after refresh
      })

      return { success: true, data: session }
    } catch (error) {
      return { success: false, error: 'Failed to handle page reload' }
    }
  },

  /**
   * Check if session needs sync (for when coming back online)
   */
  async needsSync(): Promise<boolean> {
    try {
      const sessionResult = await this.getCurrentSession()
      return sessionResult.success && 
             sessionResult.data !== null && 
             sessionResult.data.navigationContext.hasUnsavedChanges
    } catch (error) {
      return false
    }
  }
}

// Initialize session management on page load
if (typeof window !== 'undefined') {
  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      shoppingSessionService.pauseSession()
    } else {
      shoppingSessionService.resumeSession()
    }
  })

  // Handle page unload (browser close/tab close)
  window.addEventListener('beforeunload', () => {
    // Don't end session completely, just mark as potentially unsaved
    shoppingSessionService.updateNavigationContext({ hasUnsavedChanges: true })
  })

  // Handle page load (including refresh)
  window.addEventListener('load', () => {
    shoppingSessionService.handlePageReload()
  })

  // Periodic cleanup of expired sessions
  setInterval(() => {
    shoppingSessionService.cleanupExpiredSessions()
  }, DEFAULT_OPTIONS.cleanupInterval * 60 * 1000)
}