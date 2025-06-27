# SmartCart Supabase API Documentation

## Overview

This document provides comprehensive documentation for Supabase integration in SmartCart, including authentication patterns, database operations, and best practices.

## Table of Contents

1. [Authentication System](#authentication-system)
2. [Database Schema](#database-schema)
3. [Service Layer Architecture](#service-layer-architecture)
4. [Error Handling Patterns](#error-handling-patterns)
5. [Security Implementation](#security-implementation)
6. [Testing Patterns](#testing-patterns)
7. [API Reference](#api-reference)

---

## Authentication System

### Overview

SmartCart implements a complete authentication system using Supabase Auth with the following features:
- Email/password registration with email verification
- Secure login/logout with session management
- Password reset functionality
- User profile management
- GDPR-compliant data controls

### Authentication Flow

```typescript
// 1. User Registration
const result = await authService.register({
  email: 'user@example.com',
  password: 'securePassword123',
  confirmPassword: 'securePassword123',
  acceptTerms: true
})

// 2. Email Verification (handled by Supabase)
// User receives email with verification link

// 3. User Login
const loginResult = await authService.login({
  email: 'user@example.com',
  password: 'securePassword123'
})

// 4. Session Management (automatic)
// Sessions persist across browser restarts
// Automatic token refresh handled by Supabase
```

### Authentication Service API

Located in: `src/lib/auth.ts`

#### Register User
```typescript
authService.register(data: RegisterFormData): Promise<Result<AuthResponse>>

interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

interface AuthResponse {
  user: AuthUser | null
  needsVerification: boolean
}
```

#### Login User
```typescript
authService.login(data: LoginFormData): Promise<Result<AuthUser>>

interface LoginFormData {
  email: string
  password: string
}
```

#### Logout User
```typescript
authService.logout(): Promise<Result<null>>
```

#### Password Reset
```typescript
authService.resetPassword(data: ResetPasswordFormData): Promise<Result<null>>

interface ResetPasswordFormData {
  email: string
}
```

#### Session Management
```typescript
// Get current session
authService.getSession(): Promise<Result<AuthUser | null>>

// Refresh session
authService.refreshSession(): Promise<Result<AuthUser | null>>

// Resend verification email
authService.resendVerification(email: string): Promise<Result<null>>
```

---

## Database Schema

### User Profiles Table

```sql
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  default_budget DECIMAL(10,2),
  preferences JSONB NOT NULL DEFAULT '{
    "notifications_enabled": true,
    "dark_mode": false,
    "default_currency": "USD"
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);
```

### Automatic Profile Creation

```sql
-- Function to create profile on user registration
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, preferences)
  VALUES (
    NEW.id,
    '{
      "notifications_enabled": true,
      "dark_mode": false,
      "default_currency": "USD"
    }'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run function on user creation
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();
```

---

## Service Layer Architecture

### Profile Service API

Located in: `src/lib/profile.ts`

#### Get User Profile
```typescript
profileService.getProfile(): Promise<Result<UserProfile | null>>
```

#### Create User Profile
```typescript
profileService.createProfile(
  userId: string, 
  initialData?: Partial<UpdateProfileData>
): Promise<Result<UserProfile>>
```

#### Update User Profile
```typescript
profileService.updateProfile(updates: UpdateProfileData): Promise<Result<UserProfile>>

interface UpdateProfileData {
  display_name?: string
  default_budget?: number
  preferences?: Partial<UserPreferences>
}
```

#### Export User Data (GDPR)
```typescript
profileService.exportUserData(): Promise<Result<ExportData>>

interface ExportData {
  profile: UserProfile
  created_at: string
  data_summary: {
    profile_data: boolean
    // Future: trips, items, price_history counts
  }
}
```

#### Delete Account (GDPR)
```typescript
profileService.deleteAccount(): Promise<Result<void>>
```

---

## Error Handling Patterns

### Result Pattern

All service functions use a consistent Result pattern for error handling:

```typescript
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string }

// Usage example
const result = await authService.login({ email, password })
if (result.success) {
  // Handle success
  console.log('User:', result.data)
} else {
  // Handle error
  console.error('Login failed:', result.error)
}
```

### Error Handling Utility

```typescript
// src/lib/supabase.ts
export function handleSupabaseError(error: any): string {
  if (error?.message) {
    return error.message
  }
  return 'An unexpected error occurred'
}
```

### Common Error Patterns

```typescript
// Authentication errors
if (error.message.includes('Invalid login credentials')) {
  return { success: false, error: 'Invalid email or password' }
}

if (error.message.includes('Email not confirmed')) {
  return { success: false, error: 'Please check your email and click the verification link' }
}

// Database errors
if (error.message.includes('Database error saving new user')) {
  return { success: false, error: 'Failed to create account. Please contact support if this issue persists.' }
}
```

---

## Security Implementation

### Environment Variables

Required environment variables:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### Supabase Client Configuration

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Input Validation

All forms use Zod schemas for validation:

```typescript
// src/lib/validations.ts
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')

export const registerSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  acceptTerms: z.boolean().refine((val) => val === true, 'You must accept the terms of service')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})
```

---

## Testing Patterns

### Test Setup

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'

// Set up environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// Mock Supabase for tests
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      // ... other auth methods
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn(),
      eq: vi.fn()
    }))
  },
  handleSupabaseError: vi.fn((error) => error?.message || 'Unknown error')
}))
```

### Test Examples

```typescript
// Example auth service test
describe('authService', () => {
  it('should successfully register a new user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    const mockSession = { access_token: 'token123' }

    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    })

    const result = await authService.register({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      acceptTerms: true
    })

    expect(result.success).toBe(true)
    expect(result.data?.user).toEqual(mockUser)
    expect(result.data?.needsVerification).toBe(false)
  })
})
```

---

## API Reference

### State Management (Zustand)

```typescript
// src/stores/auth.ts
interface AuthState {
  user: AuthUser | null
  profile: UserProfile | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
}

