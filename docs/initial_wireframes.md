# SmartCart - Initial Wireframes for Core Screens

## Document Purpose
This document provides wireframe specifications for core SmartCart screens, designed for AI agents to implement user interfaces. Each wireframe includes layout specifications, component requirements, and interaction patterns aligned with the AirBnb-style clean aesthetic.

---

## Design System Foundation

### Visual Hierarchy Guidelines
```typescript
const designTokens = {
  colors: {
    primary: '#10b981',      // Green for success/shopping
    secondary: '#3b82f6',    // Blue for information  
    warning: '#f59e0b',      // Yellow for budget warnings
    danger: '#ef4444',       // Red for over budget
    neutral: '#6b7280',      // Gray for secondary text
    background: '#ffffff',   // White background
    surface: '#f9fafb'       // Light gray for cards
  },
  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
    sizes: {
      xs: '12px', sm: '14px', base: '16px', 
      lg: '18px', xl: '20px', xxl: '24px'
    },
    weights: { normal: '400', medium: '500', semibold: '600', bold: '700' }
  },
  spacing: {
    xs: '4px', sm: '8px', md: '16px', 
    lg: '24px', xl: '32px', xxl: '48px'
  },
  borderRadius: {
    sm: '4px', md: '8px', lg: '12px', xl: '16px'
  }
}
```

### Layout Principles for Agents
- **Mobile-first responsive design** (320px to 768px primary focus)
- **Touch-friendly targets** (minimum 44px height for interactive elements)
- **Clear visual hierarchy** with typography and spacing
- **Consistent spacing rhythm** using 8px grid system
- **Card-based layout** for content organization
- **Subtle shadows and borders** for depth without clutter

---

## WF-1: Authentication Screens

### WF-1.1: Login Screen
**Screen ID**: `auth-login`  
**Route**: `/login`  
**Primary Action**: User authentication  

#### Layout Specification
```
┌─────────────────────────────┐
│     [SmartCart Logo]        │ ← 48px height, centered
│                             │
│    Welcome back!            │ ← Heading xl, semibold, 32px top margin
│    Sign in to your account  │ ← Text sm, neutral color, 8px top margin
│                             │
│  ┌─────────────────────────┐ │
│  │ Email Address          │ │ ← Input field, 56px height
│  │ [email input]          │ │
│  └─────────────────────────┘ │
│                             │
│  ┌─────────────────────────┐ │
│  │ Password               │ │ ← Input field, 56px height, 16px margin
│  │ [password input]       │ │
│  └─────────────────────────┘ │
│                             │
│  [Forgot password?]         │ ← Link, right aligned, 8px margin
│                             │
│  ┌─────────────────────────┐ │
│  │      Sign In           │ │ ← Primary button, 56px height, 24px margin
│  └─────────────────────────┘ │
│                             │
│  Don't have an account?     │ ← Text center, 24px margin
│  [Sign up here]            │ ← Link, primary color
│                             │
└─────────────────────────────┘
```

#### Component Requirements for Agents
```typescript
// Login Form Component Structure
interface LoginFormProps {
  onSubmit: (email: string, password: string) => void
  isLoading: boolean
  error?: string
}

// Required form validation:
// - Email format validation
// - Password minimum 8 characters
// - Loading state during authentication
// - Error message display
// - Keyboard navigation support
```

### WF-1.2: Registration Screen
**Screen ID**: `auth-register`  
**Route**: `/register`  
**Primary Action**: Account creation  

#### Layout Specification
```
┌─────────────────────────────┐
│     [SmartCart Logo]        │
│                             │
│    Create your account      │ ← Heading xl, semibold
│    Start saving on groceries│ ← Text sm, neutral color
│                             │
│  ┌─────────────────────────┐ │
│  │ Email Address          │ │
│  │ [email input]          │ │
│  └─────────────────────────┘ │
│                             │
│  ┌─────────────────────────┐ │
│  │ Password               │ │
│  │ [password input]       │ │
│  └─────────────────────────┘ │
│                             │
│  ┌─────────────────────────┐ │
│  │ Confirm Password       │ │
│  │ [password input]       │ │
│  └─────────────────────────┘ │
│                             │
│  ☐ I agree to Terms of Service │ ← Checkbox, 16px margin
│                             │
│  ┌─────────────────────────┐ │
│  │     Create Account     │ │ ← Primary button, disabled until valid
│  └─────────────────────────┘ │
│                             │
│  Already have an account?   │
│  [Sign in here]            │
│                             │
└─────────────────────────────┘
```

