// Price intelligence and history service
import { supabase } from './supabase'
import type { PriceHistory, PriceSuggestion, Result } from '@/types'

export const priceIntelligenceService = {
  /**
   * Get price suggestion for an item at a specific retailer
   */
  async getPriceSuggestion(itemName: string, retailerId: string): Promise<Result<PriceSuggestion>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      const normalizedItemName = itemName.toLowerCase().trim()

      // Priority 1: Same item, same retailer, last 30 days
      let { data: recentSameRetailer } = await supabase
        .from('price_history')
        .select(`
          price,
          date,
          retailer:retailers(name)
        `)
        .eq('user_id', user.id)
        .eq('retailer_id', retailerId)
        .ilike('item_name', normalizedItemName)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(1)

      if (recentSameRetailer && recentSameRetailer.length > 0) {
        const record = recentSameRetailer[0]
        return {
          success: true,
          data: {
            estimated: record.price,
            confidence: 'high',
            last_paid: record.price,
            last_paid_date: record.date,
            retailer_name: record.retailer.name
          }
        }
      }

      // Priority 2: Same item, same retailer, last 90 days
      let { data: olderSameRetailer } = await supabase
        .from('price_history')
        .select(`
          price,
          date,
          retailer:retailers(name)
        `)
        .eq('user_id', user.id)
        .eq('retailer_id', retailerId)
        .ilike('item_name', normalizedItemName)
        .gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(1)

      if (olderSameRetailer && olderSameRetailer.length > 0) {
        const record = olderSameRetailer[0]
        return {
          success: true,
          data: {
            estimated: record.price,
            confidence: 'medium',
            last_paid: record.price,
            last_paid_date: record.date,
            retailer_name: record.retailer.name
          }
        }
      }

      // Priority 3: Same item, any retailer, last 30 days
      let { data: recentAnyRetailer } = await supabase
        .from('price_history')
        .select(`
          price,
          date,
          retailer:retailers(name)
        `)
        .eq('user_id', user.id)
        .ilike('item_name', normalizedItemName)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(1)

      if (recentAnyRetailer && recentAnyRetailer.length > 0) {
        const record = recentAnyRetailer[0]
        return {
          success: true,
          data: {
            estimated: record.price,
            confidence: 'medium',
            last_paid: record.price,
            last_paid_date: record.date,
            retailer_name: record.retailer.name
          }
        }
      }

      // Priority 4: Fuzzy match on item name, same retailer
      let { data: fuzzyMatch } = await supabase
        .from('price_history')
        .select(`
          price,
          date,
          item_name,
          retailer:retailers(name)
        `)
        .eq('user_id', user.id)
        .eq('retailer_id', retailerId)
        .order('date', { ascending: false })
        .limit(20) // Get recent records for fuzzy matching

      if (fuzzyMatch && fuzzyMatch.length > 0) {
        // Simple fuzzy matching: check for partial matches
        const fuzzyMatches = fuzzyMatch.filter(record => {
          const recordName = record.item_name.toLowerCase()
          const searchTerms = normalizedItemName.split(' ')
          return searchTerms.some(term => recordName.includes(term) && term.length > 2)
        })

        if (fuzzyMatches.length > 0) {
          const record = fuzzyMatches[0]
          return {
            success: true,
            data: {
              estimated: record.price,
              confidence: 'low',
              last_paid: record.price,
              last_paid_date: record.date,
              retailer_name: record.retailer.name
            }
          }
        }
      }

      // No suggestion available
      return {
        success: true,
        data: {
          estimated: null,
          confidence: 'low'
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to get price suggestion' }
    }
  },

  /**
   * Get complete price history for an item
   */
  async getPriceHistory(itemName: string, limit = 50): Promise<Result<PriceHistory[]>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data: history, error } = await supabase
        .from('price_history')
        .select(`
          *,
          retailer:retailers(name, location)
        `)
        .eq('user_id', user.id)
        .ilike('item_name', itemName.toLowerCase().trim())
        .order('date', { ascending: false })
        .limit(limit)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: history || [] }
    } catch (error) {
      return { success: false, error: 'Failed to fetch price history' }
    }
  },

  /**
   * Get price trends for an item (average, min, max over time periods)
   */
  async getPriceTrends(itemName: string): Promise<Result<{
    last_30_days: { avg: number; min: number; max: number; count: number }
    last_90_days: { avg: number; min: number; max: number; count: number }
    all_time: { avg: number; min: number; max: number; count: number }
  }>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      const normalizedItemName = itemName.toLowerCase().trim()
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

      // Get all price history for this item
      const { data: allHistory, error } = await supabase
        .from('price_history')
        .select('price, date')
        .eq('user_id', user.id)
        .ilike('item_name', normalizedItemName)
        .order('date', { ascending: false })

      if (error) {
        return { success: false, error: error.message }
      }

      if (!allHistory || allHistory.length === 0) {
        const emptyStats = { avg: 0, min: 0, max: 0, count: 0 }
        return {
          success: true,
          data: {
            last_30_days: emptyStats,
            last_90_days: emptyStats,
            all_time: emptyStats
          }
        }
      }

      // Calculate stats for different time periods
      const calculateStats = (records: typeof allHistory) => {
        if (records.length === 0) return { avg: 0, min: 0, max: 0, count: 0 }
        
        const prices = records.map(r => r.price)
        return {
          avg: Math.round((prices.reduce((sum, p) => sum + p, 0) / prices.length) * 100) / 100,
          min: Math.min(...prices),
          max: Math.max(...prices),
          count: prices.length
        }
      }

      const last30Days = allHistory.filter(r => new Date(r.date) >= thirtyDaysAgo)
      const last90Days = allHistory.filter(r => new Date(r.date) >= ninetyDaysAgo)

      return {
        success: true,
        data: {
          last_30_days: calculateStats(last30Days),
          last_90_days: calculateStats(last90Days),
          all_time: calculateStats(allHistory)
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to calculate price trends' }
    }
  },

  /**
   * Get popular items (most frequently purchased)
   */
  async getPopularItems(limit = 20): Promise<Result<Array<{ item_name: string; count: number; avg_price: number }>>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data: items, error } = await supabase
        .from('price_history')
        .select('item_name, price')
        .eq('user_id', user.id)
        .gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      if (error) {
        return { success: false, error: error.message }
      }

      if (!items || items.length === 0) {
        return { success: true, data: [] }
      }

      // Group by item name and calculate stats
      const itemStats = new Map<string, { prices: number[]; count: number }>()
      
      items.forEach(item => {
        const key = item.item_name.toLowerCase().trim()
        if (!itemStats.has(key)) {
          itemStats.set(key, { prices: [], count: 0 })
        }
        const stats = itemStats.get(key)!
        stats.prices.push(item.price)
        stats.count++
      })

      // Convert to result format and sort by frequency
      const result = Array.from(itemStats.entries())
        .map(([item_name, stats]) => ({
          item_name,
          count: stats.count,
          avg_price: Math.round((stats.prices.reduce((sum, p) => sum + p, 0) / stats.prices.length) * 100) / 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)

      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: 'Failed to fetch popular items' }
    }
  }
}