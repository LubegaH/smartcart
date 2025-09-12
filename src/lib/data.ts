// Unified data service layer with offline-first support
export { retailerService } from './retailers'
export { tripService } from './trips'  
export { tripItemService } from './trip-items'
export { priceIntelligenceService } from './price-intelligence'
export { shoppingSessionService } from './shopping-session'
export { navigationContext, useShoppingSession, initializeShoppingSession } from './navigation-context'

// Import offline service and price intelligence for local usage
import { offlineDataService } from './offline-data'
import { priceIntelligenceService } from './price-intelligence'
import { navigationContext } from './navigation-context'

// Default to offline-first services for main app usage
export const dataService = {
  retailers: offlineDataService.retailers,
  trips: offlineDataService.trips,
  tripItems: {
    ...offlineDataService.items,
    // Add bulk operations
    bulkDelete: offlineDataService.items.bulkDelete
  },
  priceIntelligence: priceIntelligenceService, // This doesn't need offline caching as much
  sync: offlineDataService.sync,
  // Shopping session and navigation context
  shopping: navigationContext
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