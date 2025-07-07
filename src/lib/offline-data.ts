// Offline-first data service wrapper
import { retailerService } from './retailers'
import { tripService } from './trips'
import { tripItemService } from './trip-items'
import { priceIntelligenceService } from './price-intelligence'
import { offlineStorage } from './offline-storage'
import type { 
  Retailer, 
  ShoppingTrip, 
  TripItem, 
  Result
} from '@/types'
import type { CreateRetailerData } from './retailers'
import type { CreateTripData } from './trips'
import type { CreateItemData, UpdateItemData } from './trip-items'

// Cache keys
const CACHE_KEYS = {
  retailers: 'retailers',
  trips: 'trips',
  tripItems: (tripId: string) => `trip_items_${tripId}`,
  activeTrip: 'active_trip'
}

// Sync queue actions
type SyncAction = 
  | { type: 'CREATE_RETAILER'; data: CreateRetailerData }
  | { type: 'UPDATE_RETAILER'; id: string; data: Partial<CreateRetailerData> }
  | { type: 'DELETE_RETAILER'; id: string }
  | { type: 'CREATE_TRIP'; data: CreateTripData }
  | { type: 'UPDATE_TRIP'; id: string; data: Partial<CreateTripData> }
  | { type: 'DELETE_TRIP'; id: string }
  | { type: 'CREATE_ITEM'; tripId: string; data: CreateItemData }
  | { type: 'UPDATE_ITEM'; id: string; data: UpdateItemData }
  | { type: 'DELETE_ITEM'; id: string }
  | { type: 'TOGGLE_ITEM'; id: string }
  | { type: 'UPDATE_PRICE'; id: string; price: number }

interface QueuedAction extends SyncAction {
  id: string
  timestamp: number
  retryCount: number
}

