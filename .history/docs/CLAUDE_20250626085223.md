# CLAUDE.md - SmartCart Development Workflow

## Project Overview
You are tasked with building **SmartCart**, an intelligent home management PWA focused on grocery shopping optimization, price tracking, and consumption prediction. The MVP centers on "Shopping Trips" with real-time price updating and intelligent price memory.

**Key Value Proposition**: Transform grocery shopping from guesswork to data-driven decisions through Active Shopping Mode with real-time price tracking.

---

## Essential Context Documents

Before starting any work, thoroughly review these foundational documents:

1. **`user_personas_use_cases.md`** - Core user personas (Sarah, Marcus, Linda) and primary use cases
2. **`user_journey_maps.md`** - Critical user flows and emotional journey analysis  
3. **`success_metrics_kpis.md`** - Success criteria and KPIs for each development phase
4. **`functional_nonfunctional_requirements.md`** - Complete technical specifications and acceptance criteria
5. **`pwa_technical_feasibility.md`** - Technical architecture decisions and implementation guidelines
6. **`initial_wireframes.md`** - UI/UX specifications with exact layout requirements
7. **`smart_home_mgmt_product_plan.md`** - Master project plan with phases and checkpoints

---

## Development Workflow

### Step 1: Problem Analysis & Planning
Before touching any code:

1. **Read the codebase thoroughly**
   - Understand existing file structure and architecture
   - Identify current implementation state
   - Review any existing code patterns and conventions

2. **Analyze the specific task**
   - Reference the functional requirements document for exact acceptance criteria
   - Check wireframes for UI specifications
   - Review user journey maps for context and user needs
   - Identify the simplest possible implementation approach

3. **Create implementation plan**
   - Break down the task into minimal, incremental changes
   - Identify which files need modification (aim for as few as possible)
   - Plan the test strategy before writing code
   - Consider edge cases and error handling requirements

### Step 2: Checkpoint & Approval
**CRITICAL**: Before writing any code:

1. **Check in with the human**
   - Present your implementation plan
   - Explain the approach and rationale
   - Confirm the plan aligns with requirements and expectations
   - Wait for explicit approval before proceeding

2. **Update the product plan**
   - Mark the current task as "In Progress" in `smart_home_mgmt_product_plan.md`
   - Add any implementation notes or decisions made

### Step 3: Implementation (Test-Driven Development)

#### 3.1: Write Tests First
- **Unit Tests**: For all business logic functions (use Vitest)
- **Integration Tests**: For API and database operations
- **E2E Tests**: For critical user flows (use Playwright)
- Follow the test requirements specified in the functional requirements document

#### 3.2: Implement Code
Follow these principles:

**Simplicity & Minimalism**:
- Make the smallest possible change that satisfies requirements
- Avoid complex abstractions or over-engineering
- One feature at a time, one file at a time when possible
- Prefer composition over inheritance

**Code Quality Standards**:
```typescript
// TypeScript requirements:
// - Strict mode enabled
// - No `any` types without explicit justification  
// - Define interfaces for all data structures
// - Proper error handling with Result types

// Example pattern for API calls:
type Result<T> = { success: true; data: T } | { success: false; error: string }

async function createTrip(tripData: CreateTripRequest): Promise<Result<ShoppingTrip>> {
  try {
    const { data, error } = await supabase
      .from('shopping_trips')
      .insert(tripData)
      .select()
      .single()
    
    if (error) return { success: false, error: error.message }
    return { success: true, data }
  } catch (err) {
    return { success: false, error: 'Failed to create trip' }
  }
}
```

**PWA & Performance Requirements**:
- All user interactions must respond within 500ms
- Implement offline-first patterns for core features
- Use optimistic UI updates
- Follow the PWA implementation guidelines from the technical feasibility document

**Security Requirements**:
- Use Supabase RLS policies for data access control
- Validate all inputs with Zod schemas
- Never expose sensitive data in client code
- Implement proper error handling without data leaks

