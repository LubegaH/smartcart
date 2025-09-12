'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HiHome, 
  HiShoppingBag, 
  HiBuildingStorefront, 
  HiUser 
} from 'react-icons/hi2'
import { cn } from '@/lib/utils'
import type { NavigationTab, BottomNavProps } from '@/types/navigation'

// Navigation configuration following SmartCart wireframe requirements
const navigationTabs: NavigationTab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: HiHome,
    href: '/dashboard',
    ariaLabel: 'Go to Dashboard - View overview and statistics'
  },
  {
    id: 'trips',
    label: 'Trips',
    icon: HiShoppingBag,
    href: '/trips',
    ariaLabel: 'Go to Shopping Trips - Manage your shopping lists'
  },
  {
    id: 'retailers',
    label: 'Retailers',
    icon: HiBuildingStorefront,
    href: '/retailers',
    ariaLabel: 'Go to Retailers - View and manage your favorite stores'
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: HiUser,
    href: '/profile',
    ariaLabel: 'Go to Profile - Manage your account and settings'
  }
]

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname()
  const [focusedTab, setFocusedTab] = React.useState<string | null>(null)

  // Determine active tab based on current route
  const getActiveTab = (path: string): string => {
    if (path.startsWith('/dashboard')) return 'dashboard'
    if (path.startsWith('/trips')) return 'trips'
    if (path.startsWith('/retailers')) return 'retailers'
    if (path.startsWith('/profile')) return 'profile'
    return 'dashboard' // Default fallback
  }

  const activeTab = getActiveTab(pathname)

  // Keyboard navigation handler
  const handleKeyDown = (event: React.KeyboardEvent, tabId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      // Navigation will be handled by Link component
    }
    
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const currentIndex = navigationTabs.findIndex(tab => tab.id === tabId)
      const direction = event.key === 'ArrowLeft' ? -1 : 1
      const nextIndex = (currentIndex + direction + navigationTabs.length) % navigationTabs.length
      const nextTab = navigationTabs[nextIndex]
      
      // Focus the next tab
      const nextElement = document.getElementById(`nav-tab-${nextTab.id}`)
      if (nextElement) {
        nextElement.focus()
      }
    }
  }

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        // Base positioning and layout
        'fixed bottom-0 left-0 right-0 z-50',
        // Background and visual styling
        'bg-background/95 backdrop-blur-sm border-t border-border',
        // Safe area handling for iOS devices
        'pb-safe-area-inset-bottom',
        // Shadow for elevation
        'shadow-large',
        className
      )}
    >
      {/* Navigation container with grid layout */}
      <div className="flex items-center justify-around px-2 pt-2 pb-2">
        {navigationTabs.map((tab) => {
          const isActive = activeTab === tab.id
          const isFocused = focusedTab === tab.id

          return (
            <Link
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              href={tab.href}
              role="tab"
              aria-label={tab.ariaLabel}
              aria-selected={isActive}
              tabIndex={0}
              onFocus={() => setFocusedTab(tab.id)}
              onBlur={() => setFocusedTab(null)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
              className={cn(
                // Base button styling with minimum touch targets (56px as per wireframes)
                'flex flex-col items-center justify-center',
                'min-h-[56px] min-w-[56px] touch-target-large',
                'px-3 py-2 rounded-lg',
                // Typography
                'text-xs font-medium',
                // Smooth transitions for all interactive states
                'transition-all duration-200 ease-in-out',
                // Focus visible styling for keyboard navigation
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                // Active state styling following design system
                isActive ? [
                  'text-primary bg-primary/10',
                  'shadow-inner-soft'
                ] : [
                  'text-muted-foreground',
                  'hover:text-foreground hover:bg-muted/50',
                ],
                // Focus state additional highlighting
                isFocused && 'bg-muted/30',
                // Pressed state for mobile touch feedback
                'active:scale-95 active:bg-primary/20'
              )}
            >
              {/* Icon with proper sizing and spacing */}
              <tab.icon 
                className={cn(
                  'w-6 h-6 mb-1 transition-transform duration-200',
                  isActive && 'scale-110',
                  isFocused && 'scale-105'
                )}
                aria-hidden="true"
              />
              
              {/* Label with responsive text sizing */}
              <span className="leading-tight text-center">
                {tab.label}
              </span>
              
              {/* Active indicator dot */}
              {isActive && (
                <div 
                  className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                  aria-hidden="true"
                />
              )}
            </Link>
          )
        })}
      </div>
      
      {/* Additional safe area padding for devices with home indicators */}
      <div className="h-safe-area-inset-bottom" aria-hidden="true" />
    </nav>
  )
}

// Export navigation tabs for use in other components or routing logic
export { navigationTabs }