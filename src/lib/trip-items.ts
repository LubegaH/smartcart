// Trip item management service
import { supabase } from './supabase'
import type { TripItem, Result } from '@/types'

export interface CreateItemData {
  item_name: string
  quantity: number
  estimated_price?: number
}

export interface UpdateItemData {
  item_name?: string
  quantity?: number
  estimated_price?: number
  actual_price?: number
  is_completed?: boolean
}

export const tripItemService = {
  /**
   * Add an item to a trip
   */
  async createItem(tripId: string, data: CreateItemData): Promise<Result<TripItem>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Verify trip belongs to user
      const { data: trip, error: tripError } = await supabase
        .from('shopping_trips')
        .select('id')
        .eq('id', tripId)
        .eq('user_id', user.id)
        .single()

      if (tripError || !trip) {
        return { success: false, error: 'Invalid trip' }
      }

      const { data: item, error } = await supabase
        .from('trip_items')
        .insert({
          trip_id: tripId,
          item_name: data.item_name.trim(),
          quantity: data.quantity,
          estimated_price: data.estimated_price || null
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: item }
    } catch (error) {
      return { success: false, error: 'Failed to create item' }
    }
  },

  /**
   * Get all items for a trip
   */
  async getItems(tripId: string): Promise<Result<TripItem[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Verify trip belongs to user
      const { data: trip, error: tripError } = await supabase
        .from('shopping_trips')
        .select('id')
        .eq('id', tripId)
        .eq('user_id', user.id)
        .single()

      if (tripError || !trip) {
        return { success: false, error: 'Invalid trip' }
      }

      const { data: items, error } = await supabase
        .from('trip_items')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at')

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: items || [] }
    } catch (error) {
      return { success: false, error: 'Failed to fetch items' }
    }
  },

  /**
   * Get a single item by ID
   */
  async getItem(id: string): Promise<Result<TripItem>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data: item, error } = await supabase
        .from('trip_items')
        .select(`
          *,
          trip:shopping_trips(user_id)
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Item not found' }
        }
        return { success: false, error: error.message }
      }

      // Verify item belongs to user's trip
      if (item.trip.user_id !== user.id) {
        return { success: false, error: 'Item not found' }
      }

      return { success: true, data: item }
    } catch (error) {
      return { success: false, error: 'Failed to fetch item' }
    }
  },

  /**
   * Update an item
   */
  async updateItem(id: string, data: UpdateItemData): Promise<Result<TripItem>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Verify item belongs to user's trip
      const { data: existingItem, error: existingError } = await supabase
        .from('trip_items')
        .select(`
          id,
          trip:shopping_trips(user_id)
        `)
        .eq('id', id)
        .single()

      if (existingError || !existingItem || existingItem.trip.user_id !== user.id) {
        return { success: false, error: 'Item not found' }
      }

      const updateData: any = {}
      if (data.item_name !== undefined) updateData.item_name = data.item_name.trim()
      if (data.quantity !== undefined) updateData.quantity = data.quantity
      if (data.estimated_price !== undefined) updateData.estimated_price = data.estimated_price
      if (data.actual_price !== undefined) updateData.actual_price = data.actual_price
      if (data.is_completed !== undefined) updateData.is_completed = data.is_completed

      const { data: item, error } = await supabase
        .from('trip_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: item }
    } catch (error) {
      return { success: false, error: 'Failed to update item' }
    }
  },

  /**
   * Update item price (for active shopping mode)
   */
  async updatePrice(id: string, actualPrice: number): Promise<Result<TripItem>> {
    return this.updateItem(id, { actual_price: actualPrice })
  },

  /**
   * Toggle item completion status
   */
  async toggleCompleted(id: string): Promise<Result<TripItem>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Get current item state
      const itemResult = await this.getItem(id)
      if (!itemResult.success) {
        return itemResult
      }

      const newCompletedState = !itemResult.data.is_completed
      return this.updateItem(id, { is_completed: newCompletedState })
    } catch (error) {
      return { success: false, error: 'Failed to toggle item completion' }
    }
  },

  /**
   * Delete an item
   */
  async deleteItem(id: string): Promise<Result<void>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Verify item belongs to user's trip
      const { data: existingItem, error: existingError } = await supabase
        .from('trip_items')
        .select(`
          id,
          trip:shopping_trips(user_id)
        `)
        .eq('id', id)
        .single()

      if (existingError || !existingItem || existingItem.trip.user_id !== user.id) {
        return { success: false, error: 'Item not found' }
      }

      const { error } = await supabase
        .from('trip_items')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: undefined }
    } catch (error) {
      return { success: false, error: 'Failed to delete item' }
    }
  },

  /**
   * Bulk update items (for multiple operations)
   */
  async bulkUpdateItems(updates: Array<{ id: string; data: UpdateItemData }>): Promise<Result<TripItem[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      const updatedItems: TripItem[] = []
      
      // Process updates sequentially to maintain data consistency
      for (const update of updates) {
        const result = await this.updateItem(update.id, update.data)
        if (!result.success) {
          return result
        }
        updatedItems.push(result.data)
      }

      return { success: true, data: updatedItems }
    } catch (error) {
      return { success: false, error: 'Failed to bulk update items' }
    }
  }
}