#### 3.3: Component Architecture
Follow the component hierarchy from wireframes:

```typescript
// Atoms: Basic building blocks
const Button: React.FC<ButtonProps> = ({ variant, size, children, ...props }) => {
  // Use design tokens from wireframes document
  const baseClasses = "rounded-md font-medium transition-colors"
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary/90",
    secondary: "bg-secondary text-white hover:bg-secondary/90"
  }
  // Implementation...
}

// Molecules: Small composed components  
const TripCard: React.FC<TripCardProps> = ({ trip, onStartShopping }) => {
  // Follow exact layout from wireframes
  // Implement swipe gestures as specified
}

// Organisms: Complex composed components
const TripList: React.FC<TripListProps> = ({ trips, onCreateTrip }) => {
  // Collection of trip cards with proper spacing
  // Implement pull-to-refresh functionality
}
```

### Step 4: Testing & Validation

#### 4.1: Run All Tests
```bash
# Unit tests
npm run test

# Integration tests  
npm run test:integration

# E2E tests
npm run test:e2e

# Type checking
npm run type-check

# Linting
npm run lint
```

#### 4.2: Manual Testing
- Test the feature in Chrome, Safari, and Firefox
- Verify offline functionality works as expected
- Check responsive design at different screen sizes
- Validate accessibility (keyboard navigation, screen readers)
- Test performance targets (load time, interaction response)

#### 4.3: Requirement Validation
- Confirm all acceptance criteria are met
- Verify the implementation matches wireframe specifications
- Test all user interaction patterns specified in journey maps
- Ensure error states and edge cases are handled

### Step 5: Documentation & Communication

#### 5.1: Update Documentation
- Add JSDoc comments for all public APIs
- Update README if new setup steps are required
- Document any new environment variables or configuration

#### 5.2: Provide Implementation Summary
Give the human a clear, high-level explanation:

```markdown
## Implementation Summary: [Feature Name]

### Changes Made:
- **Files Modified**: List specific files changed
- **Key Features Added**: Brief bullet points of functionality
- **Database Changes**: Any schema updates or new tables
- **New Dependencies**: Any packages added and why

### Technical Decisions:
- **Architecture Choice**: Explain key technical decisions
- **Trade-offs**: Any compromises made and rationale
- **Performance Impact**: How this affects app performance

### Testing Coverage:
- **Unit Tests**: X tests covering core business logic
- **Integration Tests**: X tests for API operations  
- **E2E Tests**: X tests for user workflows

### Next Steps:
- **Dependencies**: What this unlocks for future features
- **Known Issues**: Any technical debt or limitations
- **Recommendations**: Suggestions for future improvements
```

### Step 6: Full Feature/Checkpoint Verification

#### 6.1: Complete End-to-End Validation
**CRITICAL**: Before moving to ANY next feature, ensure everything works perfectly:

**Full Application Testing**:
```bash
# 1. Run complete test suite
npm run test           # All unit tests pass
npm run test:integration  # All integration tests pass  
npm run test:e2e       # All E2E tests pass
npm run type-check     # No TypeScript errors
npm run lint           # No linting errors
npm run build          # Production build succeeds
```

**Manual User Journey Testing**:
- **Complete the user journey end-to-end** from the user personas document
- Test on Chrome, Safari, and Firefox mobile
- Verify offline functionality works completely
- Test all interactive elements and user flows
- Confirm the feature works as specified in wireframes
- Validate all acceptance criteria are met

**Integration Verification**:
- Ensure new feature doesn't break existing functionality
- Test data persistence and synchronization
- Verify PWA capabilities still function correctly
- Check performance targets are still met
- Validate security measures are in place

#### 6.2: Human Approval for Completion
**MANDATORY CHECKPOINT**: 

1. **Demonstrate the working feature**:
   - Show the complete user flow working
   - Demonstrate all acceptance criteria met
   - Show test coverage and passing status
   - Explain any technical decisions or trade-offs