export const offlineDataService = {
  // Retailers with offline support
  retailers: {
    async getAll(): Promise<Result<Retailer[]>> {
      try {
        if (navigator.onLine) {
          // Try online first
          const result = await retailerService.getRetailers()
          if (result.success) {
            // Cache successful result
            await offlineStorage.setItem(CACHE_KEYS.retailers, 'retailers', result.data)
            return result
          }
        }

        // Fallback to cache
        const cached = await offlineStorage.getItem(CACHE_KEYS.retailers)
        if (cached) {
          return { success: true, data: cached }
        }

        if (!navigator.onLine) {
          return { success: false, error: 'No cached retailers available offline' }
        }

        return { success: false, error: 'Failed to fetch retailers' }
      } catch (error) {
        return { success: false, error: 'Failed to get retailers' }
      }
    },

    async create(data: CreateRetailerData): Promise<Result<Retailer>> {
      try {
        if (navigator.onLine) {
          const result = await retailerService.createRetailer(data)
          if (result.success) {
            // Update cache
            await this.refreshCache()
            return result
          } else {
            // Queue for later
            await this.queueAction({ type: 'CREATE_RETAILER', data })
            return result
          }
        } else {
          // Create optimistic local record
          const optimisticRetailer: Retailer = {
            id: `temp_${Date.now()}`,
            user_id: 'current_user',
            name: data.name,
            location: data.location,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            trip_count: 0
          }

          // Add to cache
          const cached = await offlineStorage.getItem(CACHE_KEYS.retailers) || []
          cached.push(optimisticRetailer)
          await offlineStorage.setItem(CACHE_KEYS.retailers, 'retailers', cached)

          // Queue for sync
          await this.queueAction({ type: 'CREATE_RETAILER', data })

          return { success: true, data: optimisticRetailer }
        }
      } catch (error) {
        return { success: false, error: 'Failed to create retailer' }
      }
    },

    async getById(id: string): Promise<Result<Retailer>> {
      try {
        if (navigator.onLine) {
          // Try online first
          const result = await retailerService.getRetailer(id)
          if (result.success) {
            return result
          }
        }

        // Fallback to cache
        const cached = await offlineStorage.getItem(CACHE_KEYS.retailers)
        if (cached) {
          const retailer = cached.find((r: Retailer) => r.id === id)
          if (retailer) {
            return { success: true, data: retailer }
          }
        }

        return { success: false, error: 'Retailer not found' }
      } catch (error) {
        return { success: false, error: 'Failed to get retailer' }
      }
    },

    async update(id: string, data: Partial<CreateRetailerData>): Promise<Result<Retailer>> {
      try {
        if (navigator.onLine) {
          const result = await retailerService.updateRetailer(id, data)
          if (result.success) {
            // Update cache
            await this.refreshCache()
            return result
          } else {
            // Queue for later
            await this.queueAction({ type: 'UPDATE_RETAILER', id, data })
            return result
          }
        } else {
          // Offline: update cache optimistically
          const cached = await offlineStorage.getItem(CACHE_KEYS.retailers) || []
          const retailerIndex = cached.findIndex((r: Retailer) => r.id === id)
          
          if (retailerIndex >= 0) {
            cached[retailerIndex] = {
              ...cached[retailerIndex],
              ...data,
              updated_at: new Date().toISOString()
            }
            await offlineStorage.setItem(CACHE_KEYS.retailers, 'retailers', cached)

            // Queue for sync
            await this.queueAction({ type: 'UPDATE_RETAILER', id, data })

            return { success: true, data: cached[retailerIndex] }
          }

          return { success: false, error: 'Retailer not found in cache' }
        }
      } catch (error) {
        return { success: false, error: 'Failed to update retailer' }
      }
    },

    async delete(id: string): Promise<Result<void>> {
      try {
        if (navigator.onLine) {
          const result = await retailerService.deleteRetailer(id)
          if (result.success) {
            // Update cache
            await this.refreshCache()
            return result
          } else {
            // Queue for later
            await this.queueAction({ type: 'DELETE_RETAILER', id })
            return result
          }
        } else {
          // Offline: remove from cache optimistically
          const cached = await offlineStorage.getItem(CACHE_KEYS.retailers) || []
          const filtered = cached.filter((r: Retailer) => r.id !== id)
          await offlineStorage.setItem(CACHE_KEYS.retailers, 'retailers', filtered)

          // Queue for sync
          await this.queueAction({ type: 'DELETE_RETAILER', id })

          return { success: true, data: undefined }
        }
      } catch (error) {
        return { success: false, error: 'Failed to delete retailer' }
      }
    },

    async queueAction(action: SyncAction): Promise<void> {
      const queuedAction: QueuedAction = {
        ...action,
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0
      }
      await offlineStorage.addToSyncQueue('RETAILER_ACTION', queuedAction)
    },

    async refreshCache(): Promise<void> {
      if (navigator.onLine) {
        const result = await retailerService.getRetailers()
        if (result.success) {
          await offlineStorage.setItem(CACHE_KEYS.retailers, 'retailers', result.data)
        }
      }
    }
  },

  // Trips with offline support
  trips: {
    async getAll(): Promise<Result<ShoppingTrip[]>> {
      try {
        if (navigator.onLine) {
          const result = await tripService.getTrips()
          if (result.success) {
            await offlineStorage.setItem(CACHE_KEYS.trips, 'trips', result.data)
            return result
          }
        }

        const cached = await offlineStorage.getItem(CACHE_KEYS.trips)
        if (cached) {
          return { success: true, data: cached }
        }

        if (!navigator.onLine) {
          return { success: false, error: 'No cached trips available offline' }
        }

        return { success: false, error: 'Failed to fetch trips' }
      } catch (error) {
        return { success: false, error: 'Failed to get trips' }
      }
    },

    async getById(id: string): Promise<Result<ShoppingTrip>> {
      try {
        if (navigator.onLine) {
          const result = await tripService.getTrip(id)
          if (result.success) {
            // Update individual trip in cache
            const cached = await offlineStorage.getItem(CACHE_KEYS.trips) || []
            const tripIndex = cached.findIndex((trip: ShoppingTrip) => trip.id === id)
            if (tripIndex >= 0) {
              cached[tripIndex] = result.data
            } else {
              cached.push(result.data)
            }
            await offlineStorage.setItem(CACHE_KEYS.trips, 'trips', cached)
            return result
          }
        }

        // Try to find in cache
        const cached = await offlineStorage.getItem(CACHE_KEYS.trips) || []
        const trip = cached.find((trip: ShoppingTrip) => trip.id === id)
        
        if (trip) {
          return { success: true, data: trip }
        }

        if (!navigator.onLine) {
          return { success: false, error: 'Trip not found in cache' }
        }

        return { success: false, error: 'Trip not found' }
      } catch (error) {
        return { success: false, error: 'Failed to get trip' }
      }
    },

    async create(data: CreateTripData): Promise<Result<ShoppingTrip>> {
      try {
        if (navigator.onLine) {
          const result = await tripService.createTrip(data)
          if (result.success) {
            await this.refreshCache()
            return result
          } else {
            await this.queueAction({ type: 'CREATE_TRIP', data })
            return result
          }
        } else {
          // Create optimistic record
          const optimisticTrip: ShoppingTrip = {
            id: `temp_${Date.now()}`,
            user_id: 'current_user',
            retailer_id: data.retailer_id,
            name: data.name,
            date: data.date,
            status: 'planned',
            estimated_total: 0,
            actual_total: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          // Add to cache
          const cached = await offlineStorage.getItem(CACHE_KEYS.trips) || []
          cached.push(optimisticTrip)
          await offlineStorage.setItem(CACHE_KEYS.trips, 'trips', cached)

          // Queue for sync
          await this.queueAction({ type: 'CREATE_TRIP', data })

          return { success: true, data: optimisticTrip }
        }
      } catch (error) {
        return { success: false, error: 'Failed to create trip' }
      }
    },

    async updateStatus(id: string, status: 'planned' | 'active' | 'completed' | 'archived'): Promise<Result<ShoppingTrip>> {
      try {
        if (navigator.onLine) {
          const result = await tripService.updateTripStatus(id, status)
          if (result.success) {
            await this.refreshCache()
            
            // Update active trip cache
            if (status === 'active') {
              await offlineStorage.setItem(CACHE_KEYS.activeTrip, 'active_trip', result.data)
            } else if (status !== 'active') {
              await offlineStorage.removeItem(CACHE_KEYS.activeTrip)
            }
            
            return result
          }
        }

        // Offline: update cache optimistically
        const cached = await offlineStorage.getItem(CACHE_KEYS.trips) || []
        const tripIndex = cached.findIndex((trip: ShoppingTrip) => trip.id === id)
        
        if (tripIndex >= 0) {
          cached[tripIndex] = {
            ...cached[tripIndex],
            status,
            updated_at: new Date().toISOString()
          }
          await offlineStorage.setItem(CACHE_KEYS.trips, 'trips', cached)

          // Queue for sync
          await this.queueAction({ type: 'UPDATE_TRIP', id, data: { status } as any })

          return { success: true, data: cached[tripIndex] }
        }

        return { success: false, error: 'Trip not found in cache' }
      } catch (error) {
        return { success: false, error: 'Failed to update trip status' }
      }
    },

    async delete(id: string): Promise<Result<void>> {
      try {
        if (navigator.onLine) {
          const result = await tripService.deleteTrip(id)
          if (result.success) {
            await this.refreshCache()
            return result
          } else {
            await this.queueAction({ type: 'DELETE_TRIP', id })
            return result
          }
        } else {
          // Offline: remove from cache optimistically
          const cached = await offlineStorage.getItem(CACHE_KEYS.trips) || []
          const filtered = cached.filter((trip: ShoppingTrip) => trip.id !== id)
          await offlineStorage.setItem(CACHE_KEYS.trips, 'trips', filtered)

          // Queue for sync
          await this.queueAction({ type: 'DELETE_TRIP', id })

          return { success: true, data: undefined }
        }
      } catch (error) {
        return { success: false, error: 'Failed to delete trip' }
      }
    },

    async getActive(): Promise<Result<ShoppingTrip | null>> {
      try {
        if (navigator.onLine) {
          const result = await tripService.getActiveTrip()
          if (result.success) {
            if (result.data) {
              await offlineStorage.setItem(CACHE_KEYS.activeTrip, 'active_trip', result.data)
            } else {
              await offlineStorage.removeItem(CACHE_KEYS.activeTrip)
            }
            return result
          }
        }

        const cached = await offlineStorage.getItem(CACHE_KEYS.activeTrip)
        return { success: true, data: cached }
      } catch (error) {
        return { success: false, error: 'Failed to get active trip' }
      }
    },

    async queueAction(action: SyncAction): Promise<void> {
      const queuedAction: QueuedAction = {
        ...action,
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0
      }
      await offlineStorage.addToSyncQueue('TRIP_ACTION', queuedAction)
    },

    async refreshCache(): Promise<void> {
      if (navigator.onLine) {
        const result = await tripService.getTrips()
        if (result.success) {
          await offlineStorage.setItem(CACHE_KEYS.trips, 'trips', result.data)
        }
      }
    }
  },

  // Trip items with offline support
  items: {
    async getByTripId(tripId: string): Promise<Result<TripItem[]>> {
      try {
        if (navigator.onLine) {
          const result = await tripItemService.getItems(tripId)
          if (result.success) {
            await offlineStorage.setItem(CACHE_KEYS.tripItems(tripId), 'trip_items', result.data)
            return result
          }
        }

        const cached = await offlineStorage.getItem(CACHE_KEYS.tripItems(tripId))
        if (cached) {
          return { success: true, data: cached }
        }

        if (!navigator.onLine) {
          return { success: false, error: 'No cached items available offline' }
        }

        return { success: false, error: 'Failed to fetch items' }
      } catch (error) {
        return { success: false, error: 'Failed to get items' }
      }
    },

    async create(tripId: string, data: CreateItemData): Promise<Result<TripItem>> {
      try {
        if (navigator.onLine) {
          const result = await tripItemService.createItem(tripId, data)
          if (result.success) {
            await this.refreshCache(tripId)
            return result
          } else {
            await this.queueAction({ type: 'CREATE_ITEM', tripId, data })
            return result
          }
        } else {
          // Create optimistic record
          const optimisticItem: TripItem = {
            id: `temp_${Date.now()}`,
            trip_id: tripId,
            item_name: data.item_name,
            quantity: data.quantity,
            estimated_price: data.estimated_price,
            actual_price: undefined,
            is_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          // Add to cache
          const cached = await offlineStorage.getItem(CACHE_KEYS.tripItems(tripId)) || []
          cached.push(optimisticItem)
          await offlineStorage.setItem(CACHE_KEYS.tripItems(tripId), 'trip_items', cached)

          // Queue for sync
          await this.queueAction({ type: 'CREATE_ITEM', tripId, data })

          return { success: true, data: optimisticItem }
        }
      } catch (error) {
        return { success: false, error: 'Failed to create item' }
      }
    },

    async update(id: string, updates: Partial<TripItem>): Promise<Result<TripItem>> {
      try {
        if (navigator.onLine) {
          const result = await tripItemService.updateItem(id, updates)
          if (result.success) {
            // Find which trip this item belongs to and refresh cache
            const item = result.data
            await this.refreshCache(item.trip_id)
            return result
          }
        }

        // Offline: update cache optimistically
        await this.updateItemInCache(id, updates)
        await this.queueAction({ type: 'UPDATE_ITEM', id, data: updates })

        // Return optimistic result
        const updatedItem = await this.findItemInCache(id)
        if (updatedItem) {
          return { success: true, data: updatedItem }
        }

        return { success: false, error: 'Item not found in cache' }
      } catch (error) {
        return { success: false, error: 'Failed to update item' }
      }
    },

    async delete(id: string): Promise<Result<void>> {
      try {
        if (navigator.onLine) {
          const result = await tripItemService.deleteItem(id)
          if (result.success) {
            // Find which trip this item belongs to and refresh cache
            const item = await this.findItemInCache(id)
            if (item) {
              await this.refreshCache(item.trip_id)
            }
            return result
          }
        }

        // Offline: remove from cache optimistically
        const item = await this.findItemInCache(id)
        if (item) {
          await this.removeItemFromCache(id, item.trip_id)
          await this.queueAction({ type: 'DELETE_ITEM', id })
          return { success: true, data: undefined }
        }

        return { success: false, error: 'Item not found in cache' }
      } catch (error) {
        return { success: false, error: 'Failed to delete item' }
      }
    },

    async updatePrice(id: string, price: number): Promise<Result<TripItem>> {
      try {
        if (navigator.onLine) {
          const result = await tripItemService.updatePrice(id, price)
          if (result.success) {
            // Find which trip this item belongs to and refresh cache
            const item = result.data
            await this.refreshCache(item.trip_id)
            return result
          }
        }

        // Offline: update cache optimistically
        await this.updateItemInCache(id, { actual_price: price })
        await this.queueAction({ type: 'UPDATE_PRICE', id, price })

        // Return optimistic result
        const updatedItem = await this.findItemInCache(id)
        if (updatedItem) {
          return { success: true, data: updatedItem }
        }

        return { success: false, error: 'Item not found in cache' }
      } catch (error) {
        return { success: false, error: 'Failed to update price' }
      }
    },

    async toggleCompleted(id: string): Promise<Result<TripItem>> {
      try {
        if (navigator.onLine) {
          const result = await tripItemService.toggleCompleted(id)
          if (result.success) {
            const item = result.data
            await this.refreshCache(item.trip_id)
            return result
          }
        }

        // Offline: toggle in cache
        const item = await this.findItemInCache(id)
        if (item) {
          const newCompleted = !item.is_completed
          await this.updateItemInCache(id, { is_completed: newCompleted })
          await this.queueAction({ type: 'TOGGLE_ITEM', id })

          return { success: true, data: { ...item, is_completed: newCompleted } }
        }

        return { success: false, error: 'Item not found in cache' }
      } catch (error) {
        return { success: false, error: 'Failed to toggle item' }
      }
    },

    async findItemInCache(id: string): Promise<TripItem | null> {
      // Search through all cached trip items
      const trips = await offlineStorage.getItem(CACHE_KEYS.trips) || []
      for (const trip of trips) {
        const items = await offlineStorage.getItem(CACHE_KEYS.tripItems(trip.id)) || []
        const item = items.find((item: TripItem) => item.id === id)
        if (item) return item
      }
      return null
    },

    async updateItemInCache(id: string, updates: Partial<TripItem>): Promise<void> {
      const trips = await offlineStorage.getItem(CACHE_KEYS.trips) || []
      for (const trip of trips) {
        const items = await offlineStorage.getItem(CACHE_KEYS.tripItems(trip.id)) || []
        const itemIndex = items.findIndex((item: TripItem) => item.id === id)
        if (itemIndex >= 0) {
          items[itemIndex] = { ...items[itemIndex], ...updates, updated_at: new Date().toISOString() }
          await offlineStorage.setItem(CACHE_KEYS.tripItems(trip.id), 'trip_items', items)
          return
        }
      }
    },

    async removeItemFromCache(id: string, tripId: string): Promise<void> {
      const items = await offlineStorage.getItem(CACHE_KEYS.tripItems(tripId)) || []
      const filteredItems = items.filter((item: TripItem) => item.id !== id)
      await offlineStorage.setItem(CACHE_KEYS.tripItems(tripId), 'trip_items', filteredItems)
    },

    async queueAction(action: SyncAction): Promise<void> {
      const queuedAction: QueuedAction = {
        ...action,
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0
      }
      await offlineStorage.addToSyncQueue('ITEM_ACTION', queuedAction)
    },

    async refreshCache(tripId: string): Promise<void> {
      if (navigator.onLine) {
        const result = await tripItemService.getItems(tripId)
        if (result.success) {
          await offlineStorage.setItem(CACHE_KEYS.tripItems(tripId), 'trip_items', result.data)
        }
      }
    }
  },

  // Sync management
  sync: {
    async syncPendingChanges(): Promise<{ synced: number; failed: number }> {
      if (!navigator.onLine) {
        return { synced: 0, failed: 0 }
      }

      let synced = 0
      let failed = 0

      try {
        const syncQueue = await offlineStorage.getSyncQueue()
        
        for (const queueItem of syncQueue) {
          try {
            const action = queueItem.data as QueuedAction
            let success = false

            // Process different action types
            switch (action.type) {
              case 'CREATE_RETAILER':
                const retailerResult = await retailerService.createRetailer(action.data)
                success = retailerResult.success
                break

              case 'CREATE_TRIP':
                const tripResult = await tripService.createTrip(action.data)
                success = tripResult.success
                break

              case 'CREATE_ITEM':
                const itemResult = await tripItemService.createItem(action.tripId, action.data)
                success = itemResult.success
                break

              case 'UPDATE_PRICE':
                const priceResult = await tripItemService.updatePrice(action.id, action.price)
                success = priceResult.success
                break

              case 'TOGGLE_ITEM':
                const toggleResult = await tripItemService.toggleCompleted(action.id)
                success = toggleResult.success
                break

              default:
                // Unknown action type
                success = false
            }

            if (success) {
              synced++
              // Remove from sync queue
              await offlineStorage.removeItem(queueItem.id)
            } else {
              failed++
              // Increment retry count
              action.retryCount++
              if (action.retryCount > 3) {
                // Remove after 3 failed attempts
                await offlineStorage.removeItem(queueItem.id)
              }
            }
          } catch (error) {
            failed++
          }
        }

        // Refresh all caches after sync
        await offlineDataService.retailers.refreshCache()
        await offlineDataService.trips.refreshCache()

      } catch (error) {
        console.error('Sync failed:', error)
      }

      return { synced, failed }
    },

    async clearCache(): Promise<void> {
      await offlineStorage.removeItem(CACHE_KEYS.retailers)
      await offlineStorage.removeItem(CACHE_KEYS.trips)
      await offlineStorage.removeItem(CACHE_KEYS.activeTrip)
      // Note: Trip items cache would need iteration to clear all
    },

    async getQueueSize(): Promise<number> {
      const queue = await offlineStorage.getSyncQueue()
      return queue.length
    }
  }
}

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    offlineDataService.sync.syncPendingChanges()
  })
}