import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Authentication Flow with Navbar Visibility
 * 
 * Tests the ConditionalNav component behavior across authentication flows:
 * - Ensures bottom navbar is hidden on auth pages (/auth/*)
 * - Validates navbar appears correctly after authentication
 * - Tests navigation between authenticated pages
 * - Verifies user experience flows correctly from login to authenticated app
 */

test.describe('Authentication Flow with Navbar Visibility', () => {
  test.beforeEach(async ({ page }) => {
    // Set up realistic viewport for mobile PWA testing
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test.describe('Unauthenticated State - Auth Pages', () => {
    test('should not show bottom navbar on login page', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Wait for page to load
      await expect(page).toHaveTitle(/SmartCart/);
      
      // Verify login form is present
      await expect(page.locator('form')).toBeVisible();
      
      // Verify bottom navbar is NOT present
      await expect(page.locator('nav[aria-label="Main navigation"]')).not.toBeVisible();
      
      // Verify specific navigation tabs are not present
      await expect(page.locator('#nav-tab-dashboard')).not.toBeVisible();
      await expect(page.locator('#nav-tab-trips')).not.toBeVisible();
      await expect(page.locator('#nav-tab-retailers')).not.toBeVisible();
      await expect(page.locator('#nav-tab-profile')).not.toBeVisible();
    });

    test('should not show bottom navbar on register page', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Wait for page to load
      await expect(page).toHaveTitle(/SmartCart/);
      
      // Verify register form is present
      await expect(page.locator('form')).toBeVisible();
      
      // Verify bottom navbar is NOT present
      await expect(page.locator('nav[aria-label="Main navigation"]')).not.toBeVisible();
    });

    test('should not show bottom navbar on reset password page', async ({ page }) => {
      await page.goto('/auth/reset-password');
      
      // Wait for page to load
      await expect(page).toHaveTitle(/SmartCart/);
      
      // Verify reset password form is present
      await expect(page.locator('form')).toBeVisible();
      
      // Verify bottom navbar is NOT present
      await expect(page.locator('nav[aria-label="Main navigation"]')).not.toBeVisible();
    });

    test('should not show bottom navbar on auth callback page', async ({ page }) => {
      await page.goto('/auth/callback');
      
      // Verify bottom navbar is NOT present
      await expect(page.locator('nav[aria-label="Main navigation"]')).not.toBeVisible();
    });
  });

  test.describe('Navigation Between Auth Pages', () => {
    test('should maintain navbar hidden when navigating between auth pages', async ({ page }) => {
      // Start on login page
      await page.goto('/auth/login');
      await expect(page.locator('nav[aria-label="Main navigation"]')).not.toBeVisible();
      
      // Navigate to register (if link exists)
      const registerLink = page.locator('a[href*="/auth/register"]').first();
      if (await registerLink.isVisible()) {
        await registerLink.click();
        await expect(page).toHaveURL(/\/auth\/register/);
        await expect(page.locator('nav[aria-label="Main navigation"]')).not.toBeVisible();
      }
      
      // Navigate to reset password (if link exists)
      await page.goto('/auth/login');
      const resetLink = page.locator('a[href*="/auth/reset-password"]').first();
      if (await resetLink.isVisible()) {
        await resetLink.click();
        await expect(page).toHaveURL(/\/auth\/reset-password/);
        await expect(page.locator('nav[aria-label="Main navigation"]')).not.toBeVisible();
      }
    });
  });

  test.describe('Mock Authentication Flow', () => {
    test('should show navbar after successful authentication simulation', async ({ page, context }) => {
      // Mock successful authentication by setting auth state in localStorage
      await page.goto('/auth/login');
      
      // Simulate authentication by setting auth token/state
      await page.evaluate(() => {
        // Mock auth state - this simulates what would happen after successful login
        localStorage.setItem('auth-storage', JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            created_at: new Date().toISOString()
          },
          isInitialized: true
        }));
      });
      
      // Navigate to dashboard (simulating post-login redirect)
      await page.goto('/dashboard');
      
      // Wait for page to load and auth state to initialize
      await page.waitForLoadState('networkidle');
      
      // Verify we're on the dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Verify bottom navbar is now visible
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
      
      // Verify all navigation tabs are present and accessible
      await expect(page.locator('#nav-tab-dashboard')).toBeVisible();
      await expect(page.locator('#nav-tab-trips')).toBeVisible();
      await expect(page.locator('#nav-tab-retailers')).toBeVisible();
      await expect(page.locator('#nav-tab-profile')).toBeVisible();
      
      // Verify dashboard tab is active
      await expect(page.locator('#nav-tab-dashboard')).toHaveAttribute('aria-selected', 'true');
    });

    test('should maintain navbar visibility when navigating between authenticated pages', async ({ page }) => {
      // Set up authenticated state
      await page.goto('/dashboard');
      await page.evaluate(() => {
        localStorage.setItem('auth-storage', JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            created_at: new Date().toISOString()
          },
          isInitialized: true
        }));
      });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify navbar is visible on dashboard
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
      
      // Navigate to trips
      await page.locator('#nav-tab-trips').click();
      await expect(page).toHaveURL('/trips');
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
      await expect(page.locator('#nav-tab-trips')).toHaveAttribute('aria-selected', 'true');
      
      // Navigate to retailers
      await page.locator('#nav-tab-retailers').click();
      await expect(page).toHaveURL('/retailers');
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
      await expect(page.locator('#nav-tab-retailers')).toHaveAttribute('aria-selected', 'true');
      
      // Navigate to profile
      await page.locator('#nav-tab-profile').click();
      await expect(page).toHaveURL('/profile');
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
      await expect(page.locator('#nav-tab-profile')).toHaveAttribute('aria-selected', 'true');
      
      // Navigate back to dashboard
      await page.locator('#nav-tab-dashboard').click();
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
      await expect(page.locator('#nav-tab-dashboard')).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Accessibility and Keyboard Navigation', () => {
    test('should support keyboard navigation on authenticated pages with navbar', async ({ page }) => {
      // Set up authenticated state
      await page.goto('/dashboard');
      await page.evaluate(() => {
        localStorage.setItem('auth-storage', JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            created_at: new Date().toISOString()
          },
          isInitialized: true
        }));
      });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify navbar is visible
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
      
      // Tab to the first navigation item
      await page.keyboard.press('Tab');
      // Continue tabbing until we reach the navigation
      let attempts = 0;
      while (attempts < 20) {
        const focusedElement = await page.evaluate(() => document.activeElement?.id);
        if (focusedElement?.startsWith('nav-tab-')) {
          break;
        }
        await page.keyboard.press('Tab');
        attempts++;
      }
      
      // Verify we can navigate with arrow keys
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100); // Small delay for focus change
      
      // Press Enter to navigate to the focused tab
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      
      // Verify navigation occurred
      expect(page.url()).toMatch(/\/(dashboard|trips|retailers|profile)/);
    });

    test('should have proper ARIA attributes for navigation', async ({ page }) => {
      // Set up authenticated state
      await page.goto('/dashboard');
      await page.evaluate(() => {
        localStorage.setItem('auth-storage', JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            created_at: new Date().toISOString()
          },
          isInitialized: true
        }));
      });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify navbar has proper ARIA attributes
      const nav = page.locator('nav[aria-label="Main navigation"]');
      await expect(nav).toBeVisible();
      
      // Check each navigation tab has proper ARIA attributes
      const tabs = ['dashboard', 'trips', 'retailers', 'profile'];
      for (const tab of tabs) {
        const tabElement = page.locator(`#nav-tab-${tab}`);
        await expect(tabElement).toHaveAttribute('role', 'tab');
        await expect(tabElement).toHaveAttribute('aria-label');
        await expect(tabElement).toHaveAttribute('aria-selected');
        await expect(tabElement).toHaveAttribute('tabIndex', '0');
      }
    });
  });

  test.describe('Performance and Loading States', () => {
    test('should handle auth initialization gracefully', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Initially, navbar should not be visible while auth is initializing
      // This tests the isInitialized check in ConditionalNav
      const nav = page.locator('nav[aria-label="Main navigation"]');
      
      // Simulate delayed auth initialization
      await page.evaluate(() => {
        // Start with uninitialized state
        localStorage.setItem('auth-storage', JSON.stringify({
          user: null,
          isInitialized: false
        }));
      });
      
      await page.reload();
      
      // Initially navbar should not be visible
      await expect(nav).not.toBeVisible();
      
      // Simulate auth initialization completing with user
      await page.evaluate(() => {
        localStorage.setItem('auth-storage', JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            created_at: new Date().toISOString()
          },
          isInitialized: true
        }));
        // Trigger a re-render
        window.dispatchEvent(new Event('storage'));
      });
      
      // Now navbar should appear
      await expect(nav).toBeVisible({ timeout: 2000 });
    });

    test('should maintain clean UI without navbar on auth pages under slow conditions', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100); // Add 100ms delay to all requests
      });
      
      await page.goto('/auth/login');
      
      // Even with slow loading, navbar should never appear on auth pages
      await expect(page.locator('nav[aria-label="Main navigation"]')).not.toBeVisible();
      
      // Wait for any potential delayed renders
      await page.waitForTimeout(1000);
      
      // Navbar should still not be visible
      await expect(page.locator('nav[aria-label="Main navigation"]')).not.toBeVisible();
    });
  });

  test.describe('Edge Cases and Error Scenarios', () => {
    test('should handle direct navigation to authenticated pages without auth', async ({ page }) => {
      // Clear any existing auth state
      await page.evaluate(() => {
        localStorage.clear();
      });
      
      // Try to navigate directly to dashboard
      await page.goto('/dashboard');
      
      // Should either redirect to auth or show navbar based on auth state
      // Since there's no auth, navbar should not be visible
      await expect(page.locator('nav[aria-label="Main navigation"]')).not.toBeVisible();
    });

    test('should handle auth state changes dynamically', async ({ page }) => {
      // Start authenticated
      await page.goto('/dashboard');
      await page.evaluate(() => {
        localStorage.setItem('auth-storage', JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            created_at: new Date().toISOString()
          },
          isInitialized: true
        }));
      });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Navbar should be visible
      await expect(page.locator('nav[aria-label="Main navigation"]')).toBeVisible();
      
      // Simulate logout by clearing auth state
      await page.evaluate(() => {
        localStorage.setItem('auth-storage', JSON.stringify({
          user: null,
          isInitialized: true
        }));
        // Trigger auth state change
        window.dispatchEvent(new Event('storage'));
      });
      
      // Navbar should disappear
      await expect(page.locator('nav[aria-label="Main navigation"]')).not.toBeVisible({ timeout: 2000 });
    });
  });
});