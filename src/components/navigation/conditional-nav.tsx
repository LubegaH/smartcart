'use client'

import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { BottomNav } from './bottom-nav'

/**
 * ConditionalNav component that only renders the BottomNav on authenticated pages
 * Hides navigation on authentication pages (/auth/*) and when user is not authenticated
 */
export function ConditionalNav() {
  const pathname = usePathname()
  const { user, isInitialized } = useAuthStore()

  // Don't render anything until auth is initialized
  if (!isInitialized) {
    return null
  }

  // Check if current path is an auth page
  const isAuthPage = pathname.startsWith('/auth')

  // Only show navigation if:
  // 1. User is authenticated AND
  // 2. Not on an authentication page
  const shouldShowNavigation = user && !isAuthPage

  if (!shouldShowNavigation) {
    return null
  }

  return <BottomNav />
}