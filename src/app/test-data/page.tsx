'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/auth'
import { 
  retailerService, 
  tripService, 
  tripItemService, 
  priceIntelligenceService 
} from '@/lib/data'
import type { Retailer, ShoppingTrip, TripItem } from '@/types'

export default function TestDataPage() {
  const { user } = useAuthStore()
  const [message, setMessage] = React.useState<string>('')
  const [error, setError] = React.useState<string>('')
  const [retailers, setRetailers] = React.useState<Retailer[]>([])
  const [trips, setTrips] = React.useState<ShoppingTrip[]>([])
  const [selectedTrip, setSelectedTrip] = React.useState<ShoppingTrip | null>(null)
  const [tripItems, setTripItems] = React.useState<TripItem[]>([])
  const [loading, setLoading] = React.useState(false)

  // Form states
  const [retailerName, setRetailerName] = React.useState('')
  const [retailerLocation, setRetailerLocation] = React.useState('')
  const [tripName, setTripName] = React.useState('')
  const [selectedRetailerId, setSelectedRetailerId] = React.useState('')
  const [itemName, setItemName] = React.useState('')
  const [itemQuantity, setItemQuantity] = React.useState('1')
  const [itemPrice, setItemPrice] = React.useState('')

  const clearMessages = () => {
    setMessage('')
    setError('')
  }

  const showMessage = (msg: string) => {
    setMessage(msg)
    setError('')
  }

  const showError = (err: string) => {
    setError(err)
    setMessage('')
  }

  // Load initial data
  const loadRetailers = async () => {
    setLoading(true)
    const result = await retailerService.getRetailers()
    if (result.success) {
      setRetailers(result.data)
      showMessage(`Loaded ${result.data.length} retailers`)
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  const loadTrips = async () => {
    setLoading(true)
    const result = await tripService.getTrips()
    if (result.success) {
      setTrips(result.data)
      showMessage(`Loaded ${result.data.length} trips`)
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  const loadTripItems = async (tripId: string) => {
    setLoading(true)
    const result = await tripItemService.getItems(tripId)
    if (result.success) {
      setTripItems(result.data)
      showMessage(`Loaded ${result.data.length} items`)
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  // Create operations
  const createRetailer = async () => {
    if (!retailerName.trim()) {
      showError('Retailer name is required')
      return
    }

    setLoading(true)
    const result = await retailerService.createRetailer({
      name: retailerName,
      location: retailerLocation || undefined
    })
    
    if (result.success) {
      showMessage(`Created retailer: ${result.data.name}`)
      setRetailerName('')
      setRetailerLocation('')
      loadRetailers()
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
    const result = await tripService.createTrip({
      name: tripName,
      date: new Date().toISOString().split('T')[0],
      retailer_id: selectedRetailerId
    })
    
    if (result.success) {
      showMessage(`Created trip: ${result.data.name}`)
      setTripName('')
      loadTrips()
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  const addItem = async () => {
    if (!selectedTrip || !itemName.trim()) {
      showError('Select a trip and enter item name')
      return
    }

    setLoading(true)
    const result = await tripItemService.createItem(selectedTrip.id, {
      item_name: itemName,
      quantity: parseFloat(itemQuantity) || 1,
      estimated_price: itemPrice ? parseFloat(itemPrice) : undefined
    })
    
    if (result.success) {
      showMessage(`Added item: ${result.data.item_name}`)
      setItemName('')
      setItemPrice('')
      loadTripItems(selectedTrip.id)
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  const updateItemPrice = async (itemId: string, actualPrice: number) => {
    setLoading(true)
    const result = await tripItemService.updatePrice(itemId, actualPrice)
    
    if (result.success) {
      showMessage(`Updated price to $${actualPrice}`)
      if (selectedTrip) {
        loadTripItems(selectedTrip.id)
      }
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  const toggleItemCompleted = async (itemId: string) => {
    setLoading(true)
    const result = await tripItemService.toggleCompleted(itemId)
    
    if (result.success) {
      showMessage(`Item ${result.data.is_completed ? 'completed' : 'uncompleted'}`)
      if (selectedTrip) {
        loadTripItems(selectedTrip.id)
      }
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  const getPriceSuggestion = async (itemName: string, retailerId: string) => {
    setLoading(true)
    const result = await priceIntelligenceService.getPriceSuggestion(itemName, retailerId)
    
    if (result.success) {
      const suggestion = result.data
      if (suggestion.estimated !== null) {
        showMessage(`Price suggestion: $${suggestion.estimated} (${suggestion.confidence} confidence)`)
      } else {
        showMessage('No price history available for this item')
      }
    } else {
      showError(result.error)
    }
    setLoading(false)
  }

  React.useEffect(() => {
    if (user) {
      loadRetailers()
      loadTrips()
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Data Layer Testing</h1>
          <p className="text-gray-600">Please sign in to test the data services</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Data Layer Testing</h1>
          <p className="text-gray-600 mt-2">Test all data services and database operations</p>
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

        {/* Retailers Section */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Retailers ({retailers.length})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              placeholder="Retailer name"
              value={retailerName}
              onChange={(e) => setRetailerName(e.target.value)}
            />
            <Input
              placeholder="Location (optional)"
              value={retailerLocation}
              onChange={(e) => setRetailerLocation(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 mb-4">
            <Button onClick={createRetailer} disabled={loading}>
              Create Retailer
            </Button>
            <Button variant="outline" onClick={loadRetailers} disabled={loading}>
              Refresh
            </Button>
          </div>

          <div className="space-y-2">
            {retailers.map((retailer) => (
              <div key={retailer.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-medium">{retailer.name}</span>
                  {retailer.location && <span className="text-gray-600 ml-2">• {retailer.location}</span>}
                  <span className="text-gray-500 ml-2">• {retailer.trip_count || 0} trips</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trips Section */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Shopping Trips ({trips.length})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              placeholder="Trip name"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
            />
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
          </div>
          
          <div className="flex gap-2 mb-4">
            <Button onClick={createTrip} disabled={loading}>
              Create Trip
            </Button>
            <Button variant="outline" onClick={loadTrips} disabled={loading}>
              Refresh
            </Button>
          </div>

          <div className="space-y-2">
            {trips.map((trip) => (
              <div 
                key={trip.id} 
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  selectedTrip?.id === trip.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  setSelectedTrip(trip)
                  loadTripItems(trip.id)
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{trip.name}</span>
                    <span className="text-gray-600 ml-2">• {trip.retailer?.name}</span>
                    <span className="text-gray-500 ml-2">• {trip.status}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Est: ${trip.estimated_total}</div>
                    <div className="text-sm text-gray-600">Act: ${trip.actual_total}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trip Items Section */}
        {selectedTrip && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">
              Items for {selectedTrip.name} ({tripItems.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Input
                placeholder="Item name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Quantity"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Estimated price"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 mb-4">
              <Button onClick={addItem} disabled={loading}>
                Add Item
              </Button>
              <Button 
                variant="outline" 
                onClick={() => loadTripItems(selectedTrip.id)} 
                disabled={loading}
              >
                Refresh
              </Button>
              {itemName && selectedTrip.retailer_id && (
                <Button 
                  variant="outline"
                  onClick={() => getPriceSuggestion(itemName, selectedTrip.retailer_id)}
                  disabled={loading}
                >
                  Get Price Suggestion
                </Button>
              )}
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
                      <span className="text-gray-600 ml-2">• Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        Est: ${item.estimated_price || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Act: ${item.actual_price || 'N/A'}
                      </div>
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

        {/* Actions */}
        <div className="text-center">
          <Button variant="outline" onClick={clearMessages}>
            Clear Messages
          </Button>
        </div>
      </div>
    </div>
  )
}