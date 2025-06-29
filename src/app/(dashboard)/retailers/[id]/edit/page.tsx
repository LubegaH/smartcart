'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { RetailerForm } from '@/components/retailers/retailer-form'
import { dataService } from '@/lib/data'
import type { Retailer } from '@/types'

export default function EditRetailerPage() {
  const router = useRouter()
  const params = useParams()
  const retailerId = params.id as string

  const [retailer, setRetailer] = useState<Retailer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRetailer = async () => {
      try {
        const result = await dataService.retailers.getById(retailerId)
        
        if (result.success) {
          setRetailer(result.data)
        } else {
          setError(result.error)
        }
      } catch (err) {
        setError('Failed to load retailer')
      } finally {
        setIsLoading(false)
      }
    }

    if (retailerId) {
      loadRetailer()
    }
  }, [retailerId])

  const handleSuccess = (updatedRetailer: Retailer) => {
    // Navigate back to retailers list with success indication
    router.push('/retailers?updated=true')
  }

  const handleCancel = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="space-y-6">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-11 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-11 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !retailer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Retailer not found
          </h3>
          <p className="text-gray-500 mb-6">
            {error || 'The retailer you&apos;re looking for doesn&apos;t exist or may have been deleted.'}
          </p>
          <button
            onClick={() => router.push('/retailers')}
            className="text-primary hover:text-primary/80"
          >
            Back to retailers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-600 hover:text-emerald-600 mb-6 transition-colors group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to retailers
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Edit retailer
          </h1>
          <p className="mt-2 text-gray-600">
            Update information for <span className="font-semibold text-gray-900">{retailer.name}</span>
            {retailer.location && <span className="text-gray-500"> ({retailer.location})</span>}
          </p>
        </div>

        {/* Form */}
        <div className="shadow-lg">
          <RetailerForm
            retailer={retailer}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  )
}