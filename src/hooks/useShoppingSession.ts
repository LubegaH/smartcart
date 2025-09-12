// React hooks for shopping session management
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { dataService } from '@/lib/data'
import { shoppingEvents, ShoppingSessionEvents } from '@/lib/navigation-context'
import type { 
  ShoppingSession, 
  NavigationContext 
} from '@/lib/shopping-session'
import type { ShoppingTrip } from '@/types'

export interface UseShoppingSessionReturn {
  // Session state
  isInShoppingMode: boolean
  currentSession: ShoppingSession | null
  navigationContext: NavigationContext | null
  isLoading: boolean
  
  // Session actions
  startShopping: (tripId: string) => Promise<boolean>
  exitShopping: () => Promise<void>
  updateProgress: (tripId: string) => Promise<void>
  
  // Navigation actions
  navigateToPage: (page: NavigationContext['currentPage'], context?: Partial<NavigationContext>) => Promise<void>
  markUnsavedChanges: (hasChanges: boolean) => Promise<void>
  
  // Utilities
  shouldShowShoppingNavigation: boolean
  canExitShopping: boolean
  sessionDuration: number // minutes
}

/**
 * Custom hook for managing shopping session state in React components
 */
export const useShoppingSession = (): UseShoppingSessionReturn => {
  const router = useRouter()
  const pathname = usePathname()
  
  // State
  const [isInShoppingMode, setIsInShoppingMode] = useState(false)
  const [currentSession, setCurrentSession] = useState<ShoppingSession | null>(null)
  const [navigationContext, setNavigationContext] = useState<NavigationContext | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize session state
  const initializeSession = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const isActive = await dataService.shopping.isInActiveShoppingMode()
      setIsInShoppingMode(isActive)
      
      if (isActive) {
        const session = await dataService.shopping.getCurrentShoppingTrip()
        setCurrentSession(session as ShoppingSession | null)
        
        const context = await dataService.shopping.getShoppingContext()
        setNavigationContext(context)
      } else {
        setCurrentSession(null)
        setNavigationContext(null)
      }
    } catch (error) {
      console.error('Failed to initialize shopping session:', error)
      setIsInShoppingMode(false)
      setCurrentSession(null)
      setNavigationContext(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load initial state
  useEffect(() => {
    initializeSession()
  }, [initializeSession])

  // Listen to shopping session events
  useEffect(() => {
    const handleSessionStarted = (event: CustomEvent) => {
      setIsInShoppingMode(true)
      initializeSession() // Refresh session data
    }

    const handleSessionEnded = (event: CustomEvent) => {
      setIsInShoppingMode(false)
      setCurrentSession(null)
      setNavigationContext(null)
    }

    const handleProgressUpdated = (event: CustomEvent) => {
      const { progress } = event.detail
      setNavigationContext(prev => prev ? {
        ...prev,
        tripProgress: progress
      } : null)
    }

    const handleNavigationChanged = (event: CustomEvent) => {
      const { context } = event.detail
      setNavigationContext(context)
    }

    // Add event listeners
    shoppingEvents.addEventListener(ShoppingSessionEvents.EVENTS.SESSION_STARTED, handleSessionStarted)
    shoppingEvents.addEventListener(ShoppingSessionEvents.EVENTS.SESSION_ENDED, handleSessionEnded)
    shoppingEvents.addEventListener(ShoppingSessionEvents.EVENTS.PROGRESS_UPDATED, handleProgressUpdated)
    shoppingEvents.addEventListener(ShoppingSessionEvents.EVENTS.NAVIGATION_CHANGED, handleNavigationChanged)

    return () => {
      shoppingEvents.removeEventListener(ShoppingSessionEvents.EVENTS.SESSION_STARTED, handleSessionStarted)
      shoppingEvents.removeEventListener(ShoppingSessionEvents.EVENTS.SESSION_ENDED, handleSessionEnded)
      shoppingEvents.removeEventListener(ShoppingSessionEvents.EVENTS.PROGRESS_UPDATED, handleProgressUpdated)
      shoppingEvents.removeEventListener(ShoppingSessionEvents.EVENTS.NAVIGATION_CHANGED, handleNavigationChanged)
    }
  }, [initializeSession])

  // Actions
  const startShopping = useCallback(async (tripId: string): Promise<boolean> => {
    try {
      const success = await dataService.shopping.startShopping(tripId)
      if (success) {
        await initializeSession()
      }
      return success
    } catch (error) {
      console.error('Failed to start shopping:', error)
      return false
    }
  }, [initializeSession])

  const exitShopping = useCallback(async (): Promise<void> => {
    try {
      await dataService.shopping.exitShopping()
      // The event listener will handle state updates
    } catch (error) {
      console.error('Failed to exit shopping:', error)
    }
  }, [])

  const updateProgress = useCallback(async (tripId: string): Promise<void> => {
    try {
      await dataService.shopping.updateProgress(tripId)
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }, [])

  const navigateToPage = useCallback(async (
    page: NavigationContext['currentPage'],
    context?: Partial<NavigationContext>
  ): Promise<void> => {
    try {
      await dataService.shopping.handlePageNavigation(page, context)
    } catch (error) {
      console.error('Failed to update navigation:', error)
    }
  }, [])

  const markUnsavedChanges = useCallback(async (hasChanges: boolean): Promise<void> => {
    try {
      await navigateToPage(navigationContext?.currentPage || 'shopping-mode', {
        hasUnsavedChanges: hasChanges
      })
    } catch (error) {
      console.error('Failed to mark unsaved changes:', error)
    }
  }, [navigateToPage, navigationContext])

  // Computed properties
  const shouldShowShoppingNavigation = useMemo(() => {
    return isInShoppingMode && navigationContext !== null && (
      navigationContext.currentPage === 'shopping-mode' ||
      navigationContext.currentPage === 'trip-details'
    )
  }, [isInShoppingMode, navigationContext])

  const canExitShopping = useMemo(() => {
    return isInShoppingMode && (!navigationContext?.hasUnsavedChanges || false)
  }, [isInShoppingMode, navigationContext])

  const sessionDuration = useMemo(() => {
    if (!currentSession) return 0
    const now = new Date()
    const start = new Date(currentSession.startTime)
    return Math.round((now.getTime() - start.getTime()) / (1000 * 60))
  }, [currentSession])

  return {
    // State
    isInShoppingMode,
    currentSession,
    navigationContext,
    isLoading,
    
    // Actions
    startShopping,
    exitShopping,
    updateProgress,
    
    // Navigation
    navigateToPage,
    markUnsavedChanges,
    
    // Computed
    shouldShowShoppingNavigation,
    canExitShopping,
    sessionDuration
  }
}

/**
 * Hook specifically for shopping mode page components
 */
export const useShoppingMode = (tripId: string) => {
  const session = useShoppingSession()
  const [trip, setTrip] = useState<ShoppingTrip | null>(null)

  useEffect(() => {
    if (session.currentSession?.tripId === tripId) {
      setTrip(session.currentSession.trip)
    }
  }, [session.currentSession, tripId])

  // Auto-start session when component mounts if not already active
  useEffect(() => {
    const autoStartSession = async () => {
      if (!session.isInShoppingMode && tripId && !session.isLoading) {
        const success = await session.startShopping(tripId)
        if (success) {
          await session.navigateToPage('shopping-mode')
        }
      }
    }

    autoStartSession()
  }, [tripId, session.isInShoppingMode, session.isLoading, session.startShopping, session.navigateToPage])

  // Update navigation context when page is active
  useEffect(() => {
    if (session.isInShoppingMode) {
      session.navigateToPage('shopping-mode')
    }
  }, [session.isInShoppingMode, session.navigateToPage])

  // Handle item completion with progress update
  const handleItemToggle = useCallback(async (itemId: string) => {
    if (tripId) {
      await session.updateProgress(tripId)
      await session.navigateToPage('shopping-mode', {
        lastViewedItemId: itemId
      })
    }
  }, [tripId, session])

  // Handle price updates
  const handlePriceUpdate = useCallback(async (itemId: string) => {
    if (tripId) {
      await session.updateProgress(tripId)
      await session.markUnsavedChanges(false) // Price update is saved immediately
      await session.navigateToPage('shopping-mode', {
        lastViewedItemId: itemId
      })
    }
  }, [tripId, session])

  // Handle trip completion
  const handleTripCompletion = useCallback(async () => {
    await session.exitShopping()
  }, [session])

  return {
    ...session,
    trip,
    
    // Shopping-specific actions
    handleItemToggle,
    handlePriceUpdate,
    handleTripCompletion,
    
    // Computed for shopping mode
    isCurrentTrip: session.currentSession?.tripId === tripId,
    tripProgress: session.navigationContext?.tripProgress || {
      totalItems: 0,
      completedItems: 0,
      percentage: 0
    }
  }
}

/**
 * Hook for components that need to show shopping-aware navigation
 */
export const useShoppingNavigation = () => {
  const session = useShoppingSession()
  const router = useRouter()
  const pathname = usePathname()

  // Determine if current route is shopping-related
  const isShoppingRoute = useMemo(() => {
    return pathname.includes('/shopping') || pathname.includes('/trips/')
  }, [pathname])

  // Navigation handlers that respect shopping context
  const navigateWithContext = useCallback(async (path: string) => {
    if (session.isInShoppingMode && session.navigationContext?.hasUnsavedChanges) {
      // Show confirmation dialog for unsaved changes
      const shouldProceed = confirm(
        'You have unsaved changes in your shopping session. Do you want to continue?'
      )
      
      if (!shouldProceed) {
        return false
      }
    }

    router.push(path)
    return true
  }, [session.isInShoppingMode, session.navigationContext, router])

  // Back button handler for shopping context
  const handleBackNavigation = useCallback(async () => {
    if (!session.isInShoppingMode) {
      router.back()
      return
    }

    const context = session.navigationContext
    if (context?.previousPage) {
      // Navigate to previous page in shopping context
      switch (context.previousPage) {
        case 'trip-details':
          router.push(`/trips/${session.currentSession?.tripId}`)
          break
        case 'shopping-mode':
          router.push(`/trips/${session.currentSession?.tripId}/shopping`)
          break
        default:
          router.back()
      }
    } else {
      // Default back behavior
      router.back()
    }
  }, [session, router])

  return {
    isInShoppingMode: session.isInShoppingMode,
    shouldShowShoppingNavigation: session.shouldShowShoppingNavigation,
    canExitShopping: session.canExitShopping,
    isShoppingRoute,
    
    navigateWithContext,
    handleBackNavigation,
    exitShopping: session.exitShopping,
    
    // Current shopping context
    currentTrip: session.currentSession?.trip || null,
    sessionDuration: session.sessionDuration
  }
}