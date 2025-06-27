import { supabase } from './supabase'
import type { UserProfile, UserPreferences, Result } from '@/types'

export interface UpdateProfileData {
  display_name?: string
  default_budget?: number
  preferences?: Partial<UserPreferences>
}

export interface ExportData {
  profile: UserProfile
  created_at: string
  data_summary: {
    profile_data: boolean
    // Future: trips, items, price_history counts
  }
}

// Profile service functions
export const profileService = {
  // Get user profile
  async getProfile(): Promise<Result<UserProfile | null>> {
    try {
      // First check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - this is okay, return null
          return { success: true, data: null }
        }
        if (error.code === '42P01') {
          return { success: false, error: 'Database table not found. Please run database setup.' }
        }
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Failed to fetch profile' }
    }
  },

  // Create user profile (called during registration)
  async createProfile(userId: string, initialData?: Partial<UpdateProfileData>): Promise<Result<UserProfile>> {
    try {
      const profileData = {
        user_id: userId,
        display_name: initialData?.display_name,
        default_budget: initialData?.default_budget,
        preferences: {
          notifications_enabled: true,
          dark_mode: false,
          default_currency: 'USD',
          ...initialData?.preferences
        }
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Failed to create profile' }
    }
  },

  // Update user profile
  async updateProfile(updates: UpdateProfileData): Promise<Result<UserProfile>> {
    try {
      // First check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }
      
      // If preferences are being updated, merge with existing preferences
      const updateData: Record<string, any> = {
        display_name: updates.display_name,
        default_budget: updates.default_budget
      }

      if (updates.preferences) {
        // Get current profile to merge preferences
        const currentProfile = await this.getProfile()
        if (currentProfile.success && currentProfile.data) {
          updateData.preferences = {
            ...currentProfile.data.preferences,
            ...updates.preferences
          }
        } else {
          updateData.preferences = {
            notifications_enabled: true,
            dark_mode: false,
            default_currency: 'USD',
            ...updates.preferences
          }
        }
      }
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        if (error.code === '42P01') {
          return { success: false, error: 'Database table not found. Please run database setup.' }
        }
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Failed to update profile' }
    }
  },

  // Export user data (GDPR compliance)
  async exportUserData(): Promise<Result<ExportData>> {
    try {
      const profileResult = await this.getProfile()
      if (!profileResult.success || !profileResult.data) {
        return { success: false, error: 'No profile data found' }
      }

      const exportData: ExportData = {
        profile: profileResult.data,
        created_at: new Date().toISOString(),
        data_summary: {
          profile_data: true
          // Future: Add trip count, item count, price history count
        }
      }

      return { success: true, data: exportData }
    } catch (error) {
      return { success: false, error: 'Failed to export user data' }
    }
  },

  // Delete user account and all data (GDPR compliance)
  async deleteAccount(): Promise<Result<void>> {
    try {
      // First verify user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Delete profile (cascade will handle related data when we add more tables)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id)

      if (profileError) {
        return { success: false, error: 'Failed to delete profile data' }
      }

      // Note: Client-side account deletion requires server-side implementation
      // For now, we'll just delete the profile data and sign out the user
      // Full account deletion would need a server endpoint or Edge Function
      
      // Sign out the user
      await supabase.auth.signOut()

      return { success: true, data: undefined }
    } catch (error) {
      return { success: false, error: 'Failed to delete account' }
    }
  }
}