interface AuthActions {
  // Auth actions
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, confirmPassword: string, acceptTerms: boolean) => Promise<{ success: boolean; needsVerification?: boolean }>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<boolean>
  
  // Profile actions
  updateProfile: (updates: UpdateProfileData) => Promise<boolean>
  loadProfile: () => Promise<void>
  
  // Utilities
  clearError: () => void
  reset: () => void
}
```

### Usage in Components

```typescript
// Example component usage
import { useAuthStore } from '@/stores/auth'

export function ProfileComponent() {
  const { user, profile, updateProfile, isLoading, error } = useAuthStore()

  const handleUpdateProfile = async (data: UpdateProfileData) => {
    const success = await updateProfile(data)
    if (success) {
      // Handle success
    }
  }

  return (
    // Component JSX
  )
}
```

### Authentication Guard Pattern

```typescript
// Example protected route
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'

export default function ProtectedPage() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, isLoading, router])

  if (isLoading) return <div>Loading...</div>
  if (!user) return null

  return <div>Protected content</div>
}
```

---

## Best Practices

### 1. Always Use Result Pattern
```typescript
// ✅ Good
const result = await authService.login(data)
if (result.success) {
  // Handle success
} else {
  // Handle error
}

// ❌ Bad
try {
  const user = await authService.login(data)
  // This doesn't follow our error handling pattern
} catch (error) {
  // Inconsistent error handling
}
```

### 2. Validate All Inputs
```typescript
// ✅ Good - Use Zod schemas
const result = registerSchema.safeParse(formData)
if (result.success) {
  await authService.register(result.data)
}

// ❌ Bad - No validation
await authService.register(formData) // Unvalidated data
```

### 3. Handle Loading States
```typescript
// ✅ Good
const { isLoading } = useAuthStore()
if (isLoading) return <LoadingSpinner />

// ❌ Bad - No loading state
// Component renders immediately without considering loading state
```

### 4. Implement Proper Error Boundaries
```typescript
// ✅ Good - Show user-friendly errors
{error && (
  <Alert variant="error">
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}

// ❌ Bad - No error display
// Errors are silently ignored
```

### 5. Use TypeScript Strictly
```typescript
// ✅ Good - Proper typing
interface UpdateProfileData {
  display_name?: string
  default_budget?: number
  preferences?: Partial<UserPreferences>
}

// ❌ Bad - Using any
const updateProfile = (data: any) => {
  // No type safety
}
```

---

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```bash
   Error: Missing required Supabase environment variables
   ```
   Solution: Ensure `.env.local` contains all required variables.

2. **Email Verification Issues**
   ```typescript
   // Check Supabase dashboard for email templates
   // Ensure redirect URLs are configured correctly
   ```

3. **RLS Policy Errors**
   ```sql
   -- Ensure policies are correctly configured
   -- Check that auth.uid() matches user_id in policies
   ```

4. **Session Management**
   ```typescript
   // Sessions should persist automatically
   // If issues occur, check browser storage and Supabase settings
   ```

---

## Future Enhancements

### Planned Features
1. **OAuth Integration** - Google, GitHub, Apple sign-in
2. **Multi-factor Authentication** - SMS, TOTP support
3. **Advanced Profile Features** - Avatar upload, preferences sync
4. **Audit Logging** - Track user actions for security
5. **Session Analytics** - Monitor login patterns

### Database Expansions
1. **Shopping Trips Table** - Core shopping functionality
2. **Items and Price History** - Product tracking
3. **Retailers Table** - Store management
4. **Audit Logs** - Security and compliance tracking

---

This documentation provides a comprehensive guide to the Supabase implementation in SmartCart. For specific implementation details, refer to the source code in the respective files mentioned throughout this document.