2. **Request explicit approval**:
   - "Feature X is complete and fully functional. All tests pass. Ready to proceed to next feature?"
   - Wait for human confirmation before moving forward
   - Address any feedback or concerns raised

3. **Only proceed after approval**: Do not start the next feature until explicitly told to continue

#### 6.3: Update Product Plan
Only after human approval, mark the task as complete in `smart_home_mgmt_product_plan.md`:
```markdown
- [x] Task name - ✅ COMPLETED & APPROVED on [date]
  - Human verification: ✅ Confirmed working end-to-end
  - Implementation notes: Brief summary of approach
  - Test coverage: X unit tests, X integration tests (ALL PASSING)
  - Performance impact: Meets targets (load time, response time)
  - Integration status: ✅ No regressions, all existing features working
```

#### 6.4: Add Review Section
Add a comprehensive review entry to the product plan:
```markdown
## Development Review Log

### [Date] - [Feature/Checkpoint Name]
**Status**: ✅ COMPLETE & APPROVED
**Duration**: X days
**Human Verification**: ✅ Confirmed working end-to-end on [date]

**Deliverable Verification**:
- ✅ All acceptance criteria met
- ✅ User journey works completely  
- ✅ All tests passing (unit, integration, E2E)
- ✅ Performance targets achieved
- ✅ No regressions in existing features
- ✅ Offline functionality verified
- ✅ Cross-browser compatibility confirmed

**Key Achievements**:
- [Achievement 1]
- [Achievement 2]

**Technical Decisions**:
- [Decision 1 and rationale]
- [Decision 2 and rationale]

**Challenges & Solutions**:
- [Challenge]: [Solution implemented]

**Quality Metrics**:
- Test Coverage: X% (all passing)
- Performance: [specific metrics met]
- Accessibility: [WCAG compliance level]
- Integration: [no regressions confirmed]

**Next Phase Readiness**:
- ✅ Foundation solid for next feature
- ✅ Dependencies resolved
- ✅ Technical debt addressed
```

---

## Technology Stack Implementation Guidelines

### Next.js + TypeScript Setup
```typescript
// File structure convention:
src/
├── components/
│   ├── ui/           # shadcn/ui components (atoms)
│   ├── molecules/    # Composed components  
│   └── organisms/    # Complex composed components
├── lib/
│   ├── supabase.ts   # Supabase client configuration
│   ├── types.ts      # Shared TypeScript interfaces
│   └── utils.ts      # Utility functions
├── hooks/            # Custom React hooks
├── stores/           # Zustand stores
└── app/              # Next.js app router pages
```

### Database Schema Implementation
Follow the data models specified in functional requirements:

```sql
-- Example table structure (implement via Supabase migrations)
create table shopping_trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  retailer_id uuid references retailers(id),
  name text not null,
  date date not null,
  status text check (status in ('planned', 'active', 'completed', 'archived')) default 'planned',
  estimated_total numeric(10,2),
  actual_total numeric(10,2),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table shopping_trips enable row level security;

-- RLS policies
create policy "Users can only access their own trips" on shopping_trips
  for all using (auth.uid() = user_id);
```

### PWA Implementation Requirements
```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 300 }
      }
    }
  ]
})

module.exports = withPWA({
  // Your Next.js config
})
```

---

## Critical Success Factors

### 1. Active Shopping Mode Excellence
This is the core differentiator - ensure:
- Price updates respond within 500ms
- Works completely offline
- Large touch targets (56px minimum)
- Clear visual feedback for all actions
- Optimistic UI updates with sync queuing

### 2. Data Quality & Intelligence
- Implement fuzzy matching for item names
- Store price history with proper normalization
- Provide intelligent price suggestions
- Handle edge cases gracefully

### 3. Mobile-First Performance
- Bundle size under 300KB initial load
- App shell loads from cache in <1s offline
- Progressive enhancement for all features
- Touch-friendly interactions throughout

