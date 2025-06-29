import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase first, before importing anything
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn()
  }
}))

import { tripService } from '../trips'
import { supabase } from '../supabase'

// Get the mocked supabase instance
const mockSupabase = vi.mocked(supabase)

describe('Trip Service', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  const mockTrip = {
    id: 'trip-123',
    user_id: 'user-123',
    retailer_id: 'retailer-123',
    name: 'Weekly Groceries',
    date: '2025-06-27',
    status: 'planned',
    estimated_total: 0,
    actual_total: 0,
    created_at: '2025-06-27T12:00:00Z',
    updated_at: '2025-06-27T12:00:00Z',
    retailer: {
      id: 'retailer-123',
      name: 'Target'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
  })

  describe('createTrip', () => {
    it('should create a trip successfully', async () => {
      // Mock retailer verification
      const retailerMock = vi.fn().mockResolvedValue({
        data: { id: 'retailer-123' },
        error: null
      })

      // Mock trip creation
      const insertMock = vi.fn().mockResolvedValue({
        data: mockTrip,
        error: null
      })

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: retailerMock
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: insertMock
            }))
          }))
        })

      const result = await tripService.createTrip({
        name: 'Weekly Groceries',
        date: '2025-06-27',
        retailer_id: 'retailer-123'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTrip)
    })

    it('should validate retailer ownership', async () => {
      // Mock retailer verification - not found
      const retailerMock = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: retailerMock
            }))
          }))
        }))
      })

      const result = await tripService.createTrip({
        name: 'Weekly Groceries',
        date: '2025-06-27',
        retailer_id: 'invalid-retailer'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid retailer selected')
    })

    it('should trim trip name', async () => {
      const retailerMock = vi.fn().mockResolvedValue({
        data: { id: 'retailer-123' },
        error: null
      })

      const insertSpy = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: mockTrip,
            error: null
          })
        }))
      }))

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: retailerMock
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          insert: insertSpy
        })

      await tripService.createTrip({
        name: '  Weekly Groceries  ',
        date: '2025-06-27',
        retailer_id: 'retailer-123'
      })

      expect(insertSpy).toHaveBeenCalledWith({
        user_id: 'user-123',
        name: 'Weekly Groceries',
        date: '2025-06-27',
        retailer_id: 'retailer-123',
        status: 'planned'
      })
    })
  })

  describe('updateTripStatus', () => {
    it('should prevent multiple active trips', async () => {
      // Mock check for existing active trips
      const activeTripsMock = vi.fn().mockResolvedValue({
        data: [{ id: 'other-trip-123' }],
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              neq: activeTripsMock
            }))
          }))
        }))
      })

      const result = await tripService.updateTripStatus('trip-123', 'active')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Only one trip can be active at a time')
    })

    it('should allow setting trip to active when no other active trips', async () => {
      // Mock check for existing active trips - none found
      const activeTripsMock = vi.fn().mockResolvedValue({
        data: [],
        error: null
      })

      // Mock the update operation
      const updateMock = vi.fn().mockResolvedValue({
        data: { ...mockTrip, status: 'active' },
        error: null
      })

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                neq: activeTripsMock
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: updateMock
                }))
              }))
            }))
          }))
        })

      const result = await tripService.updateTripStatus('trip-123', 'active')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('active')
    })
  })

  describe('getTrips', () => {
    it('should fetch trips with filters', async () => {
      const mockTrips = [mockTrip]
      
      const orderMock = vi.fn().mockResolvedValue({
        data: mockTrips,
        error: null
      })

      const eqStatusMock = vi.fn(() => ({
        order: orderMock
      }))

      const eqUserMock = vi.fn(() => ({
        eq: eqStatusMock
      }))

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: eqUserMock
        }))
      })

      const result = await tripService.getTrips({
        status: 'planned'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockTrips)
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-123')
      expect(eqStatusMock).toHaveBeenCalledWith('status', 'planned')
    })

    it('should handle empty trip list', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: null,
        error: null
      })

      const eqUserMock = vi.fn(() => ({
        order: orderMock
      }))

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: eqUserMock
        }))
      })

      const result = await tripService.getTrips()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })

  describe('getActiveTrip', () => {
    it('should return null when no active trip exists', async () => {
      const singleMock = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: singleMock
            }))
          }))
        }))
      })

      const result = await tripService.getActiveTrip()

      expect(result.success).toBe(true)
      expect(result.data).toBe(null)
    })

    it('should return active trip when one exists', async () => {
      const activeTrip = { ...mockTrip, status: 'active' }
      
      const singleMock = vi.fn().mockResolvedValue({
        data: activeTrip,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: singleMock
            }))
          }))
        }))
      })

      const result = await tripService.getActiveTrip()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(activeTrip)
    })
  })
})