---

## WF-2: Dashboard/Home Screen

### WF-2.1: Main Dashboard
**Screen ID**: `dashboard-home`  
**Route**: `/dashboard`  
**Primary Actions**: Create trip, view recent trips, access analytics  

#### Layout Specification
```
┌─────────────────────────────┐
│ ☰ SmartCart    [Profile] 🔔 │ ← Header: 64px height, navigation + notifications
├─────────────────────────────┤
│                             │
│  Welcome back, Sarah! 👋    │ ← Greeting, personalized, 24px margin
│                             │
│ ┌─────────────────────────┐ │
│ │ 📊 This Month           │ │ ← Stats card, surface background
│ │ $847 spent / $900 budget│ │ ← Bold numbers, progress indicator
│ │ ████████░░ 94%          │ │ ← Progress bar, green/yellow/red
│ └─────────────────────────┘ │
│                             │
│ ┌───────────────────────────┐│ ← Quick actions section
│ │ + Create Shopping Trip   ││ ← Primary CTA button, 56px height
│ └───────────────────────────┘│
│                             │
│  Recent Trips              │ ← Section heading, semibold
│                             │
│ ┌─────────────────────────┐ │
│ │ 🛒 Weekly Groceries     │ │ ← Trip card with icon
│ │ Target • Today          │ │ ← Retailer and date, small text
│ │ $67.50 estimated        │ │ ← Amount, right aligned
│ │ [Continue Shopping] >   │ │ ← Action button if active
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ✅ Costco Run          │ │ ← Completed trip, checkmark icon
│ │ Costco • Yesterday      │ │
│ │ $89.32 spent           │ │ ← Actual amount for completed
│ └─────────────────────────┘ │
│                             │
│  [View All Trips]          │ ← Secondary action link
│                             │
├─────────────────────────────┤
│ 🏠 🛒 📊 ⚙️              │ ← Bottom navigation: Home, Trips, Analytics, Settings
└─────────────────────────────┘
```

#### Component Requirements for Agents
```typescript
// Dashboard Component Structure
interface DashboardProps {
  user: User
  monthlyStats: MonthlyStats
  recentTrips: ShoppingTrip[]
  onCreateTrip: () => void
}

interface MonthlyStats {
  spent: number
  budget: number
  percentUsed: number
  status: 'good' | 'warning' | 'over'
}

// Required interactions:
// - Tap stats card to view detailed analytics
// - Swipe trip cards for quick actions (edit, delete)
// - Pull-to-refresh for updated data
// - Search functionality in header
```

---

## WF-3: Trip Creation & Management

### WF-3.1: Create Trip Screen
**Screen ID**: `trip-create`  
**Route**: `/trips/create`  
**Primary Action**: Create new shopping trip  

