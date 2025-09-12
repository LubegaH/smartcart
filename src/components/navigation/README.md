# SmartCart Bottom Navigation

A mobile-first bottom navigation component that provides persistent access to the main sections of SmartCart.

## Features

- **Mobile-first design** with 56px minimum touch targets
- **Keyboard navigation** with arrow key support
- **WCAG 2.1 AA accessibility compliance** 
- **Safe area support** for iOS devices with notch/home indicator
- **Active route detection** with visual highlighting
- **Smooth animations** and hover states
- **PWA-optimized** with proper caching and offline support

## Usage

The BottomNav is automatically included in the main layout at `/src/app/layout.tsx`. No additional setup required for basic usage.

```tsx
import { BottomNav } from '@/components/navigation'

// Basic usage (already included in layout)
<BottomNav />

// With custom styling
<BottomNav className="custom-nav-class" />
```

## Navigation Tabs

The component includes 4 main navigation tabs:

1. **Dashboard** (🏠) - `/dashboard` - Overview and statistics
2. **Trips** (🛒) - `/trips` - Shopping list management  
3. **Retailers** (🏪) - `/retailers` - Store management
4. **Profile** (👤) - `/profile` - User settings

## Accessibility Features

- **ARIA roles and labels** for screen reader support
- **Keyboard navigation** with Tab and Arrow keys
- **Focus management** with proper focus indicators
- **High contrast ratios** meeting WCAG 2.1 AA standards
- **Touch target sizes** minimum 56px for mobile accessibility

## Responsive Behavior

- **Mobile-first** approach with touch-optimized interactions
- **Safe area insets** for iOS devices with notch/home indicator
- **Backdrop blur** for modern visual effect
- **Fixed positioning** stays at bottom during scroll

## Integration with Pages

Pages should use the `pb-nav` CSS class to prevent content overlap:

```tsx
<div className="container-responsive py-6 pb-nav">
  {/* Page content */}
</div>
```

## TypeScript Support

Full TypeScript support with exported types:

```tsx
import type { NavigationTab, BottomNavProps } from '@/types/navigation'

const customTab: NavigationTab = {
  id: 'custom',
  label: 'Custom',
  icon: '⚡',
  href: '/custom',
  ariaLabel: 'Go to Custom Section'
}
```

## Testing

The component includes comprehensive tests covering:

- Rendering of all navigation tabs
- Active state management based on current route
- Keyboard navigation functionality
- Accessibility compliance
- Touch target sizing
- Color contrast ratios

Run tests with:
```bash
npm test -- bottom-nav
```

## Performance

- **Bundle size impact**: ~3KB gzipped
- **No external dependencies** beyond React/Next.js
- **Tree-shakeable exports** via index file
- **Optimized animations** using CSS transforms

## Browser Support

- Chrome 90+
- Safari 14+
- Firefox 85+
- iOS Safari 14+
- Android Chrome 90+