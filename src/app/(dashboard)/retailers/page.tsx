'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RetailerList } from '@/components/retailers/retailer-list'
import { dataService } from '@/lib/data'
import type { Retailer } from '@/types'

export default function RetailersPage() {
  const router = useRouter()
  const [retailers, setRetailers] = useState<Retailer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRetailers = async () => {
    try {
      setError(null)
      const result = await dataService.retailers.getAll()
      
      if (result.success) {
        setRetailers(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to load retailers')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRetailers()
  }, [])

  const handleEdit = (retailer: Retailer) => {
    router.push(`/retailers/${retailer.id}/edit`)
  }

  const handleRefresh = () => {
    loadRetailers()
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Your retailers
            </h1>
            <p className="mt-2 text-gray-600 flex items-center">
              <svg className="mr-2 h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v7.5" />
              </svg>
              Manage the stores where you shop
            </p>
          </div>
          <Button 
            onClick={() => router.push('/retailers/new')}
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add retailer
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600 mr-4">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Unable to load retailers</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-red-300 text-red-700 hover:bg-red-50"
                  onClick={handleRefresh}
                >
                  Try again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Retailer List */}
        <RetailerList
          retailers={retailers}
          onEdit={handleEdit}
          onRefresh={handleRefresh}
          emptyStateAction={
            <Button 
              onClick={() => router.push('/retailers/new')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add your first retailer
            </Button>
          }
        />
      </div>
    </div>
  )
}