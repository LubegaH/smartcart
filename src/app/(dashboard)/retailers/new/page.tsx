'use client'

import { useRouter } from 'next/navigation'
import { RetailerForm } from '@/components/retailers/retailer-form'
import type { Retailer } from '@/types'

export default function NewRetailerPage() {
  const router = useRouter()

  const handleSuccess = (retailer: Retailer) => {
    // Navigate back to retailers list with success indication
    router.push('/retailers?created=true')
  }

  const handleCancel = () => {
    router.back()
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
            Add retailer
          </h1>
          <p className="mt-2 text-gray-600">
            Add a new store where you shop to track prices and organize trips
          </p>
        </div>

        {/* Form */}
        <div className="shadow-lg">
          <RetailerForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  )
}