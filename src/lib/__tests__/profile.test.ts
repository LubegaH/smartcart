import { describe, it, expect, vi, beforeEach } from 'vitest'
import { profileService } from '../profile'
import { supabase } from '../supabase'

// Mock the supabase module
vi.mock('../supabase')

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProfile', () => {
    it('should successfully get user profile', async () => {
      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        display_name: 'John Doe',
        default_budget: 500.00,
        preferences: {
          notifications_enabled: true,
          dark_mode: false,
          default_currency: 'USD'
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.getProfile()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockProfile)
      expect(supabase.from).toHaveBeenCalledWith('user_profiles')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.single).toHaveBeenCalled()
    })

    it('should handle no profile found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' }
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.getProfile()

      expect(result.success).toBe(true)
      expect(result.data).toBe(null)
    })

    it('should handle profile fetch errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.getProfile()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Database error')
    })

    it('should handle profile fetch exceptions', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error('Network error'))
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.getProfile()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch profile')
    })
  })

  describe('createProfile', () => {
    it('should successfully create user profile', async () => {
      const userId = 'user-123'
      const initialData = {
        display_name: 'John Doe',
        default_budget: 500.00,
        preferences: {
          notifications_enabled: false,
          dark_mode: true,
          default_currency: 'EUR'
        }
      }

      const mockProfile = {
        id: 'profile-123',
        user_id: userId,
        display_name: 'John Doe',
        default_budget: 500.00,
        preferences: {
          notifications_enabled: false,
          dark_mode: true,
          default_currency: 'EUR'
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.createProfile(userId, initialData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockProfile)
      expect(supabase.from).toHaveBeenCalledWith('user_profiles')
      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: userId,
        display_name: 'John Doe',
        default_budget: 500.00,
        preferences: {
          notifications_enabled: false,
          dark_mode: true,
          default_currency: 'EUR'
        }
      })
    })

    it('should create profile with default preferences when no initial data provided', async () => {
      const userId = 'user-123'

      const mockProfile = {
        id: 'profile-123',
        user_id: userId,
        display_name: undefined,
        default_budget: undefined,
        preferences: {
          notifications_enabled: true,
          dark_mode: false,
          default_currency: 'USD'
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.createProfile(userId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockProfile)
      expect(mockQuery.insert).toHaveBeenCalledWith({
        user_id: userId,
        display_name: undefined,
        default_budget: undefined,
        preferences: {
          notifications_enabled: true,
          dark_mode: false,
          default_currency: 'USD'
        }
      })
    })

    it('should handle profile creation errors', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Duplicate user_id' }
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.createProfile('user-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Duplicate user_id')
    })

    it('should handle profile creation exceptions', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error('Network error'))
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.createProfile('user-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create profile')
    })
  })

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const updates = {
        display_name: 'Jane Doe',
        default_budget: 600.00,
        preferences: {
          dark_mode: true
        }
      }

      const currentProfile = {
        preferences: {
          notifications_enabled: true,
          dark_mode: false,
          default_currency: 'USD'
        }
      }

      const updatedProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        display_name: 'Jane Doe',
        default_budget: 600.00,
        preferences: {
          notifications_enabled: true,
          dark_mode: true,
          default_currency: 'USD'
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z'
      }

      // Mock getProfile to return current profile
      const getProfileSpy = vi.spyOn(profileService, 'getProfile').mockResolvedValue({
        success: true,
        data: currentProfile as any
      })

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedProfile,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.updateProfile(updates)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(updatedProfile)
      expect(getProfileSpy).toHaveBeenCalled()
      expect(mockQuery.update).toHaveBeenCalledWith({
        display_name: 'Jane Doe',
        default_budget: 600.00,
        preferences: {
          notifications_enabled: true,
          dark_mode: true,
          default_currency: 'USD'
        }
      })

      getProfileSpy.mockRestore()
    })

    it('should handle profile update without existing profile', async () => {
      const updates = {
        display_name: 'Jane Doe',
        preferences: {
          dark_mode: true
        }
      }

      const updatedProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        display_name: 'Jane Doe',
        preferences: {
          notifications_enabled: true,
          dark_mode: true,
          default_currency: 'USD'
        }
      }

      // Mock getProfile to return no profile
      const getProfileSpy = vi.spyOn(profileService, 'getProfile').mockResolvedValue({
        success: true,
        data: null
      })

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedProfile,
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.updateProfile(updates)

      expect(result.success).toBe(true)
      expect(mockQuery.update).toHaveBeenCalledWith({
        display_name: 'Jane Doe',
        default_budget: undefined,
        preferences: {
          notifications_enabled: true,
          dark_mode: true,
          default_currency: 'USD'
        }
      })

      getProfileSpy.mockRestore()
    })

    it('should handle profile update errors', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' }
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.updateProfile({
        display_name: 'Jane Doe'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })

    it('should handle profile update exceptions', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error('Network error'))
      }

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any)

      const result = await profileService.updateProfile({
        display_name: 'Jane Doe'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to update profile')
    })
  })

  describe('exportUserData', () => {
    it('should successfully export user data', async () => {
      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        display_name: 'John Doe',
        default_budget: 500.00,
        preferences: {
          notifications_enabled: true,
          dark_mode: false,
          default_currency: 'USD'
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const getProfileSpy = vi.spyOn(profileService, 'getProfile').mockResolvedValue({
        success: true,
        data: mockProfile
      })

      const result = await profileService.exportUserData()

      expect(result.success).toBe(true)
      expect(result.data?.profile).toEqual(mockProfile)
      expect(result.data?.data_summary.profile_data).toBe(true)
      expect(result.data?.created_at).toBeDefined()

      getProfileSpy.mockRestore()
    })

    it('should handle export when no profile exists', async () => {
      const getProfileSpy = vi.spyOn(profileService, 'getProfile').mockResolvedValue({
        success: true,
        data: null
      })

      const result = await profileService.exportUserData()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No profile data found')

      getProfileSpy.mockRestore()
    })

    it('should handle export errors', async () => {
      const getProfileSpy = vi.spyOn(profileService, 'getProfile').mockResolvedValue({
        success: false,
        error: 'Database error'
      })

      const result = await profileService.exportUserData()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No profile data found')

      getProfileSpy.mockRestore()
    })

    it('should handle export exceptions', async () => {
      const getProfileSpy = vi.spyOn(profileService, 'getProfile').mockRejectedValue(new Error('Network error'))

      const result = await profileService.exportUserData()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to export user data')

      getProfileSpy.mockRestore()
    })
  })

  describe('deleteAccount', () => {
    it('should successfully delete user account and profile', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockDeleteQuery as any)
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })

      const result = await profileService.deleteAccount()

      expect(result.success).toBe(true)
      expect(result.data).toBe(undefined)
      expect(supabase.auth.getUser).toHaveBeenCalled()
      expect(supabase.from).toHaveBeenCalledWith('user_profiles')
      expect(mockDeleteQuery.delete).toHaveBeenCalled()
      expect(mockDeleteQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle user not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      })

      const result = await profileService.deleteAccount()

      expect(result.success).toBe(false)
      expect(result.error).toBe('User not authenticated')
    })

    it('should handle profile deletion errors', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Delete failed' }
        })
      }

      vi.mocked(supabase.from).mockReturnValue(mockDeleteQuery as any)

      const result = await profileService.deleteAccount()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to delete profile data')
    })

    it('should handle delete account exceptions', async () => {
      vi.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Network error'))

      const result = await profileService.deleteAccount()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to delete account')
    })
  })
})