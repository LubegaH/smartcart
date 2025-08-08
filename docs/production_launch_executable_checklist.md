# SmartCart Production Launch - Executable Checklist

## Pre-Launch Preparation

### Step 1: Create Production Supabase Project

#### 1.1 Create New Supabase Project
```bash
# Navigate to https://supabase.com/dashboard
# Click "New project"
```

**Manual Steps:**
1. **Project Name**: `smartcart-production`
2. **Database Password**: Generate strong password (save in password manager)
   ```bash
   # Generate secure password
   openssl rand -base64 32
   ```
3. **Region**: Choose closest to target users
4. **Pricing Plan**: Start with Free tier
5. Click "Create new project"

#### 1.2 Note Down Project Credentials
```bash
# Save these values (found in Settings > API):
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJ...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJ...
```

#### 1.3 Set Up Database Schema
```sql
-- Go to Supabase Dashboard > SQL Editor
-- Execute these SQL commands in order:

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create retailers table
CREATE TABLE retailers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  trip_count INTEGER DEFAULT 0
);

-- 3. Create shopping_trips table
CREATE TABLE shopping_trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  retailer_id UUID REFERENCES retailers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('planned', 'active', 'completed', 'archived')) DEFAULT 'planned',
  estimated_total DECIMAL(10,2) DEFAULT 0,
  actual_total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create trip_items table
CREATE TABLE trip_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES shopping_trips(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  estimated_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create price_history table
CREATE TABLE price_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  retailer_id UUID REFERENCES retailers(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')) DEFAULT 'high',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  preferred_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies
-- Retailers policies
CREATE POLICY "Users can manage own retailers" ON retailers
  FOR ALL USING (auth.uid() = user_id);

-- Shopping trips policies  
CREATE POLICY "Users can manage own trips" ON shopping_trips
  FOR ALL USING (auth.uid() = user_id);

-- Trip items policies
CREATE POLICY "Users can manage items in own trips" ON trip_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shopping_trips 
      WHERE shopping_trips.id = trip_items.trip_id 
      AND shopping_trips.user_id = auth.uid()
    )
  );

-- Price history policies
CREATE POLICY "Users can manage own price history" ON price_history
  FOR ALL USING (auth.uid() = user_id);

-- User profiles policies
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

-- 9. Create indexes for performance
CREATE INDEX idx_retailers_user_id ON retailers(user_id);
CREATE INDEX idx_shopping_trips_user_id ON shopping_trips(user_id);
CREATE INDEX idx_shopping_trips_status ON shopping_trips(status);
CREATE INDEX idx_trip_items_trip_id ON trip_items(trip_id);
CREATE INDEX idx_price_history_user_item ON price_history(user_id, item_name);
CREATE INDEX idx_price_history_date ON price_history(date DESC);

-- 10. Create functions and triggers
-- Function to update trip totals
CREATE OR REPLACE FUNCTION update_trip_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shopping_trips SET
    estimated_total = (
      SELECT COALESCE(SUM(estimated_price * quantity), 0)
      FROM trip_items 
      WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id)
    ),
    actual_total = (
      SELECT COALESCE(SUM(actual_price * quantity), 0)
      FROM trip_items 
      WHERE trip_id = COALESCE(NEW.trip_id, OLD.trip_id) 
      AND actual_price IS NOT NULL
    )
  WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_trip_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON trip_items
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_totals();

-- Function to record price history
CREATE OR REPLACE FUNCTION record_price_history()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.actual_price IS NOT NULL AND (OLD.actual_price IS NULL OR NEW.actual_price != OLD.actual_price) THEN
    INSERT INTO price_history (user_id, retailer_id, item_name, price, date)
    SELECT 
      st.user_id,
      st.retailer_id,
      NEW.item_name,
      NEW.actual_price,
      CURRENT_DATE
    FROM shopping_trips st
    WHERE st.id = NEW.trip_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER record_price_history_trigger
  AFTER UPDATE ON trip_items
  FOR EACH ROW
  EXECUTE FUNCTION record_price_history();
```

