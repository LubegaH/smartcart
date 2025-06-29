// Shopping trip management service
import { supabase } from './supabase'
import type { ShoppingTrip, TripStatus, Result } from '@/types'

export interface CreateTripData {
  name: string
  date: string // ISO date string
  retailer_id: string
}

export interface UpdateTripData {
  name?: string
  date?: string
  retailer_id?: string
  status?: TripStatus
}

export interface TripFilters {
  status?: TripStatus
  retailer_id?: string
  date_from?: string
  date_to?: string
}

export const tripService = {
  /**
   * Create a new shopping trip
   */
  async createTrip(data: CreateTripData): Promise<Result<ShoppingTrip>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Verify retailer belongs to user
      const { data: retailer, error: retailerError } = await supabase
        .from('retailers')
        .select('id')
        .eq('id', data.retailer_id)
        .eq('user_id', user.id)
        .single()

      if (retailerError || !retailer) {
        return { success: false, error: 'Invalid retailer selected' }
      }

      const { data: trip, error } = await supabase
        .from('shopping_trips')
        .insert({
          user_id: user.id,
          name: data.name.trim(),
          date: data.date,
          retailer_id: data.retailer_id,
          status: 'planned'
        })
        .select(`
          *,
          retailer:retailers(*)
        `)
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: trip }
    } catch (error) {
      return { success: false, error: 'Failed to create trip' }
    }
  },

  /**
   * Get all trips for the current user with optional filtering
   */
  async getTrips(filters?: TripFilters): Promise<Result<ShoppingTrip[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      let query = supabase
        .from('shopping_trips')
        .select(`
          *,
          retailer:retailers(*),
          items:trip_items(*)
        `)
        .eq('user_id', user.id)

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.retailer_id) {
        query = query.eq('retailer_id', filters.retailer_id)
      }
      if (filters?.date_from) {
        query = query.gte('date', filters.date_from)
      }
      if (filters?.date_to) {
        query = query.lte('date', filters.date_to)
      }

      const { data: trips, error } = await query.order('date', { ascending: false })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: trips || [] }
    } catch (error) {
      return { success: false, error: 'Failed to fetch trips' }
    }
  },

  /**
   * Get a single trip by ID with full details
   */
  async getTrip(id: string): Promise<Result<ShoppingTrip>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data: trip, error } = await supabase
        .from('shopping_trips')
        .select(`
          *,
          retailer:retailers(*),
          items:trip_items(*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Trip not found' }
        }
        return { success: false, error: error.message }
      }

      return { success: true, data: trip }
    } catch (error) {
      return { success: false, error: 'Failed to fetch trip' }
    }
  },

  /**
   * Update a trip
   */
  async updateTrip(id: string, data: UpdateTripData): Promise<Result<ShoppingTrip>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      const updateData: any = {}
      if (data.name !== undefined) updateData.name = data.name.trim()
      if (data.date !== undefined) updateData.date = data.date
      if (data.retailer_id !== undefined) updateData.retailer_id = data.retailer_id
      if (data.status !== undefined) {
        updateData.status = data.status
        if (data.status === 'completed') {
          updateData.completed_at = new Date().toISOString()
        } else if (data.status !== 'completed') {
          updateData.completed_at = null
        }
      }

      const { data: trip, error } = await supabase
        .from('shopping_trips')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select(`
          *,
          retailer:retailers(*),
          items:trip_items(*)
        `)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Trip not found' }
        }
        return { success: false, error: error.message }
      }

      return { success: true, data: trip }
    } catch (error) {
      return { success: false, error: 'Failed to update trip' }
    }
  },

  /**
   * Update trip status with validation
   */
  async updateTripStatus(id: string, status: TripStatus): Promise<Result<ShoppingTrip>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // If setting to active, ensure no other trip is active
      if (status === 'active') {
        const { data: activeTrips, error: activeError } = await supabase
          .from('shopping_trips')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .neq('id', id)

        if (activeError) {
          return { success: false, error: activeError.message }
        }

        if (activeTrips && activeTrips.length > 0) {
          return { success: false, error: 'Only one trip can be active at a time' }
        }
      }

      return await this.updateTrip(id, { status })
    } catch (error) {
      return { success: false, error: 'Failed to update trip status' }
    }
  },

  /**
   * Delete a trip and all its items
   */
  async deleteTrip(id: string): Promise<Result<void>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { error } = await supabase
        .from('shopping_trips')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: undefined }
    } catch (error) {
      return { success: false, error: 'Failed to delete trip' }
    }
  },

  /**
   * Get currently active trip for user
   */
  async getActiveTrip(): Promise<Result<ShoppingTrip | null>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data: trip, error } = await supabase
        .from('shopping_trips')
        .select(`
          *,
          retailer:retailers(*),
          items:trip_items(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: true, data: null }
        }
        return { success: false, error: error.message }
      }

      return { success: true, data: trip }
    } catch (error) {
      return { success: false, error: 'Failed to fetch active trip' }
    }
  }
}