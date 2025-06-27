// Offline-first profile service wrapper
import { profileService } from './profile'
import { profileStorage, offlineStorage } from './offline-storage'
import { supabase } from './supabase'
import type { UserProfile, Result } from '@/types'
import type { UpdateProfileData } from './profile'

export const offlineProfileService = {
  // Get profile with offline fallback
  async getProfile(): Promise<Result<UserProfile | null>> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Try online first
      if (navigator.onLine) {
        const onlineResult = await profileService.getProfile()
        if (onlineResult.success && onlineResult.data) {
          // Cache successful result
          await profileStorage.saveProfile(onlineResult.data)
          return onlineResult
        }
      }

      // Fallback to offline cache
      const cachedProfile = await profileStorage.getProfile(user.id)
      if (cachedProfile) {
        return { success: true, data: cachedProfile }
      }

      // No cached data available
      if (!navigator.onLine) {
        return { success: false, error: 'No cached profile data available offline' }
      }

      // Online but failed to fetch
      return { success: false, error: 'Failed to fetch profile' }
    } catch (error) {
      return { success: false, error: 'Failed to get profile' }
    }
  },

  // Update profile with offline support
  async updateProfile(updates: UpdateProfileData): Promise<Result<UserProfile>> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      if (navigator.onLine) {
        // Try online update
        const result = await profileService.updateProfile(updates)
        if (result.success) {
          // Cache successful update
          await profileStorage.saveProfile(result.data)
          return result
        } else {
          // Queue for later sync
          await profileStorage.queueProfileUpdate(updates)
          return { success: false, error: result.error }
        }
      } else {
        // Offline: apply optimistic update to cached data
        const cachedProfile = await profileStorage.getProfile(user.id)
        if (cachedProfile) {
          const updatedProfile: UserProfile = {
            ...cachedProfile,
            display_name: updates.display_name ?? cachedProfile.display_name,
            default_budget: updates.default_budget ?? cachedProfile.default_budget,
            preferences: updates.preferences 
              ? { ...cachedProfile.preferences, ...updates.preferences }
              : cachedProfile.preferences,
            updated_at: new Date().toISOString()
          }

          // Save optimistic update
          await profileStorage.saveProfile(updatedProfile)
          
          // Queue for sync when online
          await profileStorage.queueProfileUpdate(updates)

          return { success: true, data: updatedProfile }
        } else {
          return { success: false, error: 'No cached profile data for offline update' }
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to update profile' }
    }
  },

  // Sync pending changes when coming back online
  async syncPendingChanges(): Promise<void> {
    if (!navigator.onLine) return

    try {
      const syncQueue = await offlineStorage.getSyncQueue()
      
      for (const item of syncQueue) {
        if (item.action === 'UPDATE_PROFILE') {
          try {
            const result = await profileService.updateProfile(item.data)
            if (result.success) {
              // Update cache with server response
              await profileStorage.saveProfile(result.data)
            }
          } catch (error) {
            // Skip failed syncs for now
          }
        }
      }

      // Clear sync queue after processing
      await offlineStorage.clearSyncQueue()
    } catch (error) {
      // Silent fail for sync operations
    }
  },

  // Export data with offline support
  async exportUserData() {
    if (navigator.onLine) {
      return await profileService.exportUserData()
    } else {
      // Create offline export from cached data
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const cachedProfile = await profileStorage.getProfile(user.id)
      if (cachedProfile) {
        return {
          success: true,
          data: {
            profile: cachedProfile,
            created_at: new Date().toISOString(),
            data_summary: {
              profile_data: true,
              note: 'Exported from offline cache'
            }
          }
        }
      } else {
        return { success: false, error: 'No cached data available for export' }
      }
    }
  },

  // Delete account (requires online connection)
  async deleteAccount() {
    if (!navigator.onLine) {
      return { success: false, error: 'Internet connection required for account deletion' }
    }
    
    try {
      const result = await profileService.deleteAccount()
      if (result.success) {
        // Clear offline cache on successful deletion
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await profileStorage.clearProfile(user.id)
        }
        await offlineStorage.clearSyncQueue()
      }
      return result
    } catch (error) {
      return { success: false, error: 'Failed to delete account' }
    }
  }
}

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    offlineProfileService.syncPendingChanges()
  })
}