#### 1.4 Configure Supabase Auth Settings
```bash
# Go to Authentication > Settings in Supabase Dashboard
```

**Manual Steps:**
1. **Site URL**: Leave as `http://localhost:3000` for now (will update later)
2. **Additional Redirect URLs**: Add `http://localhost:3000/auth/callback`
3. **JWT expiry**: 3600 (1 hour)
4. **Enable email confirmations**: ON
5. **Double confirm email changes**: ON

---

### Step 2: Prepare Local Environment

#### 2.1 Create Production Environment File
```bash
# Create production environment file
touch .env.production

# Add the following content (replace with your actual values):
cat > .env.production << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com

# Generate this secret
NEXTAUTH_SECRET=your-generated-secret-here
EOF
```

#### 2.2 Generate Secure Secrets
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Copy the output and add to .env.production
```

#### 2.3 Create App Icons and PWA Assets
```bash
# Create icons directory
mkdir -p public/icons

# You'll need to create these icons manually or use a tool like:
# https://realfavicongenerator.net/
# or
# https://www.pwabuilder.com/imageGenerator

# Required files:
# public/icon-192x192.png (192x192 pixels)
# public/icon-512x512.png (512x512 pixels)  
# public/favicon.ico
# public/apple-touch-icon.png (180x180 pixels)
```

#### 2.4 Update PWA Manifest
```bash
# Update public/manifest.json
cat > public/manifest.json << EOF
{
  "name": "SmartCart - Smart Shopping Companion",
  "short_name": "SmartCart",
  "description": "Intelligent grocery shopping with price tracking and offline lists",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#10b981",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png", 
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["shopping", "productivity", "lifestyle"],
  "screenshots": [
    {
      "src": "/screenshot1.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
EOF
```

#### 2.5 Test Production Build
```bash
# Clean previous builds
rm -rf .next

# Run production build
npm run build

# Check for any build errors
echo "Build completed. Check output above for any errors."

# Test production mode locally
npm start

# Open browser to http://localhost:3000 and test:
# - User registration/login
# - Create retailer and trip
# - Add items
# - Active shopping mode
# - PWA installation
# - Offline functionality
```

---

### Step 3: Deploy to Vercel

#### 3.1 Connect Repository to Vercel
```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd /Users/ham/Downloads/smartcart
vercel

# Follow the prompts:
# ? Set up and deploy "~/Downloads/smartcart"? Y
# ? Which scope do you want to deploy to? [your-account]
# ? Link to existing project? N
# ? What's your project's name? smartcart
# ? In which directory is your code located? ./
```

#### 3.2 Configure Environment Variables in Vercel
```bash
# Add environment variables via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste your Supabase URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production  
# Paste your anon key when prompted

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste your service role key when prompted

vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://your-domain.com (or temporary Vercel URL)

vercel env add NEXTAUTH_URL production
# Enter: https://your-domain.com (or temporary Vercel URL)

vercel env add NEXTAUTH_SECRET production
# Paste your generated secret when prompted

# Alternatively, use Vercel Dashboard:
# 1. Go to vercel.com/dashboard
# 2. Select your project
# 3. Go to Settings > Environment Variables
# 4. Add each variable for Production environment
```

#### 3.3 Configure Custom Domain
```bash
# Add custom domain via CLI
vercel domains add your-domain.com

# Or via Dashboard:
# 1. Project Settings > Domains
# 2. Add Domain: your-domain.com
# 3. Add Domain: www.your-domain.com
```

#### 3.4 Configure DNS Records
```bash
# Go to your domain registrar's DNS management
# Add these records:

# For apex domain (your-domain.com):
# Type: A
# Name: @ (or leave empty)
# Value: 76.76.19.19
# TTL: Auto or 300

# For www subdomain:
# Type: CNAME  
# Name: www
# Value: cname.vercel-dns.com
# TTL: Auto or 300

# Check DNS propagation:
dig your-domain.com
dig www.your-domain.com
```

#### 3.5 Update Supabase Auth Settings
```bash
# Once your domain is live, update Supabase:
# Go to Supabase Dashboard > Authentication > Settings

# Update these fields:
# Site URL: https://your-domain.com
# Additional Redirect URLs: 
#   https://your-domain.com/auth/callback
#   https://www.your-domain.com/auth/callback
```

#### 3.6 Redeploy with Updated Settings
```bash
# Trigger new deployment
vercel --prod

# Or push a commit to trigger auto-deployment
git add .
git commit -m "Production configuration updates"
git push origin main
```

---

### Step 4: Production Testing

#### 4.1 Core Functionality Test
```bash
# Open your production site
open https://your-domain.com

# Test checklist:
echo "Testing production deployment..."
echo "✓ Site loads correctly"
echo "✓ HTTPS is working (green lock icon)"
echo "✓ PWA manifest loads (check DevTools > Application)"
echo "✓ Service worker registers"
echo "✓ All icons and assets load"

# Manual testing required:
# 1. Register new account
# 2. Check email for confirmation
# 3. Login with confirmed account
# 4. Create retailer
# 5. Create shopping trip
# 6. Add items (test price intelligence)
# 7. Start shopping mode
# 8. Test offline functionality
# 9. Install PWA on mobile device
```

#### 4.2 Performance Audit
```bash
# Run Lighthouse audit
npx lighthouse https://your-domain.com --output=html --output-path=lighthouse-prod.html

# Or use online tool:
echo "Visit: https://pagespeed.web.dev/"
echo "Enter: https://your-domain.com"
echo "Target scores:"
echo "- Performance: >90"
echo "- Accessibility: >90"
echo "- Best Practices: >90" 
echo "- SEO: >80"
echo "- PWA: All checks pass"
```

#### 4.3 Cross-Browser Testing
```bash
# Test in multiple browsers:
echo "Testing browsers:"
echo "✓ Chrome (desktop & mobile)"
echo "✓ Safari (desktop & mobile)" 
echo "✓ Firefox (desktop & mobile)"
echo "✓ Edge (desktop)"

# Mobile testing:
echo "Mobile testing:"
echo "✓ iOS Safari"
echo "✓ Android Chrome"
echo "✓ PWA installation works"
echo "✓ Touch targets are appropriate"
echo "✓ Offline functionality works"
```

---

### Step 5: Monitoring Setup

#### 5.1 Set Up Vercel Analytics
```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to app/layout.tsx
cat >> src/app/layout.tsx << 'EOF'

import { Analytics } from '@vercel/analytics/react'

// Add <Analytics /> before closing </body> tag
EOF

# Deploy updated code
git add .
git commit -m "Add Vercel Analytics"
git push origin main
```

#### 5.2 Database Monitoring Setup
```bash
# Go to Supabase Dashboard > Settings > Billing
# Set up usage alerts (recommended):
# - Database size: 80% of limit
# - Auth users: 80% of limit  
# - API requests: 80% of limit
```

#### 5.3 Error Monitoring
```bash
# Check logs regularly:
# Vercel Dashboard > Functions tab (for API errors)
# Supabase Dashboard > Logs (for database errors)

# Set up monitoring script (optional):
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
URL="https://your-domain.com"
STATUS=$(curl -o /dev/null -s -w "%{http_code}\n" $URL)

if [ $STATUS -eq 200 ]; then
  echo "Site is up: $STATUS"
else
  echo "Site is down: $STATUS"
  # Add notification logic here
fi
EOF

chmod +x scripts/health-check.sh
```

---

### Step 6: Content & Legal Pages

#### 6.1 Create Privacy Policy
```bash
# Create privacy policy page
mkdir -p src/app/privacy
cat > src/app/privacy/page.tsx << 'EOF'
export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose max-w-none">
        <p className="mb-4"><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">Information We Collect</h2>
        <p className="mb-4">
          SmartCart collects information you provide directly, including:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Account information (email address, name)</li>
          <li>Shopping data (retailers, trips, items, prices)</li>
          <li>Usage data and preferences</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">How We Use Your Information</h2>
        <p className="mb-4">We use your information to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Provide and improve our services</li>
          <li>Enable price intelligence features</li>
          <li>Send important service communications</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">Data Storage</h2>
        <p className="mb-4">
          Your data is securely stored using Supabase (supabase.com), which provides 
          enterprise-grade security and compliance.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">Contact Us</h2>
        <p className="mb-4">
          For privacy concerns, contact us at: privacy@your-domain.com
        </p>
      </div>
    </div>
  )
}
EOF
```

#### 6.2 Create Terms of Service
```bash
# Create terms of service page
mkdir -p src/app/terms
cat > src/app/terms/page.tsx << 'EOF'
export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose max-w-none">
        <p className="mb-4"><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">Acceptance of Terms</h2>
        <p className="mb-4">
          By using SmartCart, you agree to these terms of service.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">Service Description</h2>
        <p className="mb-4">
          SmartCart is a grocery shopping companion app that helps you track 
          prices and manage shopping lists.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">User Responsibilities</h2>
        <ul className="list-disc pl-6 mb-4">
          <li>Provide accurate information</li>
          <li>Use the service lawfully</li>
          <li>Protect your account credentials</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">Limitation of Liability</h2>
        <p className="mb-4">
          SmartCart is provided "as is" without warranties. We are not liable 
          for any damages arising from use of the service.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">Contact</h2>
        <p className="mb-4">
          For questions about these terms, contact: legal@your-domain.com
        </p>
      </div>
    </div>
  )
}
EOF
```

#### 6.3 Create Help Page
```bash
# Create help documentation
mkdir -p src/app/help
cat > src/app/help/page.tsx << 'EOF'
export default function Help() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Help & Support</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Creating Your First Shopping Trip</h3>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Create a retailer (store where you shop)</li>
              <li>Create a new shopping trip</li>
              <li>Add items to your trip</li>
              <li>Start shopping mode when you're at the store</li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Using Active Shopping Mode</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <ul className="list-disc pl-4 space-y-1">
              <li>Tap items to mark them as found</li>
              <li>Update prices by tapping on price fields</li>
              <li>Use the undo button if you make mistakes</li>
              <li>Complete your trip when all items are found</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Installing the App</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="mb-2"><strong>On iPhone/iPad:</strong></p>
            <p className="mb-3">Open in Safari, tap share button, select "Add to Home Screen"</p>
            <p className="mb-2"><strong>On Android:</strong></p>
            <p>Look for the "Install app" prompt or use browser menu</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Need More Help?</h2>
          <p className="text-gray-600">
            Contact us at: <a href="mailto:support@your-domain.com" className="text-primary hover:underline">support@your-domain.com</a>
          </p>
        </section>
      </div>
    </div>
  )
}
EOF
```

#### 6.4 Deploy Legal Pages
```bash
# Deploy the new pages
git add .
git commit -m "Add privacy policy, terms, and help pages"
git push origin main

