import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { supabase } from '../supabase'

// Note: These are integration tests that require a working Supabase connection
// They test the database triggers and price history functionality

describe('Database Triggers and Price History', () => {
  // Test data
  let testUserId: string
  let testRetailerId: string
  let testTripId: string
  let testItemId: string

  // Skip these tests if we don't have a working Supabase connection
  const skipIfNoSupabase = () => {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.warn('Skipping database integration tests: Supabase credentials not configured')
      return true
    }
    return false
  }

  beforeAll(async () => {
    if (skipIfNoSupabase()) return

    try {
      // Create test user session (in real app, this would be handled by auth)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.warn('Skipping database tests: No authenticated user')
        return
      }
      testUserId = user.id
    } catch (error) {
      console.warn('Skipping database tests: Auth error', error)
    }
  })

  beforeEach(async () => {
    if (skipIfNoSupabase() || !testUserId) return

    // Clean up any existing test data
    await supabase.from('price_history').delete().like('item_name', 'test_%')
    await supabase.from('trip_items').delete().like('item_name', 'test_%')
    await supabase.from('shopping_trips').delete().like('name', 'Test Trip%')
    await supabase.from('retailers').delete().like('name', 'Test Retailer%')

    // Create test retailer
    const { data: retailerData, error: retailerError } = await supabase
      .from('retailers')
      .insert({
        user_id: testUserId,
        name: 'Test Retailer',
        location: 'Test Location'
      })
      .select()
      .single()

    if (retailerError) throw retailerError
    testRetailerId = retailerData.id

    // Create test trip
    const { data: tripData, error: tripError } = await supabase
      .from('shopping_trips')
      .insert({
        user_id: testUserId,
        retailer_id: testRetailerId,
        name: 'Test Trip',
        date: new Date().toISOString().split('T')[0],
        status: 'planned'
      })
      .select()
      .single()

    if (tripError) throw tripError
    testTripId = tripData.id

    // Create test item
    const { data: itemData, error: itemError } = await supabase
      .from('trip_items')
      .insert({
        trip_id: testTripId,
        item_name: 'test_milk',
        quantity: 1,
        estimated_price: 3.99
      })
      .select()
      .single()

    if (itemError) throw itemError
    testItemId = itemData.id
  })

  afterAll(async () => {
    if (skipIfNoSupabase()) return

    // Clean up test data
    try {
      await supabase.from('price_history').delete().like('item_name', 'test_%')
      await supabase.from('trip_items').delete().like('item_name', 'test_%')
      await supabase.from('shopping_trips').delete().like('name', 'Test Trip%')
      await supabase.from('retailers').delete().like('name', 'Test Retailer%')
    } catch (error) {
      console.warn('Error cleaning up test data:', error)
    }
  })

  it('should automatically record price history when actual_price is set', async () => {
    if (skipIfNoSupabase() || !testItemId) {
      console.warn('Skipping test: No test setup')
      return
    }

    // Update item with actual price
    const { error: updateError } = await supabase
      .from('trip_items')
      .update({ actual_price: 4.29 })
      .eq('id', testItemId)

    expect(updateError).toBeNull()

    // Wait for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check that price history was recorded
    const { data: priceHistory, error: historyError } = await supabase
      .from('price_history')
      .select('*')
      .eq('item_name', 'test_milk')
      .eq('user_id', testUserId)

    expect(historyError).toBeNull()
    expect(priceHistory).toHaveLength(1)
    expect(priceHistory![0].price).toBe(4.29)
    expect(priceHistory![0].retailer_id).toBe(testRetailerId)
    expect(priceHistory![0].trip_id).toBe(testTripId)
  })

  it('should record new price history when actual_price changes', async () => {
    if (skipIfNoSupabase() || !testItemId) {
      console.warn('Skipping test: No test setup')
      return
    }

    // First update
    await supabase
      .from('trip_items')
      .update({ actual_price: 3.50 })
      .eq('id', testItemId)

    await new Promise(resolve => setTimeout(resolve, 100))

    // Second update
    await supabase
      .from('trip_items')
      .update({ actual_price: 3.75 })
      .eq('id', testItemId)

    await new Promise(resolve => setTimeout(resolve, 100))

    // Check that both price records exist
    const { data: priceHistory } = await supabase
      .from('price_history')
      .select('*')
      .eq('item_name', 'test_milk')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: true })

    expect(priceHistory).toHaveLength(2)
    expect(priceHistory![0].price).toBe(3.50)
    expect(priceHistory![1].price).toBe(3.75)
  })

  it('should not record price history for estimated_price changes', async () => {
    if (skipIfNoSupabase() || !testItemId) {
      console.warn('Skipping test: No test setup')
      return
    }

    // Update estimated price only
    const { error: updateError } = await supabase
      .from('trip_items')
      .update({ estimated_price: 5.99 })
      .eq('id', testItemId)

    expect(updateError).toBeNull()

    await new Promise(resolve => setTimeout(resolve, 100))

    // Check that no price history was recorded
    const { data: priceHistory } = await supabase
      .from('price_history')
      .select('*')
      .eq('item_name', 'test_milk')
      .eq('user_id', testUserId)

    expect(priceHistory).toHaveLength(0)
  })

  it('should automatically update trip totals when item prices change', async () => {
    if (skipIfNoSupabase() || !testTripId) {
      console.warn('Skipping test: No test setup')
      return
    }

    // Add another item to the trip
    const { error: insertError } = await supabase
      .from('trip_items')
      .insert({
        trip_id: testTripId,
        item_name: 'test_bread',
        quantity: 2,
        estimated_price: 2.99
      })

    expect(insertError).toBeNull()

    await new Promise(resolve => setTimeout(resolve, 100))

    // Check initial trip totals
    let { data: tripData } = await supabase
      .from('shopping_trips')
      .select('estimated_total, actual_total')
      .eq('id', testTripId)
      .single()

    expect(tripData!.estimated_total).toBe(9.97) // 3.99 + (2 * 2.99)
    expect(tripData!.actual_total).toBe(0) // No actual prices set yet

    // Update actual prices
    await supabase
      .from('trip_items')
      .update({ actual_price: 4.50 })
      .eq('id', testItemId) // test_milk

    await supabase
      .from('trip_items')
      .update({ actual_price: 3.25 })
      .eq('item_name', 'test_bread')
      .eq('trip_id', testTripId)

    await new Promise(resolve => setTimeout(resolve, 100))

    // Check updated trip totals
    const { data: updatedTripData } = await supabase
      .from('shopping_trips')
      .select('estimated_total, actual_total')
      .eq('id', testTripId)
      .single()

    expect(updatedTripData!.estimated_total).toBe(9.97) // Unchanged
    expect(updatedTripData!.actual_total).toBe(11.00) // 4.50 + (2 * 3.25)
  })

  it('should maintain data integrity with proper foreign key relationships', async () => {
    if (skipIfNoSupabase() || !testUserId) {
      console.warn('Skipping test: No test setup')
      return
    }

    // Set actual price to create price history
    await supabase
      .from('trip_items')
      .update({ actual_price: 3.99 })
      .eq('id', testItemId)

    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify price history has correct relationships
    const { data: priceHistory } = await supabase
      .from('price_history')
      .select(`
        *,
        retailer:retailers(name),
        trip:shopping_trips(name)
      `)
      .eq('item_name', 'test_milk')
      .eq('user_id', testUserId)
      .single()

    expect(priceHistory!.retailer.name).toBe('Test Retailer')
    expect(priceHistory!.trip.name).toBe('Test Trip')
    expect(priceHistory!.user_id).toBe(testUserId)
    expect(priceHistory!.retailer_id).toBe(testRetailerId)
    expect(priceHistory!.trip_id).toBe(testTripId)
  })

  it('should respect row level security policies', async () => {
    if (skipIfNoSupabase() || !testUserId) {
      console.warn('Skipping test: No test setup')
      return
    }

    // Create price history entry
    await supabase
      .from('trip_items')
      .update({ actual_price: 2.99 })
      .eq('id', testItemId)

    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify user can only see their own price history
    const { data: priceHistory } = await supabase
      .from('price_history')
      .select('*')
      .eq('item_name', 'test_milk')

    expect(priceHistory).toHaveLength(1)
    expect(priceHistory![0].user_id).toBe(testUserId)

    // Verify user cannot access other users' data by manually querying with different user_id
    // (This would fail due to RLS policies)
    const { data: otherUserData } = await supabase
      .from('price_history')
      .select('*')
      .neq('user_id', testUserId)

    expect(otherUserData).toHaveLength(0)
  })

  it('should handle concurrent price updates correctly', async () => {
    if (skipIfNoSupabase() || !testItemId) {
      console.warn('Skipping test: No test setup')
      return
    }

    // Create multiple items for concurrent testing
    const items = await Promise.all([
      supabase.from('trip_items').insert({
        trip_id: testTripId,
        item_name: 'test_concurrent_1',
        quantity: 1,
        estimated_price: 1.99
      }).select().single(),
      supabase.from('trip_items').insert({
        trip_id: testTripId,
        item_name: 'test_concurrent_2',
        quantity: 1,
        estimated_price: 2.99
      }).select().single()
    ])

    const item1Id = items[0].data!.id
    const item2Id = items[1].data!.id

    // Update prices concurrently
    await Promise.all([
      supabase.from('trip_items').update({ actual_price: 2.25 }).eq('id', item1Id),
      supabase.from('trip_items').update({ actual_price: 3.25 }).eq('id', item2Id)
    ])

    await new Promise(resolve => setTimeout(resolve, 200))

    // Verify both price histories were recorded
    const { data: priceHistory } = await supabase
      .from('price_history')
      .select('*')
      .in('item_name', ['test_concurrent_1', 'test_concurrent_2'])
      .eq('user_id', testUserId)

    expect(priceHistory).toHaveLength(2)
    
    const prices = priceHistory!.map(p => p.price).sort()
    expect(prices).toEqual([2.25, 3.25])
  })

  // Performance test for price intelligence queries
  it('should perform price intelligence queries efficiently', async () => {
    if (skipIfNoSupabase() || !testUserId) {
      console.warn('Skipping test: No test setup')
      return
    }

    // Create multiple price history entries
    const historyEntries = Array.from({ length: 10 }, (_, i) => ({
      user_id: testUserId,
      item_name: 'test_performance_item',
      price: 3.99 + (i * 0.10),
      retailer_id: testRetailerId,
      trip_id: testTripId,
      date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
    }))

    const { error: insertError } = await supabase
      .from('price_history')
      .insert(historyEntries)

    expect(insertError).toBeNull()

    // Test query performance (should complete quickly)
    const startTime = Date.now()
    
    const { data: recentPrices, error: queryError } = await supabase
      .from('price_history')
      .select(`
        price,
        date,
        retailer:retailers(name)
      `)
      .eq('user_id', testUserId)
      .eq('retailer_id', testRetailerId)
      .ilike('item_name', 'test_performance_item')
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(5)

    const queryTime = Date.now() - startTime

    expect(queryError).toBeNull()
    expect(recentPrices).toHaveLength(5)
    expect(queryTime).toBeLessThan(1000) // Should complete in less than 1 second
  })
})