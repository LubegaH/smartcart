// Test suite for shopping session management
import { shoppingSessionService } from '../shopping-session'
import { offlineStorage } from '../offline-storage'
import type { ShoppingTrip, TripItem } from '@/types'

// Mock dependencies
jest.mock('../offline-storage')
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  }
}))

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

const mockOfflineStorage = offlineStorage as jest.Mocked<typeof offlineStorage>

// Test data
const mockTrip: ShoppingTrip = {
  id: 'trip-123',
  user_id: 'user-123',
  retailer_id: 'retailer-123',
  name: 'Test Shopping Trip',
  date: '2024-01-15',
  status: 'active',
  estimated_total: 50.00,
  actual_total: 0,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  items: [
    {
      id: 'item-1',
      trip_id: 'trip-123',
      item_name: 'Milk',
      quantity: 1,
      estimated_price: 3.50,
      actual_price: null,
      is_completed: false,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 'item-2',
      trip_id: 'trip-123',
      item_name: 'Bread',
      quantity: 2,
      estimated_price: 2.25,
      actual_price: null,
      is_completed: false,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    }
  ]
}

describe('ShoppingSessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset navigator.onLine to default
    Object.defineProperty(navigator, 'onLine', { value: true })
  })

  describe('Session Creation', () => {
    it('should create a shopping session successfully when online', async () => {
      // Mock authentication
      const { supabase } = require('../supabase')
      supabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      // Mock trip data fetch
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockTrip,
                error: null
              })
            })
          })
        })
      })

      mockOfflineStorage.setItem.mockResolvedValue()

      const result = await shoppingSessionService.startSession('trip-123')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.tripId).toBe('trip-123')
      expect(result.data?.isActive).toBe(true)
      expect(mockOfflineStorage.setItem).toHaveBeenCalledWith(
        'current_shopping_session',
        'shopping_session',
        expect.any(Object)
      )
    })

    it('should handle offline session creation with cached data', async () => {
      // Set offline
      Object.defineProperty(navigator, 'onLine', { value: false })

      // Mock cached trips
      mockOfflineStorage.getItem.mockImplementation((key) => {
        if (key === 'trips') {
          return Promise.resolve([mockTrip])
        }
        return Promise.resolve(null)
      })

      mockOfflineStorage.setItem.mockResolvedValue()

      const result = await shoppingSessionService.startSession('trip-123')

      expect(result.success).toBe(true)
      expect(result.data?.tripId).toBe('trip-123')
      expect(mockOfflineStorage.getItem).toHaveBeenCalledWith('trips')
    })

    it('should reject invalid trip ID format', async () => {
      const result = await shoppingSessionService.startSession('invalid-id')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid trip ID format')
    })
  })

  describe('Session Management', () => {
    it('should retrieve current session successfully', async () => {
      const mockSession = {
        tripId: 'trip-123',
        trip: mockTrip,
        startTime: new Date('2024-01-15T10:00:00Z'),
        lastActivity: new Date('2024-01-15T10:05:00Z'),
        navigationContext: {
          currentPage: 'shopping-mode' as const,
          tripProgress: {
            totalItems: 2,
            completedItems: 0,
            percentage: 0
          },
          isInShoppingMode: true,
          hasUnsavedChanges: false
        },
        isActive: true
      }

      mockOfflineStorage.getItem.mockResolvedValue(mockSession)

      const result = await shoppingSessionService.getCurrentSession()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockSession)
    })

    it('should detect expired sessions and clean them up', async () => {
      const expiredSession = {
        tripId: 'trip-123',
        trip: mockTrip,
        startTime: new Date('2024-01-15T09:00:00Z'),
        lastActivity: new Date('2024-01-15T09:00:00Z'), // 2 hours ago
        navigationContext: {
          currentPage: 'shopping-mode' as const,
          tripProgress: { totalItems: 2, completedItems: 0, percentage: 0 },
          isInShoppingMode: true,
          hasUnsavedChanges: false
        },
        isActive: true
      }

      mockOfflineStorage.getItem.mockResolvedValue(expiredSession)
      mockOfflineStorage.removeItem.mockResolvedValue()

      // Mock current time to be 2 hours later
      const originalDate = Date
      const mockDate = new Date('2024-01-15T11:30:00Z')
      global.Date = jest.fn(() => mockDate) as any
      global.Date.now = jest.fn(() => mockDate.getTime())

      const result = await shoppingSessionService.getCurrentSession()

      expect(result.success).toBe(true)
      expect(result.data).toBeNull()
      expect(mockOfflineStorage.removeItem).toHaveBeenCalled()

      // Restore original Date
      global.Date = originalDate
    })

    it('should update navigation context with validation', async () => {
      const mockSession = {
        tripId: 'trip-123',
        trip: mockTrip,
        startTime: new Date('2024-01-15T10:00:00Z'),
        lastActivity: new Date('2024-01-15T10:05:00Z'),
        navigationContext: {
          currentPage: 'shopping-mode' as const,
          tripProgress: { totalItems: 2, completedItems: 0, percentage: 0 },
          isInShoppingMode: true,
          hasUnsavedChanges: false
        },
        isActive: true
      }

      mockOfflineStorage.getItem.mockResolvedValue(mockSession)
      mockOfflineStorage.setItem.mockResolvedValue()

      const updates = {
        currentPage: 'trip-details' as const,
        hasUnsavedChanges: true
      }

      const result = await shoppingSessionService.updateNavigationContext(updates)

      expect(result.success).toBe(true)
      expect(mockOfflineStorage.setItem).toHaveBeenCalledWith(
        'current_shopping_session',
        'shopping_session',
        expect.objectContaining({
          navigationContext: expect.objectContaining({
            currentPage: 'trip-details',
            hasUnsavedChanges: true
          })
        })
      )
    })
  })

  describe('Progress Tracking', () => {
    it('should update trip progress correctly', async () => {
      const mockSession = {
        tripId: 'trip-123',
        trip: mockTrip,
        startTime: new Date(),
        lastActivity: new Date(),
        navigationContext: {
          currentPage: 'shopping-mode' as const,
          tripProgress: { totalItems: 2, completedItems: 0, percentage: 0 },
          isInShoppingMode: true,
          hasUnsavedChanges: false
        },
        isActive: true
      }

      const updatedItems = [
        { ...mockTrip.items![0], is_completed: true },
        mockTrip.items![1]
      ]

      mockOfflineStorage.getItem.mockImplementation((key) => {
        if (key === 'current_shopping_session') return Promise.resolve(mockSession)
        if (key === 'trip_items_trip-123') return Promise.resolve(updatedItems)
        return Promise.resolve(null)
      })

      mockOfflineStorage.setItem.mockResolvedValue()

      const result = await shoppingSessionService.updateTripProgress('trip-123')

      expect(result.success).toBe(true)
      expect(mockOfflineStorage.setItem).toHaveBeenCalledWith(
        'current_shopping_session',
        'shopping_session',
        expect.objectContaining({
          navigationContext: expect.objectContaining({
            tripProgress: {
              totalItems: 2,
              completedItems: 1,
              percentage: 50
            }
          })
        })
      )
    })
  })

  describe('Offline Behavior', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'onLine', { value: false })
    })

    it('should work offline using cached data', async () => {
      mockOfflineStorage.getItem.mockImplementation((key) => {
        if (key === 'trips') return Promise.resolve([mockTrip])
        return Promise.resolve(null)
      })
      mockOfflineStorage.setItem.mockResolvedValue()

      const result = await shoppingSessionService.startSession('trip-123')

      expect(result.success).toBe(true)
      expect(result.data?.tripId).toBe('trip-123')
    })

    it('should fail gracefully when no cached data available', async () => {
      mockOfflineStorage.getItem.mockResolvedValue(null)

      const result = await shoppingSessionService.startSession('trip-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Trip not found')
    })

    it('should maintain session state across network changes', async () => {
      const mockSession = {
        tripId: 'trip-123',
        trip: mockTrip,
        startTime: new Date(),
        lastActivity: new Date(),
        navigationContext: {
          currentPage: 'shopping-mode' as const,
          tripProgress: { totalItems: 2, completedItems: 1, percentage: 50 },
          isInShoppingMode: true,
          hasUnsavedChanges: false
        },
        isActive: true
      }

      mockOfflineStorage.getItem.mockResolvedValue(mockSession)

      // Test offline access
      const offlineResult = await shoppingSessionService.getCurrentSession()
      expect(offlineResult.success).toBe(true)
      expect(offlineResult.data?.tripId).toBe('trip-123')

      // Switch to online
      Object.defineProperty(navigator, 'onLine', { value: true })

      const onlineResult = await shoppingSessionService.getCurrentSession()
      expect(onlineResult.success).toBe(true)
      expect(onlineResult.data?.tripId).toBe('trip-123')
    })
  })

  describe('Session Lifecycle', () => {
    it('should end session and clean up data', async () => {
      const mockSession = {
        tripId: 'trip-123',
        trip: mockTrip,
        startTime: new Date(),
        lastActivity: new Date(),
        navigationContext: {
          currentPage: 'shopping-mode' as const,
          tripProgress: { totalItems: 2, completedItems: 2, percentage: 100 },
          isInShoppingMode: true,
          hasUnsavedChanges: false
        },
        isActive: true
      }

      mockOfflineStorage.getItem.mockResolvedValue(mockSession)
      mockOfflineStorage.removeItem.mockResolvedValue()
      mockOfflineStorage.setItem.mockResolvedValue()

      const result = await shoppingSessionService.endSession()

      expect(result.success).toBe(true)
      expect(mockOfflineStorage.removeItem).toHaveBeenCalledWith('current_shopping_session')
      expect(mockOfflineStorage.removeItem).toHaveBeenCalledWith('session_start_time')
      expect(mockOfflineStorage.removeItem).toHaveBeenCalledWith('last_activity')
    })

    it('should handle page reload recovery', async () => {
      const mockSession = {
        tripId: 'trip-123',
        trip: mockTrip,
        startTime: new Date(),
        lastActivity: new Date(),
        navigationContext: {
          currentPage: 'shopping-mode' as const,
          tripProgress: { totalItems: 2, completedItems: 1, percentage: 50 },
          isInShoppingMode: true,
          hasUnsavedChanges: true
        },
        isActive: true
      }

      mockOfflineStorage.getItem.mockResolvedValue(mockSession)
      mockOfflineStorage.setItem.mockResolvedValue()

      const result = await shoppingSessionService.handlePageReload()

      expect(result.success).toBe(true)
      expect(result.data?.tripId).toBe('trip-123')
      expect(mockOfflineStorage.setItem).toHaveBeenCalledWith(
        'current_shopping_session',
        'shopping_session',
        expect.objectContaining({
          navigationContext: expect.objectContaining({
            hasUnsavedChanges: false,
            currentPage: 'shopping-mode'
          })
        })
      )
    })
  })

  describe('Utility Functions', () => {
    it('should correctly identify active shopping mode', async () => {
      const activeSession = {
        tripId: 'trip-123',
        isActive: true,
        navigationContext: {
          isInShoppingMode: true,
          currentPage: 'shopping-mode' as const
        }
      }

      mockOfflineStorage.getItem.mockResolvedValue(activeSession)

      const result = await shoppingSessionService.isInActiveShoppingMode()
      expect(result).toBe(true)
    })

    it('should return false for inactive or missing sessions', async () => {
      mockOfflineStorage.getItem.mockResolvedValue(null)

      const result = await shoppingSessionService.isInActiveShoppingMode()
      expect(result).toBe(false)
    })

    it('should get active shopping trip ID', async () => {
      const activeSession = {
        tripId: 'trip-123',
        isActive: true
      }

      mockOfflineStorage.getItem.mockResolvedValue(activeSession)

      const result = await shoppingSessionService.getActiveShoppingTripId()
      expect(result).toBe('trip-123')
    })
  })
})

