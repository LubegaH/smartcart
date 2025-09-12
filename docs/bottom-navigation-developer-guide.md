# SmartCart Bottom Navigation - Developer Usage Guide

## Quick Start

The SmartCart bottom navigation is already integrated into the application. This guide covers how to work with, extend, and customize the navigation component.

## Basic Usage

### Importing the Component

```typescript
import { BottomNav } from '@/components/navigation'
// or
import { BottomNav, navigationTabs } from '@/components/navigation'
```

### Using in Layout

The component is already integrated in the root layout (`src/app/layout.tsx`):

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div id="root">
            {children}
          </div>
          <BottomNav /> {/* Fixed bottom navigation */}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### Custom Styling

```typescript
// Add custom classes
<BottomNav className="custom-navigation-styles" />
```

## Configuration

### Adding New Navigation Tabs

To add a new tab, modify the `navigationTabs` array in `/src/components/navigation/bottom-nav.tsx`:

```typescript
const navigationTabs: NavigationTab[] = [
  // Existing tabs...
  {
    id: 'new-feature',
    label: 'New Feature',
    icon: '✨',
    href: '/new-feature',
    ariaLabel: 'Go to New Feature - Access the latest functionality'
  }
]
```

### Modifying Existing Tabs

```typescript
// Example: Changing the Retailers tab
{
  id: 'retailers',
  label: 'Stores',        // Changed label
  icon: '🏬',             // Changed icon
  href: '/stores',        // Changed route
  ariaLabel: 'Go to Stores - Manage your preferred shopping locations'
}
```

### Route Detection Customization

Update the `getActiveTab` function to handle new routes:

```typescript
const getActiveTab = (path: string): string => {
  if (path.startsWith('/dashboard')) return 'dashboard'
  if (path.startsWith('/trips')) return 'trips'
  if (path.startsWith('/retailers') || path.startsWith('/stores')) return 'retailers'
  if (path.startsWith('/profile')) return 'profile'
  if (path.startsWith('/new-feature')) return 'new-feature'
  return 'dashboard' // Default fallback
}
```

## Integration Patterns

### Active Shopping Mode Integration

When implementing Active Shopping Mode features, the navigation remains accessible:

```typescript
// In your Active Shopping Mode component
function ActiveShoppingMode() {
  // The bottom nav automatically handles navigation during active shopping
  // No special configuration needed
  
  return (
    <div className="pb-24"> {/* Add padding for bottom nav */}
      {/* Shopping mode content */}
    </div>
  )
}
```

### Page Layout Considerations

Ensure your page content accounts for the bottom navigation:

```typescript
// Add bottom padding to prevent content overlap
export default function YourPage() {
  return (
    <main className="pb-20 min-h-screen"> {/* 80px padding for nav */}
      {/* Page content */}
    </main>
  )
}
```

### Custom Layout Variations

For pages that need different navigation behavior:

```typescript
// Custom layout without bottom navigation
export default function CustomLayout({ children }) {
  return (
    <div>
      {children}
      {/* Conditionally render BottomNav */}
      {showNavigation && <BottomNav />}
    </div>
  )
}
```

## Advanced Customization

### Custom Tab Components

Create reusable tab configurations:

```typescript
// Create a custom tab configuration
const createCustomTab = (
  id: string, 
  label: string, 
  icon: string, 
  href: string,
  description: string
): NavigationTab => ({
  id,
  label,
  icon, 
  href,
  ariaLabel: `Go to ${label} - ${description}`
})

// Use in navigation tabs array
const navigationTabs: NavigationTab[] = [
  createCustomTab('dashboard', 'Dashboard', '🏠', '/dashboard', 'View overview and statistics'),
  createCustomTab('trips', 'Trips', '🛒', '/trips', 'Manage your shopping lists'),
  // ...
]
```

### Dynamic Tab Visibility

```typescript
// Filter tabs based on user permissions or features
const getVisibleTabs = (userRole: string): NavigationTab[] => {
  return navigationTabs.filter(tab => {
    if (tab.id === 'admin' && userRole !== 'admin') return false
    return true
  })
}

// In component
const visibleTabs = getVisibleTabs(user.role)
```

### Tab Badge System

Extend the navigation with notification badges:

