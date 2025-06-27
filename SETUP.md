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
```

## Authentication Features Available

- ✅ Email/password registration with verification
- ✅ Secure login/logout
- ✅ Password reset flow
- ✅ Session management with persistence
- ✅ Mobile-optimized forms with validation
- ✅ Error handling and user feedback

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── auth/           # Authentication pages
│   └── dashboard/      # Protected dashboard
├── components/
│   ├── auth/           # Auth-specific components
│   └── ui/             # Reusable UI components
├── lib/
│   ├── auth.ts         # Authentication service layer
│   ├── supabase.ts     # Supabase client
│   └── validations.ts  # Form validation schemas
├── stores/
│   └── auth.ts         # Zustand auth state management
└── types/              # TypeScript type definitions
```

## Next Steps

After Supabase is connected:
1. Visit `http://localhost:3000` 
2. Click "Create Account" to test registration
3. Check your email for verification link
4. Test login/logout functionality
5. Ready for Phase 2.2: Core Data Models & Database

## Troubleshooting

**Build Errors**: 
- Ensure Supabase environment variables are set
- Check that `.env.local` is not committed to git

**Auth Not Working**:
- Verify Supabase URL and anon key are correct
- Check Supabase project is active
- Ensure email confirmations are enabled in Supabase Dashboard

**TypeScript Errors**:
- Run `npm run type-check` to see specific issues
- Most auth-related warnings can be ignored for MVP