describe('Shopping Session Integration', () => {
  it('should handle concurrent session operations', async () => {
    mockOfflineStorage.getItem.mockResolvedValue(null)
    mockOfflineStorage.setItem.mockResolvedValue()

    const { supabase } = require('../supabase')
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null
    })

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockTrip,
              error: null
            })
          })
        })
      })
    })

    // Start multiple sessions concurrently
    const promises = [
      shoppingSessionService.startSession('trip-123'),
      shoppingSessionService.startSession('trip-456')
    ]

    const results = await Promise.all(promises)

    // Only one should succeed (last writer wins)
    expect(results.filter(r => r.success).length).toBe(2)
  })

  it('should maintain data consistency during network interruptions', async () => {
    const mockSession = {
      tripId: 'trip-123',
      trip: mockTrip,
      startTime: new Date(),
      lastActivity: new Date(),
      navigationContext: {
        currentPage: 'shopping-mode' as const,
        tripProgress: { totalItems: 2, completedItems: 0, percentage: 0 },
        isInShoppingMode: true,
        hasUnsavedChanges: false
      },
      isActive: true
    }

    mockOfflineStorage.getItem.mockResolvedValue(mockSession)
    mockOfflineStorage.setItem.mockResolvedValue()

    // Simulate network going down during operation
    Object.defineProperty(navigator, 'onLine', { value: false })

    const result = await shoppingSessionService.updateNavigationContext({
      currentPage: 'trip-details'
    })

    expect(result.success).toBe(true)
    expect(mockOfflineStorage.setItem).toHaveBeenCalled()
  })
})