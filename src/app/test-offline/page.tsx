'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/auth'
import { dataService } from '@/lib/data'
import { useOnlineStatus } from '@/components/ui/offline-indicator'
import type { Retailer, ShoppingTrip, TripItem } from '@/types'

export default function TestOfflinePage() {
  const { user } = useAuthStore()
  const isOnline = useOnlineStatus()
  const [message, setMessage] = React.useState<string>('')
  const [error, setError] = React.useState<string>('')
  const [retailers, setRetailers] = React.useState<Retailer[]>([])
  const [trips, setTrips] = React.useState<ShoppingTrip[]>([])
  const [activeTrip, setActiveTrip] = React.useState<ShoppingTrip | null>(null)
  const [tripItems, setTripItems] = React.useState<TripItem[]>([])
  const [queueSize, setQueueSize] = React.useState(0)
  const [loading, setLoading] = React.useState(false)

  // Form states
  const [retailerName, setRetailerName] = React.useState('')
  const [tripName, setTripName] = React.useState('')
  const [selectedRetailerId, setSelectedRetailerId] = React.useState('')
  const [itemName, setItemName] = React.useState('')
  const [itemPrice, setItemPrice] = React.useState('')

  const showMessage = (msg: string) => {
    setMessage(msg)
    setError('')
  }

  const showError = (err: string) => {
    setError(err)
    setMessage('')
  }

  // Load data
  const loadRetailers = async () => {
    setLoading(true)
    const result = await dataService.retailers.getAll()
    if (result.success) {
      setRetailers(result.data)
      showMessage(`Loaded ${result.data.length} retailers ${isOnline ? '(online)' : '(cached)'}`)
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  const loadTrips = async () => {
    setLoading(true)
    const result = await dataService.trips.getAll()
    if (result.success) {
      setTrips(result.data)
      showMessage(`Loaded ${result.data.length} trips ${isOnline ? '(online)' : '(cached)'}`)
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  const loadActiveTrip = async () => {
    const result = await dataService.trips.getActive()
    if (result.success) {
      setActiveTrip(result.data)
      if (result.data) {
        loadTripItems(result.data.id)
      }
    }
  }

  const loadTripItems = async (tripId: string) => {
    setLoading(true)
    const result = await dataService.tripItems.getByTripId(tripId)
    if (result.success) {
      setTripItems(result.data)
      showMessage(`Loaded ${result.data.length} items ${isOnline ? '(online)' : '(cached)'}`)
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  const updateQueueSize = async () => {
    const size = await dataService.sync.getQueueSize()
    setQueueSize(size)
  }

  // Create operations (work offline)
  const createRetailer = async () => {
    if (!retailerName.trim()) {
      showError('Retailer name is required')
      return
    }

    setLoading(true)
    const result = await dataService.retailers.create({
      name: retailerName,
      location: undefined
    })
    
    if (result.success) {
      showMessage(`Created retailer: ${result.data.name} ${isOnline ? '(synced)' : '(queued)'}`)
      setRetailerName('')
      loadRetailers()
      updateQueueSize()
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  const createTrip = async () => {
    if (!tripName.trim() || !selectedRetailerId) {
      showError('Trip name and retailer are required')
      return
    }

    setLoading(true)
    const result = await dataService.trips.create({
      name: tripName,
      date: new Date().toISOString().split('T')[0],
      retailer_id: selectedRetailerId
    })
    
    if (result.success) {
      showMessage(`Created trip: ${result.data.name} ${isOnline ? '(synced)' : '(queued)'}`)
      setTripName('')
      loadTrips()
      updateQueueSize()
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  const addItem = async () => {
    if (!activeTrip || !itemName.trim()) {
      showError('Select an active trip and enter item name')
      return
    }

    setLoading(true)
    const result = await dataService.tripItems.create(activeTrip.id, {
      item_name: itemName,
      quantity: 1,
      estimated_price: itemPrice ? parseFloat(itemPrice) : undefined
    })
    
    if (result.success) {
      showMessage(`Added item: ${result.data.item_name} ${isOnline ? '(synced)' : '(queued)'}`)
      setItemName('')
      setItemPrice('')
      loadTripItems(activeTrip.id)
      updateQueueSize()
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  const updateItemPrice = async (itemId: string, actualPrice: number) => {
    setLoading(true)
    const result = await dataService.tripItems.updatePrice(itemId, actualPrice)
    
    if (result.success) {
      showMessage(`Updated price to $${actualPrice} ${isOnline ? '(synced)' : '(queued)'}`)
      if (activeTrip) {
        loadTripItems(activeTrip.id)
      }
      updateQueueSize()
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  const toggleItemCompleted = async (itemId: string) => {
    setLoading(true)
    const result = await dataService.tripItems.toggleCompleted(itemId)
    
    if (result.success) {
      showMessage(`Item ${result.data.is_completed ? 'completed' : 'uncompleted'} ${isOnline ? '(synced)' : '(queued)'}`)
      if (activeTrip) {
        loadTripItems(activeTrip.id)
      }
      updateQueueSize()
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  const setTripActive = async (tripId: string) => {
    setLoading(true)
    const result = await dataService.trips.updateStatus(tripId, 'active')
    
    if (result.success) {
      showMessage(`Trip activated ${isOnline ? '(synced)' : '(queued)'}`)
      loadTrips()
      loadActiveTrip()
      updateQueueSize()
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  const syncNow = async () => {
    if (!isOnline) {
      showError('Cannot sync while offline')
      return
    }

    setLoading(true)
    const result = await dataService.sync.syncPendingChanges()
    showMessage(`Sync complete: ${result.synced} synced, ${result.failed} failed`)
    
    // Refresh all data after sync
    await Promise.all([
      loadRetailers(),
      loadTrips(),
      loadActiveTrip(),
      updateQueueSize()
    ])
    setLoading(false)
  }

  React.useEffect(() => {
    if (user) {
      loadRetailers()
      loadTrips()
      loadActiveTrip()
      updateQueueSize()
    }
  }, [user])

  React.useEffect(() => {
    updateQueueSize()
  }, [])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Offline-First Data Testing</h1>
          <p className="text-gray-600">Please sign in to test offline functionality</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Offline-First Data Testing</h1>
          <p className="text-gray-600 mt-2">Test data operations while online and offline</p>
        </div>

        {/* Status Bar */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <div className="text-gray-600">
                Queue: {queueSize} pending {queueSize === 1 ? 'action' : 'actions'}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={updateQueueSize}
                disabled={loading}
              >
                Refresh Status
              </Button>
              {isOnline && queueSize > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={syncNow}
                  disabled={loading}
                >
                  Sync Now ({queueSize})
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <Alert variant="success">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Alert>
          <AlertTitle>Testing Instructions</AlertTitle>
          <AlertDescription>
            1. Create some data while online<br/>
            2. Disable internet (Chrome DevTools → Network → Offline)<br/>
            3. Try creating/updating data - it should work and queue for sync<br/>
            4. Re-enable internet - sync should happen automatically
          </AlertDescription>
        </Alert>

        {/* Retailers Section */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Retailers ({retailers.length})</h2>
          
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Retailer name"
              value={retailerName}
              onChange={(e) => setRetailerName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={createRetailer} disabled={loading}>
              Create Retailer
            </Button>
          </div>

          <div className="space-y-2">
            {retailers.map((retailer) => (
              <div key={retailer.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-medium">{retailer.name}</span>
                  {retailer.id.startsWith('temp_') && (
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      Queued
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trips Section */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Shopping Trips ({trips.length})</h2>
          
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Trip name"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="flex-1"
            />
            <select
              className="px-3 py-2 border border-gray-300 rounded-md"
              value={selectedRetailerId}
              onChange={(e) => setSelectedRetailerId(e.target.value)}
            >
              <option value="">Select retailer...</option>
              {retailers.map((retailer) => (
                <option key={retailer.id} value={retailer.id}>
                  {retailer.name}
                </option>
              ))}
            </select>
            <Button onClick={createTrip} disabled={loading}>
              Create Trip
            </Button>
          </div>

          <div className="space-y-2">
            {trips.map((trip) => (
              <div key={trip.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-medium">{trip.name}</span>
                  <span className="text-gray-600 ml-2">• {trip.status}</span>
                  {trip.id.startsWith('temp_') && (
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      Queued
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    ${trip.estimated_total} / ${trip.actual_total}
                  </span>
                  {trip.status !== 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTripActive(trip.id)}
                    >
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Trip Items */}
        {activeTrip && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">
              Active Trip: {activeTrip.name} ({tripItems.length} items)
            </h2>
            
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Item name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Est. price"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
              />
              <Button onClick={addItem} disabled={loading}>
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {tripItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleItemCompleted(item.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        item.is_completed 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-gray-300'
                      }`}
                    >
                      {item.is_completed && '✓'}
                    </button>
                    <div>
                      <span className={`font-medium ${item.is_completed ? 'line-through text-gray-500' : ''}`}>
                        {item.item_name}
                      </span>
                      {item.id.startsWith('temp_') && (
                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                          Queued
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm">
                      <div>Est: ${item.estimated_price || 'N/A'}</div>
                      <div>Act: ${item.actual_price || 'N/A'}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const price = prompt('Enter actual price:')
                        if (price && !isNaN(parseFloat(price))) {
                          updateItemPrice(item.id, parseFloat(price))
                        }
                      }}
                    >
                      Update Price
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}