#### Layout Specification
```
┌─────────────────────────────┐
│ ← New Shopping Trip    [×]  │ ← Header with back button and close
├─────────────────────────────┤
│                             │
│  Trip Details              │ ← Section heading, 24px margin
│                             │
│  ┌─────────────────────────┐ │
│  │ Trip Name              │ │ ← Input with label
│  │ Weekly Groceries       │ │ ← Placeholder text
│  └─────────────────────────┘ │
│                             │
│  ┌─────────────────────────┐ │
│  │ Date                   │ │ ← Date picker input
│  │ Today, June 25         │ │ ← Default to today
│  └─────────────────────────┘ │
│                             │
│  ┌─────────────────────────┐ │
│  │ Retailer              │ │ ← Dropdown/select
│  │ Select a store...      │ │ ← Placeholder
│  └─────────────────────────┘ │
│                             │
│  + Add New Retailer        │ ← Secondary action link
│                             │
│  Estimated Budget (Optional)│ ← Label for optional field
│  ┌─────────────────────────┐ │
│  │ $ [amount input]       │ │ ← Numeric input with currency
│  └─────────────────────────┘ │
│                             │
│                             │
│ ┌─────────────────────────┐ │ ← Bottom sticky area
│ │      Create Trip       │ │ ← Primary button, full width
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### WF-3.2: Trip Detail Screen
**Screen ID**: `trip-detail`  
**Route**: `/trips/:id`  
**Primary Actions**: Add items, edit trip, start shopping  

#### Layout Specification
```
┌─────────────────────────────┐
│ ← Weekly Groceries     ⋯   │ ← Header with trip name and menu
├─────────────────────────────┤
│                             │
│ 🛒 Target • Today          │ ← Trip info with icon
│ $67.50 estimated • 8 items │ ← Summary stats
│                             │
│ ┌─────────────────────────┐ │
│ │    Start Shopping      │ │ ← Primary CTA button, prominent
│ └─────────────────────────┘ │
│                             │
│  Shopping List             │ ← Section heading
│  + Add Item                │ ← Add button, right aligned
│                             │
│ ┌─────────────────────────┐ │
│ │ ☐ Milk                 │ │ ← Item row with checkbox
│ │ 1 gallon • $3.99       │ │ ← Quantity and estimated price
│ │                    ⋯   │ │ ← Menu for edit/delete
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ☐ Bread                │ │
│ │ 2 loaves • $5.98       │ │
│ │ Last paid: $2.89/loaf  │ │ ← Price intelligence hint
│ │                    ⋯   │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ☐ Eggs                 │ │
│ │ 1 dozen • $4.50        │ │
│ │                    ⋯   │ │
│ └─────────────────────────┘ │
│                             │
│  [Continue adding items...] │ ← Encouraging text for new users
│                             │
├─────────────────────────────┤
│ 🏠 🛒 📊 ⚙️              │ ← Bottom navigation
└─────────────────────────────┘
```

#### Component Requirements for Agents
```typescript
// Trip Detail Component Structure
interface TripDetailProps {
  trip: ShoppingTrip
  items: TripItem[]
  onStartShopping: () => void
  onAddItem: (item: Partial<TripItem>) => void
  onEditItem: (id: string, updates: Partial<TripItem>) => void
}

// Required interactions:
// - Swipe items for quick edit/delete
// - Tap item to edit inline
// - Long press for bulk selection
// - Pull down to refresh data
// - Search/filter items
```

---

## WF-4: Active Shopping Mode

### WF-4.1: Shopping Mode Interface
**Screen ID**: `shopping-active`  
**Route**: `/trips/:id/shopping`  
**Primary Actions**: Check off items, update prices, track progress  

#### Layout Specification
```
┌─────────────────────────────┐
│ Shopping Mode • Target     │ ← Mode indicator, always visible
│ 3 of 8 items • $23.47     │ ← Progress and running total
│ ████████░░░░░░░░ 37%       │ ← Progress bar, visually prominent
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │ ← Large touch targets for shopping
│ │ ✅ Milk            $4.29│ │ ← Completed item, actual price
│ │ 1 gallon          +$0.30│ │ ← Price difference indicator
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ☐ Bread           $5.98 │ │ ← Uncompleted item, estimated price
│ │ 2 loaves     [Tap Price]│ │ ← Price update CTA
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ☐ Eggs            $4.50 │ │
│ │ 1 dozen      [Tap Price]│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ☐ Bananas         $3.99 │ │
│ │ 3 lbs        [Tap Price]│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ☐ Yogurt          $6.99 │ │
│ │ 4 cups       [Tap Price]│ │
│ └─────────────────────────┘ │
│                             │
│                             │
│ [Pause Shopping] [Complete] │ ← Bottom actions, secondary/primary
└─────────────────────────────┘
```

### WF-4.2: Price Update Modal
**Screen ID**: `price-update-modal`  
**Overlay**: Modal over shopping mode  
**Primary Action**: Update item price quickly  

#### Layout Specification
```
┌─────────────────────────────┐
│                             │
│          ┌─────────┐        │ ← Modal overlay, centered
│          │ Update  │        │ ← Modal header
│          │ Milk    │        │
│          │ Price   │        │
│          ├─────────┤        │
│          │         │        │
│          │  $4.29  │        │ ← Large price display
│          │ ┌─┬─┬─┐ │        │ ← Number pad for quick entry
│          │ │1││2││3│ │        │ ← 60px touch targets
│          │ ├─┼─┼─┤ │        │
│          │ │4││5││6│ │        │
│          │ ├─┼─┼─┤ │        │
│          │ │7││8││9│ │        │
│          │ ├─┼─┼─┤ │        │
│          │ │.││0││⌫│ │        │
│          │ └─┴─┴─┘ │        │
│          │         │        │
│          │ Estimated: $3.99 │ ← Reference price
│          │ Difference: +$0.30│ ← Calculated difference
│          │         │        │
│          │ [Cancel] [Save]  │ ← Modal actions
│          └─────────┘        │
│                             │
└─────────────────────────────┘
```

#### Component Requirements for Agents
```typescript
// Price Update Modal Structure
interface PriceUpdateModalProps {
  item: TripItem
  onSave: (newPrice: number) => void
  onCancel: () => void
  estimatedPrice?: number
}

