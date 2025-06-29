// Real-time subscriptions for live data updates
import { supabase } from './supabase'
import type { ShoppingTrip, TripItem, Retailer } from '@/types'

export type RealtimeCallback<T> = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T | null
  old: T | null
}) => void

export class RealtimeSubscriptions {
  private channels = new Map<string, any>()

  /**
   * Subscribe to user's shopping trips
   */
  subscribeToUserTrips(userId: string, callback: RealtimeCallback<ShoppingTrip>) {
    const channelName = `user-trips-${userId}`
    
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_trips',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback({
            eventType: payload.eventType as any,
            new: payload.new as ShoppingTrip,
            old: payload.old as ShoppingTrip
          })
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channelName
  }

  /**
   * Subscribe to items for a specific trip
   */
  subscribeToTripItems(tripId: string, callback: RealtimeCallback<TripItem>) {
    const channelName = `trip-items-${tripId}`
    
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_items',
          filter: `trip_id=eq.${tripId}`
        },
        (payload) => {
          callback({
            eventType: payload.eventType as any,
            new: payload.new as TripItem,
            old: payload.old as TripItem
          })
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channelName
  }

  /**
   * Subscribe to user's retailers
   */
  subscribeToUserRetailers(userId: string, callback: RealtimeCallback<Retailer>) {
    const channelName = `user-retailers-${userId}`
    
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'retailers',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback({
            eventType: payload.eventType as any,
            new: payload.new as Retailer,
            old: payload.old as Retailer
          })
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)
    return channelName
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel)
    })
    this.channels.clear()
  }

  /**
   * Get active channel count
   */
  getActiveChannelCount() {
    return this.channels.size
  }
}

// Export singleton instance
export const realtimeSubscriptions = new RealtimeSubscriptions()

// React hook for easy real-time subscriptions
export function useRealtimeSubscription() {
  return realtimeSubscriptions
}