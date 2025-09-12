'use client'

/**
 * Demo component for testing BottomNav in isolation
 * This component can be used for development and testing purposes
 */

import * as React from 'react'
import { BottomNav } from './bottom-nav'

export function NavigationDemo() {
  const [mockPath, setMockPath] = React.useState('/dashboard')

  // Mock the Next.js usePathname hook for demo purposes
  React.useEffect(() => {
    // This would normally come from Next.js router
    console.log('Current mock path:', mockPath)
  }, [mockPath])

  return (
    <div className="min-h-screen bg-background relative">
      {/* Demo content */}
      <div className="p-6 pb-nav space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Navigation Demo</h1>
          <p className="text-muted-foreground">
            Test the bottom navigation component in isolation
          </p>
        </div>

        {/* Route selector for demo */}
        <div className="card-elevated p-6 space-y-4">
          <h2 className="font-semibold">Simulate Route Changes</h2>
          <div className="grid grid-cols-2 gap-2">
            {['/dashboard', '/trips', '/retailers', '/profile'].map(route => (
              <button
                key={route}
                onClick={() => setMockPath(route)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${mockPath === route 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }
                `}
              >
                {route}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Current path: <code className="bg-muted px-2 py-1 rounded">{mockPath}</code>
          </p>
        </div>

        {/* Touch target demonstration */}
        <div className="card-elevated p-6 space-y-4">
          <h2 className="font-semibold">Touch Target Test</h2>
          <p className="text-sm text-muted-foreground">
            All navigation tabs should have minimum 56px touch targets
          </p>
          <div className="grid grid-cols-4 gap-2">
            <div className="touch-target-large bg-primary/10 border-2 border-primary rounded-lg flex items-center justify-center">
              <span className="text-xs">56px+</span>
            </div>
            <div className="touch-target bg-secondary/10 border-2 border-secondary rounded-lg flex items-center justify-center">
              <span className="text-xs">44px</span>
            </div>
            <div className="w-8 h-8 bg-destructive/10 border-2 border-destructive rounded-lg flex items-center justify-center">
              <span className="text-xs text-destructive">32px</span>
            </div>
            <div className="w-6 h-6 bg-muted border-2 border-border rounded-lg flex items-center justify-center">
              <span className="text-xs">24px</span>
            </div>
          </div>
        </div>

        {/* Accessibility test */}
        <div className="card-elevated p-6 space-y-4">
          <h2 className="font-semibold">Accessibility Features</h2>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>✅ ARIA labels and roles</li>
            <li>✅ Keyboard navigation (Tab + Arrow keys)</li>
            <li>✅ Focus indicators</li>
            <li>✅ Screen reader compatibility</li>
            <li>✅ Color contrast compliance</li>
            <li>✅ Touch target sizing</li>
          </ul>
        </div>

        {/* Safe area demonstration */}
        <div className="card-elevated p-6 space-y-4">
          <h2 className="font-semibold">Safe Area Support</h2>
          <p className="text-sm text-muted-foreground">
            The navigation automatically handles iOS safe areas for devices with notch or home indicator.
          </p>
          <div className="bg-muted/50 p-4 rounded border-l-4 border-primary">
            <p className="text-sm">
              <strong>Note:</strong> Safe area insets are handled via CSS environment variables 
              and will only be visible on actual iOS devices or in Safari's responsive design mode.
            </p>
          </div>
        </div>
      </div>

      {/* The actual navigation component */}
      <BottomNav />
    </div>
  )
}