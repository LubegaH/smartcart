# SmartCart Production Launch Checklist

## Overview
This checklist covers the complete process to launch SmartCart into production using Vercel for hosting and Supabase for backend services. Follow each section in order to ensure a smooth deployment.

---

## Phase 1: Pre-Launch Setup & Configuration

### 1.1 Environment & Security Setup

#### ✅ Supabase Production Configuration
- [ ] **Create Production Supabase Project**
  - Go to [supabase.com](https://supabase.com) → New Project
  - Choose a production-ready name: `smartcart-prod`
  - Select a region close to your target users
  - Use a strong database password (save in password manager)
  - Note down: Project URL, Anon Key, Service Role Key

- [ ] **Configure Database Schema**
  ```bash
  # Run all migration files in production database
  # Via Supabase Dashboard → SQL Editor, execute in order:
  # 1. Create tables (retailers, shopping_trips, trip_items, price_history)
  # 2. Set up RLS policies
  # 3. Create triggers for price history and totals
  # 4. Add indexes for performance
  ```

- [ ] **Set up Supabase Auth Configuration**
  - Dashboard → Authentication → Settings
  - **Site URL**: `https://your-domain.com` (update after Vercel deployment)
  - **Redirect URLs**: Add `https://your-domain.com/auth/callback`
  - **Email Templates**: Customize for production (optional)
  - **Auth Providers**: Configure if using OAuth (Google, etc.)

- [ ] **Configure Row Level Security (RLS)**
  - Verify all tables have RLS enabled
  - Test policies work correctly with production data
  - Ensure user isolation is working

#### ✅ Domain & SSL Setup
- [ ] **Purchase Production Domain** (if not already owned)
  - Recommended: Use a .com domain for credibility
  - Examples: `smartcart.app`, `mysmartcart.com`, etc.

- [ ] **DNS Configuration** (will be updated after Vercel setup)
  - Keep domain registrar dashboard accessible
  - Note down current nameservers

### 1.2 Code & Configuration Preparation

#### ✅ Environment Variables Setup
- [ ] **Create Production Environment File**
  ```bash
  # Create .env.production (DO NOT commit to git)
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  NEXT_PUBLIC_APP_URL=https://your-domain.com
  NEXTAUTH_URL=https://your-domain.com
  NEXTAUTH_SECRET=your-nextauth-secret-key
  ```

- [ ] **Generate Secure Secrets**
  ```bash
  # Generate NEXTAUTH_SECRET
  openssl rand -base64 32
  
  # Or use online generator: https://generate-secret.vercel.app/32
  ```

- [ ] **Update App Configuration**
  ```typescript
  // Update src/lib/constants.ts with production URLs
  export const APP_CONFIG = {
    name: 'SmartCart',
    description: 'Intelligent grocery shopping companion',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com',
    ogImage: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
  }
  ```

#### ✅ PWA Manifest Updates
- [ ] **Update PWA Manifest** (`public/manifest.json`)
  ```json
  {
    "name": "SmartCart - Smart Shopping Companion",
    "short_name": "SmartCart",
    "start_url": "/",
    "scope": "/",
    "display": "standalone",
    "theme_color": "#10b981",
    "background_color": "#ffffff",
    "icons": [
      {
        "src": "/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ]
  }
  ```

- [ ] **Create App Icons**
  - Generate PWA icons: 192x192, 512x512 PNG files
  - Create favicon.ico for browser tab
  - Add apple-touch-icon for iOS
  - Place all in `public/` directory

#### ✅ Production Build Testing
- [ ] **Test Production Build Locally**
  ```bash
  # Test build process
  npm run build
  
  # Test production mode locally
  npm start
  
  # Verify no console errors
  # Test all major user flows
  # Confirm PWA functionality works
  ```

- [ ] **Performance Audit**
  ```bash
  # Run Lighthouse audit
  npx lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html
  
  # Targets:
  # - Performance: >90
  # - Accessibility: >90  
  # - Best Practices: >90
  # - SEO: >80
  # - PWA: All checks pass
  ```

---

## Phase 2: Vercel Deployment Setup

### 2.1 Vercel Project Configuration

#### ✅ Connect Repository to Vercel
- [ ] **Deploy to Vercel**
  - Go to [vercel.com](https://vercel.com) → Import Project
  - Connect GitHub repository
  - Select `smartcart` repository
  - Choose Next.js framework preset

- [ ] **Configure Build Settings**
  ```bash
  # Build Command: (leave default)
  npm run build
  
  # Output Directory: (leave default)
  .next
  
  # Install Command: (leave default)
  npm install
  
  # Development Command: (leave default)
  npm run dev
  ```

#### ✅ Environment Variables Configuration
- [ ] **Add Production Environment Variables**
  - Vercel Dashboard → Project → Settings → Environment Variables
  - Add each variable from your `.env.production`:
    ```
    NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ... (your anon key)
    SUPABASE_SERVICE_ROLE_KEY = eyJ... (your service role key)
    NEXT_PUBLIC_APP_URL = https://your-domain.vercel.app (initially)
    NEXTAUTH_URL = https://your-domain.vercel.app (initially)
    NEXTAUTH_SECRET = your-generated-secret
    ```
  - Set Environment: **Production, Preview, Development**

### 2.2 Domain Configuration

#### ✅ Custom Domain Setup
- [ ] **Add Custom Domain in Vercel**
  - Vercel Dashboard → Project → Settings → Domains
  - Add your custom domain: `your-domain.com`
  - Add www subdomain: `www.your-domain.com`

- [ ] **Configure DNS Records**
  - Go to your domain registrar's DNS settings
  - Add these DNS records:
    ```
    Type: CNAME
    Name: www
    Value: cname.vercel-dns.com
    
    Type: A
    Name: @ (or apex/root)
    Value: 76.76.19.19
    ```
  - **Alternative: Use Vercel Nameservers**
    ```
    ns1.vercel-dns.com
    ns2.vercel-dns.com
    ```

- [ ] **SSL Certificate Verification**
  - Wait for DNS propagation (5-30 minutes)
  - Vercel automatically provisions SSL certificates
  - Verify HTTPS is working: `https://your-domain.com`

#### ✅ Update Environment Variables with Final Domain
- [ ] **Update App URLs**
  ```bash
  # Update in Vercel Environment Variables
  NEXT_PUBLIC_APP_URL = https://your-domain.com
  NEXTAUTH_URL = https://your-domain.com
  ```

- [ ] **Update Supabase Auth Settings**
  - Supabase Dashboard → Authentication → Settings
  - **Site URL**: `https://your-domain.com`
  - **Additional Redirect URLs**: `https://your-domain.com/auth/callback`

- [ ] **Trigger New Deployment**
  - Vercel Dashboard → Deployments → Redeploy
  - Or push a commit to trigger auto-deployment

---

## Phase 3: Production Testing & Verification

### 3.1 Functionality Testing

#### ✅ Core Feature Testing
- [ ] **Authentication Flow**
  - Register new account with real email
  - Verify email confirmation works
  - Test login/logout functionality
  - Test password reset flow

- [ ] **Trip Management**
  - Create retailer
  - Create shopping trip
  - Add items with price intelligence
  - Test trip duplication
  - Test bulk operations

- [ ] **Active Shopping Mode**
  - Start shopping mode
  - Test item check-offs
  - Test price updates
  - Test undo functionality
  - Verify running totals
  - Test trip completion

- [ ] **PWA Functionality**
  - Test installation prompt
  - Install PWA on mobile device
  - Test offline functionality
  - Verify sync when back online

#### ✅ Performance & Technical Testing
- [ ] **Cross-Browser Testing**
  - Chrome (desktop & mobile)
  - Safari (desktop & mobile)
  - Firefox (desktop & mobile)
  - Edge (desktop)

- [ ] **Mobile Testing**
  - Test on iOS Safari
  - Test on Android Chrome
  - Verify touch targets (56px minimum)
  - Test haptic feedback
  - Test swipe gestures

- [ ] **Performance Testing**
  ```bash
  # Test site speed
  # Visit: https://pagespeed.web.dev/
  # Enter: https://your-domain.com
  # Target: >90 Performance score
  ```

### 3.2 Monitoring & Analytics Setup

#### ✅ Error Monitoring
- [ ] **Set up Vercel Analytics** (Optional but recommended)
  ```bash
  npm install @vercel/analytics
  ```
  
- [ ] **Configure Error Tracking**
  ```typescript
  // Add to app/layout.tsx
  import { Analytics } from '@vercel/analytics/react'
  
  export default function RootLayout({ children }) {
    return (
      <html>
        <body>
          {children}
          <Analytics />
        </body>
      </html>
    )
  }
  ```

#### ✅ Database Monitoring
- [ ] **Supabase Monitoring Setup**
  - Supabase Dashboard → Settings → API
  - Monitor API usage limits
  - Set up billing alerts if needed
  - Review database performance metrics

---

## Phase 4: Launch Preparation

### 4.1 Content & SEO

#### ✅ SEO Configuration
- [ ] **Meta Tags & Open Graph**
  ```typescript
  // Update app/layout.tsx
  export const metadata = {
    title: 'SmartCart - Intelligent Grocery Shopping',
    description: 'Transform your grocery shopping with smart price tracking, offline lists, and intelligent shopping assistance.',
    keywords: 'grocery shopping, price tracking, shopping list, PWA',
    openGraph: {
      title: 'SmartCart - Smart Shopping Companion',
      description: 'Your intelligent grocery shopping assistant',
      url: 'https://your-domain.com',
      siteName: 'SmartCart',
      images: ['/og-image.png'],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'SmartCart - Smart Shopping Companion',
      description: 'Your intelligent grocery shopping assistant',
      images: ['/og-image.png'],
    },
  }
  ```

- [ ] **Create robots.txt**
  ```txt
  # public/robots.txt
  User-agent: *
  Allow: /
  
  Sitemap: https://your-domain.com/sitemap.xml
  ```

- [ ] **Create sitemap.xml** (Optional for MVP)

#### ✅ Legal & Privacy
- [ ] **Privacy Policy** (Required for production)
  - Create `/privacy` page
  - Cover data collection, usage, storage
  - Mention Supabase as data processor
  - Include contact information

- [ ] **Terms of Service** (Recommended)
  - Create `/terms` page
  - Basic user terms and service usage
  - Liability limitations

### 4.2 User Support Setup

#### ✅ Support Infrastructure
- [ ] **Contact Information**
  - Create `/contact` page
  - Set up support email: `support@your-domain.com`
  - Add contact form (optional)

- [ ] **Help Documentation** (Basic)
  - Create `/help` page with:
    - How to create your first shopping trip
    - How to use Active Shopping Mode
    - How to install the PWA
    - Troubleshooting common issues

---

## Phase 5: Go-Live & Monitoring

### 5.1 Final Pre-Launch Checks

#### ✅ Production Readiness Checklist
- [ ] **Security Verification**
  - All environment variables configured
  - No secrets in code repository
  - HTTPS working correctly
  - Database RLS policies active

- [ ] **Performance Verification**
  - Lighthouse score >90 Performance
  - First Contentful Paint <2s
  - Time to Interactive <3s
  - PWA installable

- [ ] **Functionality Verification**
  - Complete user registration → shopping → completion flow
  - Offline/online sync working
  - Email notifications working
  - Cross-device testing completed

### 5.2 Launch Execution

#### ✅ Go-Live Steps
- [ ] **Final Deployment**
  ```bash
  # Ensure latest code is deployed
  git push origin main
  # Verify deployment successful in Vercel
  ```

- [ ] **DNS Propagation Check**
  ```bash
  # Check DNS propagation globally
  # Visit: https://www.whatsmydns.net/
  # Enter your domain name
  # Verify A and CNAME records are propagated
  ```

- [ ] **Production Smoke Test**
  - Register test account
  - Complete full shopping trip workflow
  - Test PWA installation
  - Verify all features working

### 5.3 Post-Launch Monitoring

#### ✅ Immediate Monitoring (First 24 hours)
- [ ] **Error Monitoring**
  - Check Vercel Function logs for errors
  - Monitor Supabase logs for database issues
  - Watch for 404 errors or broken links

- [ ] **Performance Monitoring**
  - Monitor Vercel Analytics for traffic
  - Check page load times
  - Monitor API response times

- [ ] **User Registration Tracking**
  - Monitor new user registrations
  - Track completion rates for onboarding
  - Monitor for any auth-related issues

#### ✅ First Week Monitoring
- [ ] **Usage Analytics**
  - Track user engagement metrics
  - Monitor feature usage (shopping mode, price intelligence)
  - Identify any user flow drop-offs

- [ ] **Technical Metrics**
  - Database performance and query times
  - API rate limits and usage
  - PWA installation rates

- [ ] **User Feedback Collection**
  - Set up feedback collection mechanism
  - Monitor for user-reported issues
  - Track support requests

---

## Troubleshooting Guide

### Common Issues & Solutions

#### Build/Deployment Issues
```bash
# Issue: Build fails on Vercel
# Solution: Check build logs, ensure all dependencies in package.json

# Issue: Environment variables not working
# Solution: Verify spelling, redeploy after adding variables

# Issue: Database connection fails
# Solution: Check Supabase URL and keys, verify RLS policies
```

#### Domain/SSL Issues
```bash
# Issue: Domain not resolving
# Solution: Check DNS records, wait for propagation (up to 48 hours)

# Issue: SSL certificate issues
# Solution: Verify domain ownership, contact Vercel support if needed
```

#### Performance Issues
```bash
# Issue: Slow loading times
# Solution: Check bundle size, optimize images, enable caching

# Issue: PWA not installing
# Solution: Verify manifest.json, check service worker registration
```

---

## Launch Communication Plan

### 5.4 Announcement Strategy

#### ✅ Soft Launch (Beta Testing)
- [ ] **Beta User Recruitment**
  - Invite friends and family for initial testing
  - Target 10-20 beta users initially
  - Provide feedback collection mechanism

- [ ] **Beta Testing Period**
  - Run for 1-2 weeks
  - Collect user feedback
  - Monitor for critical issues
  - Make necessary fixes

#### ✅ Public Launch Preparation
- [ ] **Marketing Materials**
  - Create simple landing page copy
  - Prepare social media posts
  - Create basic product screenshots/demo

- [ ] **Launch Channels** (Optional for MVP)
  - Personal social media
  - ProductHunt submission
  - Local community sharing

---

## Success Metrics & KPIs

### Key Metrics to Track Post-Launch
- **User Acquisition**: New registrations per day/week
- **User Engagement**: Trip creation and completion rates
- **Feature Usage**: Active Shopping Mode adoption
- **Technical Performance**: Page load times, error rates
- **PWA Adoption**: Installation rates on mobile devices

---

## Support & Maintenance Schedule

### Ongoing Maintenance
- **Daily**: Monitor error logs and user feedback
- **Weekly**: Review analytics and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Feature updates based on user feedback

---

This checklist should take approximately 4-6 hours to complete fully, depending on DNS propagation times. Follow each section carefully and test thoroughly at each step to ensure a successful production launch.

**Ready to launch SmartCart into production!** 🚀