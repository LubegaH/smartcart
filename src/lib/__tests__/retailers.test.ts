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

import { retailerService } from '../retailers'
import { supabase } from '../supabase'

// Get the mocked supabase instance
const mockSupabase = vi.mocked(supabase)

describe('Retailer Service', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  const mockRetailer = {
    id: 'retailer-123',
    user_id: 'user-123',
    name: 'Target',
    location: '123 Main St',
    created_at: '2025-06-27T12:00:00Z',
    updated_at: '2025-06-27T12:00:00Z'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })
  })

  describe('createRetailer', () => {
    it('should create a retailer successfully', async () => {
      const insertMock = vi.fn().mockResolvedValue({
        data: mockRetailer,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: insertMock
          }))
        }))
      })

      const result = await retailerService.createRetailer({
        name: 'Target',
        location: '123 Main St'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockRetailer)
      expect(mockSupabase.from).toHaveBeenCalledWith('retailers')
    })

    it('should handle duplicate retailer names', async () => {
      const insertMock = vi.fn().mockResolvedValue({
        data: null,
        error: { code: '23505', message: 'Unique constraint violation' }
      })

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: insertMock
          }))
        }))
      })

      const result = await retailerService.createRetailer({
        name: 'Target'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('A retailer with this name already exists')
    })

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await retailerService.createRetailer({
        name: 'Target'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not authenticated')
    })

    it('should trim whitespace from retailer name', async () => {
      const insertMock = vi.fn().mockResolvedValue({
        data: mockRetailer,
        error: null
      })

      const insertSpy = vi.fn(() => ({
        select: vi.fn(() => ({
          single: insertMock
        }))
      }))

      mockSupabase.from.mockReturnValue({
        insert: insertSpy
      })

      await retailerService.createRetailer({
        name: '  Target  ',
        location: '  123 Main St  '
      })

      expect(insertSpy).toHaveBeenCalledWith({
        user_id: 'user-123',
        name: 'Target',
        location: '123 Main St'
      })
    })
  })

  describe('getRetailers', () => {
    it('should fetch retailers with trip counts', async () => {
      const mockRetailers = [
        {
          ...mockRetailer,
          trip_count: [{ count: 5 }]
        }
      ]

      const orderMock = vi.fn().mockResolvedValue({
        data: mockRetailers,
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: orderMock
          }))
        }))
      })

      const result = await retailerService.getRetailers()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0].trip_count).toBe(5)
    })

    it('should handle empty retailer list', async () => {
      const orderMock = vi.fn().mockResolvedValue({
        data: [],
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: orderMock
          }))
        }))
      })

      const result = await retailerService.getRetailers()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })
  })

  describe('updateRetailer', () => {
    it('should update retailer successfully', async () => {
      const updateMock = vi.fn().mockResolvedValue({
        data: { ...mockRetailer, name: 'Updated Target' },
        error: null
      })

      mockSupabase.from.mockReturnValue({
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

      const result = await retailerService.updateRetailer('retailer-123', {
        name: 'Updated Target'
      })

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('Updated Target')
    })

    it('should handle retailer not found', async () => {
      const updateMock = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      mockSupabase.from.mockReturnValue({
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

      const result = await retailerService.updateRetailer('nonexistent', {
        name: 'Updated Target'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Retailer not found')
    })
  })

  describe('deleteRetailer', () => {
    it('should delete retailer when no trips exist', async () => {
      // Mock trip check - no trips found
      const selectMock = vi.fn().mockResolvedValue({
        data: [],
        error: null
      })

      // Mock delete operation
      const deleteMock = vi.fn().mockResolvedValue({
        error: null
      })

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: selectMock
            }))
          }))
        })
        .mockReturnValueOnce({
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: deleteMock
            }))
          }))
        })

      const result = await retailerService.deleteRetailer('retailer-123')

      expect(result.success).toBe(true)
    })

    it('should prevent deletion when trips exist', async () => {
      // Mock trip check - trips found
      const selectMock = vi.fn().mockResolvedValue({
        data: [{ id: 'trip-123' }],
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: selectMock
          }))
        }))
      })

      const result = await retailerService.deleteRetailer('retailer-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot delete retailer with existing trips')
    })
  })
})