```typescript
// Extended interface
interface NavigationTabWithBadge extends NavigationTab {
  badge?: {
    count: number
    color: 'red' | 'blue' | 'green'
    ariaLabel: string
  }
}

// Usage in component
{tab.badge && (
  <span 
    className={`absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center text-xs rounded-full ${
      tab.badge.color === 'red' ? 'bg-red-500 text-white' :
      tab.badge.color === 'blue' ? 'bg-blue-500 text-white' :
      'bg-green-500 text-white'
    }`}
    aria-label={tab.badge.ariaLabel}
  >
    {tab.badge.count > 9 ? '9+' : tab.badge.count}
  </span>
)}
```

## Testing Your Changes

### Unit Testing

When modifying the navigation, update the tests:

```typescript
// src/components/navigation/__tests__/bottom-nav.test.tsx
import { render, screen } from '@testing-library/react'
import { BottomNav } from '../bottom-nav'

describe('BottomNav with custom changes', () => {
  test('renders new navigation tab', () => {
    render(<BottomNav />)
    expect(screen.getByText('New Feature')).toBeInTheDocument()
  })
  
  test('handles navigation to new route', () => {
    // Test new route navigation
  })
})
```

### E2E Testing

Update E2E tests for new functionality:

```typescript
// tests/e2e/navigation/bottom-nav.spec.ts
test('should navigate to new feature tab', async ({ page }) => {
  await page.goto('/dashboard')
  await page.click('a[role="tab"]:has-text("New Feature")')
  await page.waitForURL(/\/new-feature/)
  await expect(page).toHaveURL(/\/new-feature/)
})
```

## Performance Considerations

### Bundle Size Impact

When adding new tabs or features:

```bash
# Check bundle size impact
npm run build
npm run analyze # If bundle analyzer is configured
```

### Memory Usage

Monitor for memory leaks when adding dynamic features:

```typescript
// Clean up event listeners and timers
useEffect(() => {
  const handleCustomEvent = () => {
    // Custom logic
  }
  
  window.addEventListener('customEvent', handleCustomEvent)
  
  return () => {
    window.removeEventListener('customEvent', handleCustomEvent)
  }
}, [])
```

## Accessibility Guidelines

### Adding New Tabs

Ensure new tabs maintain accessibility standards:

```typescript
{
  id: 'new-feature',
  label: 'New Feature',
  icon: '✨',
  href: '/new-feature',
  ariaLabel: 'Go to New Feature - Descriptive text about functionality' // Required
}
```

### Keyboard Navigation

Test keyboard navigation with new tabs:

1. Tab to navigation
2. Use arrow keys to navigate between tabs
3. Press Enter or Space to activate
4. Verify focus management works correctly

### Screen Reader Testing

Test with screen readers:
- NVDA (Windows)
- JAWS (Windows) 
- VoiceOver (macOS/iOS)
- TalkBack (Android)

## Common Patterns

### Conditional Tab Rendering

```typescript
// Show different tabs based on user state
const getTabsForUser = (isAuthenticated: boolean, userRole: string) => {
  const baseTabs = navigationTabs.filter(tab => 
    !tab.requiresAuth || isAuthenticated
  )
  
  if (userRole === 'admin') {
    baseTabs.push({
      id: 'admin',
      label: 'Admin',
      icon: '⚙️',
      href: '/admin',
      ariaLabel: 'Go to Admin - Administrative functions'
    })
  }
  
  return baseTabs
}
```

### Dynamic Icon Updates

```typescript
// Update icons based on application state
const getTabIcon = (tabId: string, appState: any): string => {
  switch (tabId) {
    case 'trips':
      return appState.activeTrip ? '🛒✨' : '🛒'
    case 'profile':
      return appState.hasNotifications ? '👤🔴' : '👤'
    default:
      return navigationTabs.find(t => t.id === tabId)?.icon || '❓'
  }
}
```

### Context-Aware Labels

```typescript
// Update labels based on context
const getContextualLabel = (tabId: string, context: any): string => {
  if (tabId === 'trips' && context.activeTrip) {
    return `Shopping at ${context.activeTrip.retailer}`
  }
  return navigationTabs.find(t => t.id === tabId)?.label || 'Unknown'
}
```

## Troubleshooting

### Common Issues

#### Navigation Not Showing
```typescript
// Check if component is properly imported and rendered
import { BottomNav } from '@/components/navigation' // Correct import path
```

