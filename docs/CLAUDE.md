# CLAUDE.md - SmartCart Development Workflow

## Project Overview

You are tasked with building **SmartCart**, an intelligent home management PWA focused on grocery shopping optimization, price tracking, and consumption prediction. The MVP centers on "Shopping Trips" with real-time price updating and intelligent price memory.

**Key Value Proposition**: Transform grocery shopping from guesswork to data-driven decisions through Active Shopping Mode with real-time price tracking.

## Essential Context Documents

Before starting any work, thoroughly review these foundational documents:

1. **`user_personas_use_cases.md`** - Core user personas (Sarah, Marcus, Linda) and primary use cases
2. **`user_journey_maps.md`** - Critical user flows and emotional journey analysis
3. **`smartcart_product_roadmap.md#success-metrics--kpis`** - Success criteria and KPIs for the MVP
4. **`functional_nonfunctional_requirements.md`** - Complete technical specifications and acceptance criteria
5. **`pwa_technical_feasibility.md`** - Technical architecture decisions and implementation guidelines
6. **`initial_wireframes.md`** - UI/UX specifications with exact layout requirements
7. **`smartcart_product_roadmap.md`** - Master project plan, audited checkpoint status, and recovery gates (same document as item 3)
8. **`../.claude/context/roadmap_status.md`** - Concise current roadmap status and next priorities
9. **`../.claude/context/development_state.yaml`** - Machine-readable current development and verification state

## Agent Workflow Protocol

### Tech Lead Task Flow

When receiving human requests, follow this systematic approach:

1. **Request Analysis**:

   - Parse human intent and map to `smartcart_product_roadmap.md` requirements and recovery gates
   - Reference `functional_nonfunctional_requirements.md` for acceptance criteria
   - Check `initial_wireframes.md` for UI/UX specifications
   - Review `user_journey_maps.md` for user context and emotional goals
   - Identify the minimal viable implementation approach

2. **Agent Delegation Strategy**:

   - **Backend Engineer**: Database schema, API endpoints, RLS policies, Zod validation
   - **Frontend Engineer**: React components, PWA features, accessibility, mobile-first UI
   - **Code Reviewer**: TypeScript compliance, security validation, architecture review
   - **QA & E2E Engineer**: Test implementation, performance validation, accessibility testing
   - **Docs Agent**: Documentation updates, API reference sync, setup guides

3. **Coordination & Dependencies**:

   - Enable direct Frontend ↔ Backend communication for API contracts
   - Enable direct Frontend ↔ QA communication for test coordination
   - Route all other communication through Tech Lead
   - Manage interdependencies and ensure proper handoffs

4. **Quality Gate Orchestration**:

   - Each agent must approve their domain before checkpoint completion
   - Code Reviewer has veto power on code quality
   - QA Engineer has veto power on performance budgets
   - Backend Engineer has final authority on security policies
   - Coordinate all approvals before presenting to human

5. **Human Interface Management**:
   - Synthesize technical details into clear, actionable summaries
   - Present comprehensive status updates with concrete deliverables
   - Request human approval only for major architectural decisions and checkpoint completions
   - Update `../.claude/context/development_state.yaml` after human approval

### Agent-Specific Implementation Standards

#### Backend Engineer Standards

- **Database Security**: All tables MUST have RLS policies with `auth.uid()` checks
- **Input Validation**: All API inputs MUST use Zod schemas before database operations
- **Performance**: Query times <100ms average, proper indexing on foreign keys
- **Migration Safety**: All migrations reversible with documented rollback procedures

#### Frontend Engineer Standards

- **TypeScript Strict**: No `any` types, all props typed, strict mode compliance
- **PWA Performance**: Bundle <300KB, user interactions <500ms response time
- **Accessibility**: WCAG 2.1 AA compliance, 44px minimum touch targets
- **Mobile-First**: Responsive design with offline-first patterns

#### Code Reviewer Standards

- **Quality Gates**: Block PRs with TypeScript errors, missing tests, security issues
- **Architecture Compliance**: Maintain established patterns, prevent technical debt
- **Security Validation**: Verify RLS policies, input validation, no credential exposure

#### QA & E2E Engineer Standards

- **Test Coverage**: >80% for critical business logic, comprehensive E2E test suites
- **Performance Budgets**: Lighthouse PWA score >90, Core Web Vitals compliance
- **Browser Testing**: Chrome 90+, Safari 14+, Firefox 85+ compatibility
- **Accessibility Testing**: Automated axe-core scans + manual screen reader validation

#### Docs Agent Standards

- **Synchronization**: All code changes must include corresponding documentation updates
- **Accuracy**: All code examples must be tested and functional
- **Completeness**: API docs, setup guides, troubleshooting resources current

### Shared Implementation Principles

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
type Result<T> = { success: true; data: T } | { success: false; error: string };

