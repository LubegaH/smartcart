// Retailer management service
import { supabase } from './supabase'
import type { Retailer, Result } from '@/types'

export interface CreateRetailerData {
  name: string
  location?: string
}

export interface UpdateRetailerData {
  name?: string
  location?: string
}

export const retailerService = {
  /**
   * Create a new retailer for the current user
   */
  async createRetailer(data: CreateRetailerData): Promise<Result<Retailer>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data: retailer, error } = await supabase
        .from('retailers')
        .insert({
          user_id: user.id,
          name: data.name.trim(),
          location: data.location?.trim() || null
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { success: false, error: 'A retailer with this name already exists' }
        }
        return { success: false, error: error.message }
      }

      return { success: true, data: retailer }
    } catch (error) {
      return { success: false, error: 'Failed to create retailer' }
    }
  },

  /**
   * Get all retailers for the current user
   */
  async getRetailers(): Promise<Result<Retailer[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data: retailers, error } = await supabase
        .from('retailers')
        .select(`
          *,
          trip_count:shopping_trips(count)
        `)
        .eq('user_id', user.id)
        .order('name')

      if (error) {
        return { success: false, error: error.message }
      }

      // Transform the trip_count from array to number
      const transformedRetailers = retailers.map(retailer => ({
        ...retailer,
        trip_count: retailer.trip_count?.[0]?.count || 0
      }))

      return { success: true, data: transformedRetailers }
    } catch (error) {
      return { success: false, error: 'Failed to fetch retailers' }
    }
  },

  /**
   * Get a single retailer by ID
   */
  async getRetailer(id: string): Promise<Result<Retailer>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data: retailer, error } = await supabase
        .from('retailers')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Retailer not found' }
        }
        return { success: false, error: error.message }
      }

      return { success: true, data: retailer }
    } catch (error) {
      return { success: false, error: 'Failed to fetch retailer' }
    }
  },

  /**
   * Update a retailer
   */
  async updateRetailer(id: string, data: UpdateRetailerData): Promise<Result<Retailer>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      const updateData: any = {}
      if (data.name !== undefined) updateData.name = data.name.trim()
      if (data.location !== undefined) updateData.location = data.location?.trim() || null

      const { data: retailer, error } = await supabase
        .from('retailers')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'A retailer with this name already exists' }
        }
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Retailer not found' }
        }
        return { success: false, error: error.message }
      }

      return { success: true, data: retailer }
    } catch (error) {
      return { success: false, error: 'Failed to update retailer' }
    }
  },

  /**
   * Delete a retailer (only if no trips exist)
   */
  async deleteRetailer(id: string): Promise<Result<void>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Check if retailer has any trips
      const { data: trips, error: tripError } = await supabase
        .from('shopping_trips')
        .select('id')
        .eq('retailer_id', id)
        .limit(1)

      if (tripError) {
        return { success: false, error: tripError.message }
      }

      if (trips && trips.length > 0) {
        return { success: false, error: 'Cannot delete retailer with existing trips' }
      }

      const { error } = await supabase
        .from('retailers')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: undefined }
    } catch (error) {
      return { success: false, error: 'Failed to delete retailer' }
    }
  }
}