# Wait for deployment to complete
vercel ls
```

---

### Step 7: Final Production Checks

#### 7.1 Security Verification
```bash
# Check environment variables are not exposed
echo "Checking for exposed secrets..."

# Check build output doesn't contain secrets
grep -r "supabase.*eyJ" .next/ || echo "✓ No exposed Supabase keys"
grep -r "sk_" .next/ || echo "✓ No exposed secret keys"

# Verify HTTPS is working
curl -I https://your-domain.com | head -n 1
```

#### 7.2 SEO & Meta Tags Check
```bash
# Check meta tags are working
curl -s https://your-domain.com | grep -o '<title>.*</title>'
curl -s https://your-domain.com | grep -o '<meta.*description.*>'

# Test Open Graph tags
curl -s https://your-domain.com | grep -o '<meta.*property="og:.*".*>'
```

#### 7.3 Final Performance Test
```bash
# Quick performance check
curl -w "@curl-format.txt" -o /dev/null https://your-domain.com

# Create curl timing format file
cat > curl-format.txt << 'EOF'
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF
```

---

### Step 8: Go Live!

#### 8.1 Final Deployment
```bash
# Ensure everything is deployed
git status
git push origin main

# Verify deployment
vercel ls | head -5
```

#### 8.2 Announcement Preparation
```bash
# Create simple announcement text
cat > launch-announcement.md << 'EOF'
🚀 SmartCart is now live!