#### Active State Not Working
```typescript
// Verify route detection logic matches your routes
const getActiveTab = (path: string): string => {
  console.log('Current path:', path) // Debug current path
  // ... route detection logic
}
```

#### Styling Issues
```bash
# Ensure Tailwind classes are available
npm run dev # Check for CSS compilation errors
```

#### Touch Targets Too Small
```css
/* Ensure minimum 44px touch targets */
.touch-target-large {
  min-width: 44px;
  min-height: 44px;
}
```

### Debug Mode

Enable debug mode for development:

```typescript
const DEBUG_NAVIGATION = process.env.NODE_ENV === 'development'

if (DEBUG_NAVIGATION) {
  console.log('Active tab:', activeTab)
  console.log('Current pathname:', pathname)
  console.log('Focused tab:', focusedTab)
}
```

## Migration Guide

### From Version 0.x to 1.x

If upgrading from an older version:

1. Update import paths:
   ```typescript
   // Old
   import { Navigation } from '@/components/ui/navigation'
   
   // New
   import { BottomNav } from '@/components/navigation'
   ```

2. Update configuration format:
   ```typescript
   // Old format
   const tabs = [{ name: 'Dashboard', path: '/dashboard' }]
   
   // New format
   const navigationTabs = [{ 
     id: 'dashboard', 
     label: 'Dashboard', 
     icon: '🏠',
     href: '/dashboard',
     ariaLabel: 'Go to Dashboard - View overview and statistics'
   }]
   ```

3. Update styling classes:
   ```css
   /* Old classes */
   .nav-bottom { /* old styles */ }
   
   /* New classes */
   .fixed.bottom-0.left-0.right-0 { /* new layout */ }
   ```

## Code Examples

### Complete Custom Implementation

```typescript
// CustomBottomNav.tsx
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface CustomTab {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: number
}

const customTabs: CustomTab[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <HomeIcon className="w-6 h-6" />,
    href: '/home'
  },
  {
    id: 'search',
    label: 'Search', 
    icon: <SearchIcon className="w-6 h-6" />,
    href: '/search',
    badge: 3
  }
]

export function CustomBottomNav() {
  const pathname = usePathname()
  
  const getActiveTab = (path: string) => {
    const activeTab = customTabs.find(tab => 
      path.startsWith(tab.href)
    )
    return activeTab?.id || 'home'
  }
  
  const activeTab = getActiveTab(pathname)
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
      <div className="flex justify-around py-2">
        {customTabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              'flex flex-col items-center justify-center p-2 rounded-lg',
              'min-w-[60px] min-h-[60px]',
              activeTab === tab.id 
                ? 'text-primary bg-primary/10' 
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <div className="relative">
              {tab.icon}
              {tab.badge && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-xs mt-1">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
```

### Integration with State Management

```typescript
// With Redux/Zustand store integration
import { useAppSelector } from '@/store'

function ConnectedBottomNav() {
  const notificationCount = useAppSelector(state => state.notifications.count)
  const activeTrip = useAppSelector(state => state.trips.active)
  
  // Update tabs based on global state
  const enhancedTabs = navigationTabs.map(tab => {
    if (tab.id === 'profile' && notificationCount > 0) {
      return {
        ...tab,
        badge: notificationCount
      }
    }
    if (tab.id === 'trips' && activeTrip) {
      return {
        ...tab,
        label: 'Active Trip'
      }
    }
    return tab
  })
  
  return <BottomNav tabs={enhancedTabs} />
}
```

## Best Practices

### Performance
- Keep navigation configuration static when possible
- Use React.memo for expensive customizations
- Minimize re-renders with stable references

### Accessibility
- Always provide descriptive aria-labels
- Test with keyboard navigation
- Verify screen reader compatibility
- Maintain minimum touch target sizes (44px+)

### UX
- Keep tab count to 5 or fewer
- Use familiar icons and labels
- Provide immediate visual feedback
- Maintain consistent behavior across the app

### Maintenance
- Document custom changes
- Update tests when modifying configuration
- Monitor bundle size impact
- Keep accessibility standards current

---

*This developer guide provides comprehensive information for working with the SmartCart bottom navigation component. For additional support, refer to the technical documentation and feature overview.*