// Database type definitions for Supabase
// This will be generated from Supabase CLI in the future

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string | null
          default_budget: number | null
          preferences: any // JSON object
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name?: string | null
          default_budget?: number | null
          preferences?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string | null
          default_budget?: number | null
          preferences?: any
          created_at?: string
          updated_at?: string
        }
      }
      retailers: {
        Row: {
          id: string
          user_id: string
          name: string
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shopping_trips: {
        Row: {
          id: string
          user_id: string
          retailer_id: string
          name: string
          date: string
          status: 'planned' | 'active' | 'completed' | 'archived'
          estimated_total: number
          actual_total: number
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          retailer_id: string
          name: string
          date: string
          status?: 'planned' | 'active' | 'completed' | 'archived'
          estimated_total?: number
          actual_total?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          retailer_id?: string
          name?: string
          date?: string
          status?: 'planned' | 'active' | 'completed' | 'archived'
          estimated_total?: number
          actual_total?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      trip_items: {
        Row: {
          id: string
          trip_id: string
          item_name: string
          quantity: number
          estimated_price: number | null
          actual_price: number | null
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          item_name: string
          quantity: number
          estimated_price?: number | null
          actual_price?: number | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          item_name?: string
          quantity?: number
          estimated_price?: number | null
          actual_price?: number | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      price_history: {
        Row: {
          id: string
          user_id: string
          item_name: string
          price: number
          retailer_id: string
          trip_id: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_name: string
          price: number
          retailer_id: string
          trip_id: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_name?: string
          price?: number
          retailer_id?: string
          trip_id?: string
          date?: string
          created_at?: string
        }
      }
    }
  }
}