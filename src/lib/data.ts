// Unified data service layer with offline-first support
export { retailerService } from './retailers'
export { tripService } from './trips'  
export { tripItemService } from './trip-items'
export { priceIntelligenceService } from './price-intelligence'

// Import offline service and price intelligence for local usage
import { offlineDataService } from './offline-data'
import { priceIntelligenceService } from './price-intelligence'

// Default to offline-first services for main app usage
export const dataService = {
  retailers: offlineDataService.retailers,
  trips: offlineDataService.trips,
  tripItems: offlineDataService.items,
  priceIntelligence: priceIntelligenceService, // This doesn't need offline caching as much
  sync: offlineDataService.sync
}

// Also export the offline service directly
export { offlineDataService }

// Re-export types for convenience
export type {
  CreateRetailerData,
  UpdateRetailerData
} from './retailers'

export type {
  CreateTripData,
  UpdateTripData,
  TripFilters
} from './trips'

export type {
  CreateItemData,
  UpdateItemData
} from './trip-items'