async function createTrip(
  tripData: CreateTripRequest
): Promise<Result<ShoppingTrip>> {
  try {
    const { data, error } = await supabase
      .from('shopping_trips')
      .insert(tripData)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, error: 'Failed to create trip' };
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

#### Component Architecture

Follow the component hierarchy from wireframes:

```typescript
// Atoms: Basic building blocks
const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  children,
  ...props
}) => {
  // Use design tokens from wireframes document
  const baseClasses = 'rounded-md font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
  };
  // Implementation...
};

// Molecules: Small composed components
const TripCard: React.FC<TripCardProps> = ({ trip, onStartShopping }) => {
  // Follow exact layout from wireframes
  // Implement swipe gestures as specified
};

// Organisms: Complex composed components
const TripList: React.FC<TripListProps> = ({ trips, onCreateTrip }) => {
  // Collection of trip cards with proper spacing
  // Implement pull-to-refresh functionality
};
```

### Testing & Validation

#### Run All Tests

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

#### Manual Testing

- Test the feature in Chrome, Safari, and Firefox
- Verify offline functionality works as expected
- Check responsive design at different screen sizes
- Validate accessibility (keyboard navigation, screen readers)
- Test performance targets (load time, interaction response)

#### Requirement Validation

- Confirm all acceptance criteria are met
- Verify the implementation matches wireframe specifications
- Test all user interaction patterns specified in journey maps
- Ensure error states and edge cases are handled

### Documentation & Communication

#### Update Documentation

- Add JSDoc comments for all public APIs
- Update README if new setup steps are required
- Document any new environment variables or configuration

### Agent Coordination Templates

#### Tech Lead Implementation Summary Template

When presenting completed work to human, use this structure:

```markdown
## Feature Complete: [Feature Name]

### Agent Validations ✅

- **Backend Engineer**: Security, RLS policies, performance validated
- **Frontend Engineer**: TypeScript compliance, PWA standards, accessibility met
- **Code Reviewer**: Code quality approved, architecture compliance verified
- **QA & E2E Engineer**: Test coverage >80%, performance budgets met, cross-browser tested
- **Docs Agent**: Documentation synchronized, API docs updated

### Technical Implementation

- **Files Modified**: [Specific files with brief purpose]
- **Key Features Delivered**: [Bullet points matching acceptance criteria]
- **Database Changes**: [Schema updates with migration status]
- **Performance Impact**: [Metrics showing compliance with budgets]

### Quality Metrics

- **Test Results**: Unit (X passed), Integration (X passed), E2E (X passed)
- **Performance**: Bundle size, Core Web Vitals, response times
- **Security**: RLS policies verified, input validation confirmed
- **Accessibility**: WCAG compliance level achieved

### Ready for Next Phase

- **Dependencies Resolved**: [What this unlocks]
- **Integration Status**: [No regressions confirmed]
- **Recommendations**: [Next logical development steps]
```

#### Agent Task Completion Reporting

Each agent should report back to Tech Lead using:

```markdown
## [Agent Name] - Task Complete

### Deliverables

- [Specific items completed]
- [Files created/modified]
- [Standards met/validated]

### Quality Validation

- [Relevant tests/checks performed]
- [Performance/security measures confirmed]
- [Integration points verified]

### Handoff Notes

- [Dependencies for other agents]
- [Known limitations or technical debt]
- [Recommendations for related work]
```

### Full Feature/Checkpoint Verification

#### Complete End-to-End Validation

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

#### Human Approval for Completion

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

#### Update Product Plan

Only after human approval and current verification evidence, mark the task as complete in `smartcart_product_roadmap.md`:

```markdown
- [x] Task name - ✅ COMPLETED & APPROVED on [date]
  - Human verification: ✅ Confirmed working end-to-end
  - Implementation notes: Brief summary of approach
  - Test coverage: X unit tests, X integration tests (ALL PASSING)
  - Performance impact: Meets targets (load time, response time)
  - Integration status: ✅ No regressions, all existing features working
```

#### Add Review Section

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
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
      },
    },
  ],
});

module.exports = withPWA({
  // Your Next.js config
});
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
  setItems((prev) =>
    prev.map((item) =>
      item.id === itemId ? { ...item, actual_price: newPrice } : item
    )
  );

  // 2. Persist to IndexedDB
  await saveToIndexedDB('price_updates', {
    itemId,
    newPrice,
    timestamp: Date.now(),
  });

  // 3. Queue sync operation
  await queueSyncAction('UPDATE_PRICE', { itemId, newPrice });

  // 4. Attempt server sync if online
  if (navigator.onLine) {
    await attemptSync();
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
    return { success: true, data: result };
  } catch (error) {
    // Log error for debugging
    console.error('Operation failed:', error);

    // Return user-friendly error
    return {
      success: false,
      error: 'Something went wrong. Please try again.',
    };
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

4. **Success Measurement**: The app's success depends on users successfully completing shopping trips with price tracking. Everything else is secondary to this core experience.

5. **User-Centric Approach**: Always consider the user journey. Sarah needs to quickly update prices while shopping with kids. Marcus needs to make budget decisions on the spot. Linda wants efficiency without complexity.
6. **Agent Cordination**: Cordinate the team of agents as efficiently as possible. Each agent should do it's work and only report to you when done.

Build incrementally, test thoroughly, and prioritize the Active Shopping Mode experience above all else.