### 4. Offline-First Architecture
```typescript
// Always follow this pattern:
async function updateItemPrice(itemId: string, newPrice: number) {
  // 1. Update local state immediately (optimistic UI)
  setItems(prev => prev.map(item => 
    item.id === itemId ? { ...item, actual_price: newPrice } : item
  ))
  
  // 2. Persist to IndexedDB
  await saveToIndexedDB('price_updates', { itemId, newPrice, timestamp: Date.now() })
  
  // 3. Queue sync operation
  await queueSyncAction('UPDATE_PRICE', { itemId, newPrice })
  
  // 4. Attempt server sync if online
  if (navigator.onLine) {
    await attemptSync()
  }
}
```

---

## Error Handling & Edge Cases

### Standard Error Patterns
```typescript
// Use this pattern for all async operations:
async function performOperation(): Promise<Result<T>> {
  try {
    // Operation logic
    return { success: true, data: result }
  } catch (error) {
    // Log error for debugging
    console.error('Operation failed:', error)
    
    // Return user-friendly error
    return { 
      success: false, 
      error: 'Something went wrong. Please try again.' 
    }
  }
}
```

### Offline State Handling
- Always provide fallback to cached data
- Show clear online/offline status
- Queue failed operations for retry
- Graceful degradation of features

---

## Quality Gates

Before marking any task complete, ensure:

✅ **Functionality**: All acceptance criteria met  
✅ **End-to-End Testing**: Complete user journey works perfectly
✅ **Performance**: Targets achieved (response time, bundle size)  
✅ **Testing**: Comprehensive test coverage with ALL tests passing  
✅ **Integration**: No regressions - all existing features still work
✅ **Accessibility**: WCAG 2.1 AA compliance for core features  
✅ **PWA**: Offline functionality working correctly  
✅ **Security**: RLS policies implemented, input validation in place  
✅ **Cross-browser**: Verified working in Chrome, Safari, Firefox
✅ **Documentation**: Code commented, changes documented  
✅ **Code Quality**: ESLint passing, TypeScript strict mode, no console errors
✅ **Human Approval**: Explicit confirmation to proceed to next feature

**CRITICAL RULE**: Never move to the next feature without human verification that everything works perfectly.

---

## Claude Code Best Practices Integration

Based on Anthropic's Claude Code best practices:

### 1. Incremental Development
- Make small, focused commits
- Test each change before moving to the next
- Validate each step meets requirements before proceeding

### 2. Clear Communication
- Always explain your reasoning for technical decisions
- Describe trade-offs and alternatives considered
- Provide context for why specific approaches were chosen

### 3. Error Recovery
- If something breaks, clearly identify the issue
- Suggest specific debugging steps
- Provide fallback options when possible

### 4. Code Organization
- Follow established project conventions
- Keep functions small and focused
- Use descriptive variable and function names
- Maintain consistent code style throughout

### 5. Testing Strategy
- Write tests before implementation when possible
- Test both happy path and error conditions
- Include edge cases and boundary conditions
- Verify tests actually fail when they should

---

## Final Reminders

**The Golden Rules**: 
1. **Every change should be the simplest possible implementation that satisfies the requirements** - Avoid over-engineering, complex abstractions, or "clever" code. Focus on clarity, maintainability, and user value.

2. **Nothing moves forward until everything works perfectly** - Each feature/checkpoint must be fully functional, tested, and human-approved before proceeding to the next one.

3. **Integration integrity is paramount** - New features must never break existing functionality. The app must remain in a working state at all times.

**Success Measurement**: The app's success depends on users successfully completing shopping trips with price tracking. Everything else is secondary to this core experience.

**User-Centric Approach**: Always consider the user journey. Sarah needs to quickly update prices while shopping with kids. Marcus needs to make budget decisions on the spot. Linda wants efficiency without complexity.

Build incrementally, test thoroughly, and prioritize the Active Shopping Mode experience above all else.