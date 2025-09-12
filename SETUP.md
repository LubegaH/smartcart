# SmartCart Setup Instructions

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## Initial Setup

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Supabase Configuration**:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Schema** (run in Supabase SQL Editor):
   ```sql
   -- Enable auth
   -- Supabase Auth is enabled by default
   
   -- User profiles table
   CREATE TABLE user_profiles (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
     display_name text,
     default_budget numeric(10,2),
     preferences jsonb DEFAULT '{}',
     created_at timestamp with time zone DEFAULT now(),
     updated_at timestamp with time zone DEFAULT now()
   );
   
   -- Enable RLS
   ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
   
   -- RLS policies
   CREATE POLICY "Users can only access their own profile" ON user_profiles
     FOR ALL USING (auth.uid() = user_id);
   ```

4. **Email Templates** (Optional - Supabase has defaults):
   - Configure in Supabase Dashboard > Authentication > Email Templates
   - Update confirmation and password reset templates with your branding

## Development

```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Lint code
npm run lint

# Run unit tests
npm run test

# Run E2E tests (requires browser installation)
npm run test:e2e
```

## Features Available

**Authentication:**
- ✅ Email/password registration with verification
- ✅ Secure login/logout
- ✅ Password reset flow
- ✅ Session management with persistence
- ✅ Mobile-optimized forms with validation
- ✅ Error handling and user feedback

**Navigation:**
- ✅ Mobile-first bottom navigation with 4-tab layout
- ✅ WCAG 2.1 AA accessibility compliance
- ✅ Keyboard navigation support (arrow keys, Enter/Space)
- ✅ Touch-optimized interface (56px minimum touch targets)
- ✅ PWA-compatible with safe area handling
- ✅ Context-aware active state management

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Main dashboard
│   ├── trips/          # Shopping trips management
│   ├── retailers/      # Retailer management
│   └── profile/        # User profile and settings
├── components/
│   ├── auth/           # Auth-specific components
│   ├── navigation/     # Bottom navigation component
│   │   ├── bottom-nav.tsx  # Main navigation component
│   │   └── __tests__/      # Navigation unit tests
│   └── ui/             # Reusable UI components
├── lib/
│   ├── auth.ts         # Authentication service layer
│   ├── supabase.ts     # Supabase client
│   └── validations.ts  # Form validation schemas
├── stores/
│   └── auth.ts         # Zustand auth state management
├── types/
│   └── navigation.ts   # Navigation type definitions
tests/
└── e2e/
    ├── navigation/     # Navigation E2E tests
    ├── accessibility/  # Accessibility tests
    ├── performance/    # Performance tests
    └── mobile/         # Mobile-specific tests
```

## Next Steps

After Supabase is connected:
1. Visit `http://localhost:3000` 
2. Click "Create Account" to test registration
3. Check your email for verification link
4. Test login/logout functionality
5. Navigate between tabs using the bottom navigation
6. Test keyboard navigation (Tab to navigation, Arrow keys to move between tabs)
7. Ready for Phase 2.2: Core Data Models & Database

## Testing

### Unit Tests

SmartCart includes comprehensive unit tests using Vitest and React Testing Library:

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with UI
npm run test -- --ui
```

### End-to-End Tests

E2E tests are implemented with Playwright and include:

- Navigation functionality and accessibility
- Mobile touch interactions
- Keyboard navigation
- Performance benchmarks

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run specific test suite
npx playwright test tests/e2e/navigation/

# Run tests in headed mode
npx playwright test --headed

# Run accessibility tests only
npx playwright test tests/e2e/accessibility/
```

### Testing Configuration

- **Unit Tests**: `vitest.config.mjs` with React Testing Library setup
- **E2E Tests**: `playwright.config.ts` with mobile viewport testing
- **Accessibility**: Integrated with @axe-core/playwright
- **Coverage**: Available via `npm run test -- --coverage`

## Troubleshooting

**Build Errors**: 
- Ensure Supabase environment variables are set
- Check that `.env.local` is not committed to git
- Clear `.next` directory and rebuild: `rm -rf .next && npm run build`

**Auth Not Working**:
- Verify Supabase URL and anon key are correct
- Check Supabase project is active
- Ensure email confirmations are enabled in Supabase Dashboard

**Navigation Issues**:
- Verify all 4 main routes exist: `/dashboard`, `/trips`, `/retailers`, `/profile`
- Check that navigation component is imported in `app/layout.tsx`
- Ensure safe area CSS variables are available in your environment

**Test Failures**:
- Install Playwright browsers: `npx playwright install`
- Check that development server is not running during E2E tests
- For accessibility tests, ensure proper ARIA attributes in components
- Mobile tests require specific viewport settings in Playwright config

**TypeScript Errors**:
- Run `npm run type-check` to see specific issues
- Navigation types are defined in `src/types/navigation.ts`
- Most auth-related warnings can be ignored for MVP

**PWA Issues**:
- Verify `next-pwa` configuration in `next.config.js`
- Check service worker registration in browser dev tools
- Ensure HTTPS in production for full PWA features

## Performance Monitoring

### Bundle Analysis
```bash
# Build and analyze bundle size
npm run build

# Check specific component impact
# Bottom navigation adds ~3KB gzipped
```

### Accessibility Validation
```bash
# Run accessibility-specific E2E tests
npx playwright test tests/e2e/accessibility/

# Manual accessibility testing checklist:
# - Tab navigation works through all elements
# - Arrow keys navigate between navigation tabs
# - Screen readers announce navigation properly
# - Touch targets meet 44px minimum requirement
```

### Mobile Performance
```bash
# Run mobile-specific performance tests
npx playwright test tests/e2e/mobile/
npx playwright test tests/e2e/performance/

# Key metrics monitored:
# - Touch response time (<100ms)
# - Navigation animation performance (60fps)
# - Bundle size impact on mobile networks
```

## Production Deployment

### Environment Variables
Ensure these are set in your production environment:
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

### Build Optimization
```bash
# Production build with optimizations
npm run build

# Verify PWA service worker generation
# Check .next/static/ for service worker files
# Verify manifest.json is properly generated
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Supabase project set to production mode
- [ ] Email confirmation URLs point to production domain
- [ ] PWA manifest configured with correct URLs and icons
- [ ] HTTPS enabled for full PWA functionality
- [ ] Bottom navigation accessibility tested in production
- [ ] Mobile safe area handling verified on actual devices

## Documentation

For detailed information about implemented features:

- [Bottom Navigation Feature Overview](./docs/bottom-navigation-feature.md)
- [Technical Implementation Details](./docs/bottom-navigation-technical.md)
- [Developer Usage Guide](./docs/bottom-navigation-developer-guide.md)
- [Accessibility Documentation](./docs/bottom-navigation-accessibility.md)
- [Supabase API Documentation](./docs/SUPABASE_API_DOCUMENTATION.md)