Your intelligent grocery shopping companion is ready to transform how you shop.

✨ Features:
• Smart price tracking and history
• Offline shopping lists
• Real-time budget tracking
• Install as an app on your phone

Try it now: https://your-domain.com

#SmartCart #GroceryShopping #PWA
EOF

echo "🎉 SmartCart is now LIVE in production!"
echo "📱 Visit: https://your-domain.com"
echo "📊 Monitor: https://vercel.com/dashboard"
echo "🗄️ Database: https://supabase.com/dashboard"
```

#### 8.3 Post-Launch Monitoring Checklist
```bash
echo "Post-launch monitoring checklist:"
echo "□ Check Vercel Function logs for errors"
echo "□ Monitor Supabase logs for database issues"  
echo "□ Test user registration flow"
echo "□ Monitor site performance"
echo "□ Check PWA installation works on mobile"
echo "□ Verify email notifications work"
echo "□ Test offline functionality"
echo "□ Monitor user feedback"

# Set up daily health check
echo "Set reminder to check these daily for first week:"
echo "- Vercel Analytics dashboard"
echo "- Supabase usage metrics"
echo "- User registration success rate"
echo "- Any error reports"
```

---

## Troubleshooting Commands

### Common Issues & Fixes

#### Build Issues
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Check for missing dependencies
npm install
```