// Required features:
// - Numeric keypad optimized for mobile
// - Auto-focus on price input
// - Clear difference calculation
// - Haptic feedback on save
// - Keyboard shortcuts (Enter to save, Escape to cancel)
```

---

## WF-5: Analytics & Insights

### WF-5.1: Monthly Analytics Screen
**Screen ID**: `analytics-monthly`  
**Route**: `/analytics`  
**Primary Actions**: View spending patterns, identify savings opportunities  

#### Layout Specification
```
┌─────────────────────────────┐
│ ← Analytics            ⋯   │ ← Header with menu
├─────────────────────────────┤
│                             │
│  June 2025                 │ ← Month selector
│  < Previous    Next >      │
│                             │
│ ┌─────────────────────────┐ │
│ │ 💰 Total Spent         │ │ ← Stats card
│ │ $847 of $900 budget    │ │ ← Large numbers, progress
│ │ ████████░░ 94%         │ │
│ │ $53 under budget ✅    │ │ ← Status indicator
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📊 Spending by Category │ │ ← Chart section
│ │                        │ │
│ │ ████ Produce    $234   │ │ ← Horizontal bar chart
│ │ ███  Dairy      $156   │ │ ← Color-coded categories
│ │ ██   Meat       $198   │ │
│ │ █    Pantry     $89    │ │
│ │ █    Other      $170   │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 💡 Savings Opportunities│ │ ← Insights card
│ │                        │ │
│ │ • Milk is 15% cheaper  │ │ ← Actionable insights
│ │   at Store B           │ │
│ │                        │ │
│ │ • Consider buying      │ │
│ │   frozen vegetables    │ │
│ │   in winter           │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ 🏠 🛒 📊 ⚙️              │ ← Bottom navigation
└─────────────────────────────┘
```

---

## WF-6: Settings & Profile

### WF-6.1: Settings Screen
**Screen ID**: `settings-main`  
**Route**: `/settings`  
**Primary Actions**: Manage account, preferences, data  

#### Layout Specification
```
┌─────────────────────────────┐
│ ← Settings                 │ ← Header
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ 👤 Sarah Chen          │ │ ← Profile section
│ │ sarah@example.com      │ │
│ │ [Edit Profile] >       │ │
│ └─────────────────────────┘ │
│                             │
│  Preferences               │ ← Section heading
│                             │
│ ┌─────────────────────────┐ │
│ │ 🔔 Notifications    >  │ │ ← Settings rows
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🌙 Dark Mode       ○   │ │ ← Toggle switch
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 💰 Default Budget   >  │ │
│ └─────────────────────────┘ │
│                             │
│  Data & Privacy            │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📊 Export Data      >  │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🗑️ Delete Account   >  │ │
│ └─────────────────────────┘ │
│                             │
│  About                     │
│                             │
│ ┌─────────────────────────┐ │
│ │ ℹ️ Help & Support   >  │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📄 Privacy Policy   >  │ │
│ └─────────────────────────┘ │
│                             │
│  Version 1.0.0             │ ← App version, small text
│                             │
├─────────────────────────────┤
│ 🏠 🛒 📊 ⚙️              │ ← Bottom navigation
└─────────────────────────────┘
```

---

## Responsive Design Specifications

### Breakpoint Guidelines for Agents
```css
/* Mobile First Approach */
.container {
  /* Base: 320px - 767px (Mobile) */
  padding: 16px;
  max-width: 100%;
}

