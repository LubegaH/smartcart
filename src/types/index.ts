// Core data types based on functional requirements

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
  profile?: UserProfile
}

export interface UserProfile {
  id: string
  user_id: string
  display_name?: string
  default_budget?: number
  preferences: UserPreferences
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  notifications_enabled: boolean
  dark_mode: boolean
  default_currency: string
}

export interface Retailer {
  id: string
  user_id: string
  name: string
  location?: string
  created_at: string
  updated_at: string
  trip_count?: number // calculated field
}

export interface ShoppingTrip {
  id: string
  user_id: string
  retailer_id: string
  name: string
  date: string // ISO date string
  status: TripStatus
  estimated_total: number
  actual_total: number
  created_at: string
  updated_at: string
  completed_at?: string
  retailer?: Retailer // populated via join
  items?: TripItem[] // populated via join
}

export type TripStatus = 'planned' | 'active' | 'completed' | 'archived'

export interface TripItem {
  id: string
  trip_id: string
  item_name: string
  quantity: number
  estimated_price?: number
  actual_price?: number
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface PriceHistory {
  id: string
  user_id: string
  item_name: string
  price: number
  retailer_id: string
  trip_id: string
  date: string // ISO date string
  created_at: string
}

export interface PriceSuggestion {
  estimated: number | null
  confidence: 'high' | 'medium' | 'low'
  last_paid?: number
  last_paid_date?: string
  retailer_name?: string
}

// API Response types
export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string }

// Form types
export interface CreateTripRequest {
  name: string
  date: string
  retailer_id: string
  estimated_total?: number
}

export interface CreateItemRequest {
  item_name: string
  quantity: number
  estimated_price?: number
}

export interface UpdatePriceRequest {
  actual_price: number
}

// UI State types
export interface MonthlyStats {
  spent: number
  budget: number
  percentUsed: number
  status: 'good' | 'warning' | 'over'
}