#### Environment Variable Issues
```bash
# List current Vercel env vars
vercel env ls

# Remove and re-add problematic env var
vercel env rm NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Redeploy after env var changes
vercel --prod
```

#### Domain/DNS Issues
```bash
# Check DNS propagation
dig your-domain.com
nslookup your-domain.com

# Check SSL certificate
curl -I https://your-domain.com

# Force SSL redirect check
curl -I http://your-domain.com
```

#### Database Connection Issues
```bash
# Test Supabase connection
curl -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://your-project.supabase.co/rest/v1/retailers?select=*"

# Check RLS policies in Supabase Dashboard
# Go to: Table Editor > Select table > View policies
```

---

## Success Metrics to Track

### Week 1 Metrics
```bash
# Track these metrics daily:
echo "Daily tracking checklist:"
echo "□ New user registrations"
echo "□ Trip creation rate" 
echo "□ Active shopping session completions"
echo "□ PWA installation rate"
echo "□ Error rate (should be <1%)"
echo "□ Page load times (should be <3s)"
echo "□ Database query performance"
echo "□ Support requests/issues"
```

### Monitoring Tools
```bash
# Bookmark these URLs for easy monitoring:
echo "Monitoring Dashboard URLs:"
echo "📊 Vercel Analytics: https://vercel.com/dashboard"
echo "🗄️ Supabase Dashboard: https://supabase.com/dashboard"  
echo "⚡ PageSpeed Insights: https://pagespeed.web.dev/"
echo "🔍 Lighthouse: Run 'npx lighthouse https://your-domain.com'"
```

---

**🎉 SmartCart Production Launch Complete!**

Your app is now live and ready for users. Monitor the metrics above and be prepared to address any issues quickly in the first week.

**Total estimated time: 4-6 hours**