@media (min-width: 768px) {
  /* Tablet: 768px - 1023px */
  .container {
    padding: 24px;
    max-width: 720px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  /* Desktop: 1024px+ */
  .container {
    padding: 32px;
    max-width: 960px;
  }
}
```

### Touch Target Requirements
- **Minimum size**: 44px × 44px for all interactive elements
- **Preferred size**: 56px × 56px for primary actions
- **Spacing**: 8px minimum between touch targets
- **Visual feedback**: Clear pressed/active states

---

## Interaction Patterns for Implementation

### Common Gestures
```typescript
// Gesture Implementation Guide
const gesturePatterns = {
  // Swipe left on trip/item cards for quick actions
  swipeLeft: {
    threshold: 50, // pixels
    actions: ['edit', 'delete', 'archive']
  },
  
  // Pull down to refresh data
  pullToRefresh: {
    threshold: 100,
    feedback: 'visual indicator + haptic'
  },
  
  // Long press for bulk selection
  longPress: {
    duration: 500, // ms
    feedback: 'haptic + visual selection mode'
  },
  
  // Tap outside modal to close
  tapOutside: {
    action: 'closeModal',
    exceptions: ['price-update', 'confirmation-dialogs']
  }
}
```

### Loading States
```typescript
// Loading State Patterns
const loadingStates = {
  // Skeleton loading for list items
  listItems: 'skeleton-placeholder',
  
  // Spinner for actions
  actions: 'inline-spinner',
  
  // Progressive loading for images
  images: 'blur-to-sharp',
  
  // Optimistic updates for user actions
  userActions: 'immediate-ui-update'
}
```

---

## Implementation Priority for Agents

### Phase 1: Core Screens (Weeks 3-4)
1. **Authentication** (WF-1.1, WF-1.2)
2. **Dashboard** (WF-2.1) 
3. **Trip Creation** (WF-3.1)
4. **Trip Detail** (WF-3.2)

### Phase 2: Shopping Mode (Weeks 5-6)
1. **Active Shopping** (WF-4.1)
2. **Price Update Modal** (WF-4.2)
3. **Shopping completion flow**

### Phase 3: Analytics & Settings (Weeks 7-8)
1. **Analytics Screen** (WF-5.1)
2. **Settings Screen** (WF-6.1)
3. **Profile management**

### Design System Implementation Notes
```typescript
// Component Library Structure for Agents
const componentHierarchy = {
  // Atoms
  Button: 'Base interactive element with variants',
  Input: 'Form input with validation states',
  Typography: 'Text components with semantic hierarchy',
  
  // Molecules  
  TripCard: 'Trip display with actions',
  ItemRow: 'Shopping item with price/quantity',
  StatsCard: 'Analytics display component',
  
  // Organisms
  TripList: 'Collection of trip cards',
  ShoppingList: 'Collection of items in shopping mode',
  Navigation: 'Bottom tab navigation',
  
  // Templates
  Dashboard: 'Home screen layout',
  ShoppingMode: 'Active shopping interface',
  Analytics: 'Insights and reports layout'
}
```

These wireframes provide complete specifications for implementing SmartCart's user interface with clear layout requirements, interaction patterns, and component specifications designed for AI agent implementation following AirBnb's clean, modern aesthetic principles.