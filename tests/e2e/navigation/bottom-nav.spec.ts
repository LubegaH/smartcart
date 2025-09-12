/**
 * SmartCart Bottom Navigation E2E Tests
 * 
 * Comprehensive testing of the bottom navigation component including:
 * - Basic navigation functionality
 * - Keyboard navigation
 * - Touch interactions
 * - Route detection and active states
 * - Cross-browser compatibility
 */

import { test, expect } from '@playwright/test';

test.describe('Bottom Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard to start with bottom nav visible
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Basic Functionality', () => {
    test('should render all navigation tabs', async ({ page }) => {
      // Check that navigation container exists
      const nav = page.locator('nav[role="navigation"][aria-label="Main navigation"]');
      await expect(nav).toBeVisible();

      // Check all expected tabs are present
      const tabs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Trips', href: '/trips' },
        { label: 'Retailers', href: '/retailers' },
        { label: 'Profile', href: '/profile' }
      ];

      for (const tab of tabs) {
        const tabElement = page.locator(`a[role="tab"]:has-text("${tab.label}")`);
        await expect(tabElement).toBeVisible();
        // Check that the tab contains an SVG icon instead of emoji
        await expect(tabElement.locator('svg')).toBeVisible();
        await expect(tabElement).toHaveAttribute('href', tab.href);
      }
    });

    test('should navigate between tabs correctly', async ({ page }) => {
      // Test navigation to each tab
      const navigationTests = [
        { tab: 'Trips', expectedUrl: /\/trips/ },
        { tab: 'Retailers', expectedUrl: /\/retailers/ },
        { tab: 'Profile', expectedUrl: /\/profile/ },
        { tab: 'Dashboard', expectedUrl: /\/dashboard/ }
      ];

      for (const { tab, expectedUrl } of navigationTests) {
        await page.click(`a[role="tab"]:has-text("${tab}")`);
        await page.waitForURL(expectedUrl);
        await expect(page).toHaveURL(expectedUrl);
        
        // Verify active state
        const activeTab = page.locator(`a[role="tab"]:has-text("${tab}")`);
        await expect(activeTab).toHaveAttribute('aria-selected', 'true');
      }
    });

    test('should show correct active state based on current route', async ({ page }) => {
      // Test each route and verify correct active state
      const routeTests = [
        { route: '/trips', activeTab: 'Trips' },
        { route: '/retailers', activeTab: 'Retailers' },
        { route: '/profile', activeTab: 'Profile' },
        { route: '/dashboard', activeTab: 'Dashboard' }
      ];

      for (const { route, activeTab } of routeTests) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        
        const activeTabElement = page.locator(`a[role="tab"]:has-text("${activeTab}")`);
        await expect(activeTabElement).toHaveAttribute('aria-selected', 'true');
        
        // Verify other tabs are not active
        const allTabs = page.locator('a[role="tab"]');
        const tabCount = await allTabs.count();
        
        for (let i = 0; i < tabCount; i++) {
          const tab = allTabs.nth(i);
          const tabText = await tab.textContent();
          
          if (!tabText?.includes(activeTab)) {
            await expect(tab).toHaveAttribute('aria-selected', 'false');
          }
        }
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation with arrow keys', async ({ page }) => {
      const dashboardTab = page.locator('a[role="tab"]:has-text("Dashboard")');
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      const retailersTab = page.locator('a[role="tab"]:has-text("Retailers")');
      const profileTab = page.locator('a[role="tab"]:has-text("Profile")');

      // Start with dashboard focused
      await dashboardTab.focus();
      await expect(dashboardTab).toBeFocused();

      // Navigate right: Dashboard -> Trips
      await page.keyboard.press('ArrowRight');
      await expect(tripsTab).toBeFocused();

      // Navigate right: Trips -> Retailers
      await page.keyboard.press('ArrowRight');
      await expect(retailersTab).toBeFocused();

      // Navigate right: Retailers -> Profile
      await page.keyboard.press('ArrowRight');
      await expect(profileTab).toBeFocused();

      // Navigate right: Profile -> Dashboard (wrap around)
      await page.keyboard.press('ArrowRight');
      await expect(dashboardTab).toBeFocused();

      // Test left navigation: Dashboard -> Profile (wrap around)
      await page.keyboard.press('ArrowLeft');
      await expect(profileTab).toBeFocused();

      // Navigate left: Profile -> Retailers
      await page.keyboard.press('ArrowLeft');
      await expect(retailersTab).toBeFocused();
    });

    test('should support Enter and Space key activation', async ({ page }) => {
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      
      // Focus trips tab
      await tripsTab.focus();
      await expect(tripsTab).toBeFocused();

      // Activate with Enter key
      await page.keyboard.press('Enter');
      await page.waitForURL(/\/trips/);
      await expect(page).toHaveURL(/\/trips/);

      // Navigate to different tab and test Space key
      const profileTab = page.locator('a[role="tab"]:has-text("Profile")');
      await profileTab.focus();
      await page.keyboard.press('Space');
      await page.waitForURL(/\/profile/);
      await expect(page).toHaveURL(/\/profile/);
    });

    test('should have proper tab order', async ({ page }) => {
      // Start from first tab
      const dashboardTab = page.locator('a[role="tab"]:has-text("Dashboard")');
      await dashboardTab.focus();

      // Tab through all navigation items in order
      const expectedOrder = ['Dashboard', 'Trips', 'Retailers', 'Profile'];
      
      for (let i = 0; i < expectedOrder.length; i++) {
        const currentTab = page.locator(`a[role="tab"]:has-text("${expectedOrder[i]}")`);
        await expect(currentTab).toBeFocused();
        
        if (i < expectedOrder.length - 1) {
          await page.keyboard.press('Tab');
        }
      }
    });
  });

  test.describe('Touch and Mobile Interactions', () => {
    test('should handle touch interactions correctly', async ({ page }) => {
      // Simulate touch tap on mobile
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      
      // Tap the trips tab
      await tripsTab.tap();
      await page.waitForURL(/\/trips/);
      await expect(page).toHaveURL(/\/trips/);
      await expect(tripsTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should provide visual feedback on tap (active state)', async ({ page }) => {
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      
      // Check initial state
      await expect(tripsTab).not.toHaveClass(/active:scale-95/);
      
      // The active:scale-95 class should be applied during touch
      // This is tested through CSS class presence
      await expect(tripsTab).toHaveClass(/active:scale-95/);
    });

    test('should have adequate touch target sizes', async ({ page }) => {
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();

      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const boundingBox = await tab.boundingBox();
        
        expect(boundingBox).not.toBeNull();
        if (boundingBox) {
          // Minimum touch target size should be 44px (iOS) or 48px (Android)
          // Our design uses 56px for better usability
          expect(boundingBox.width).toBeGreaterThanOrEqual(56);
          expect(boundingBox.height).toBeGreaterThanOrEqual(56);
        }
      }
    });
  });

  test.describe('Visual States and Animations', () => {
    test('should show focus states correctly', async ({ page }) => {
      const dashboardTab = page.locator('a[role="tab"]:has-text("Dashboard")');
      
      // Focus the tab
      await dashboardTab.focus();
      
      // Check for focus-visible styles
      await expect(dashboardTab).toHaveClass(/focus-visible:outline-none/);
      await expect(dashboardTab).toHaveClass(/focus-visible:ring-2/);
    });

    test('should display active indicators', async ({ page }) => {
      // Dashboard should be active initially
      const dashboardTab = page.locator('a[role="tab"]:has-text("Dashboard")');
      const activeIndicator = dashboardTab.locator('div.absolute.-top-1');
      
      await expect(activeIndicator).toBeVisible();
      await expect(activeIndicator).toHaveClass(/bg-primary/);
      await expect(activeIndicator).toHaveClass(/rounded-full/);

      // Navigate to trips and check indicator moved
      await page.click('a[role="tab"]:has-text("Trips")');
      await page.waitForURL(/\/trips/);
      
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      const tripsIndicator = tripsTab.locator('div.absolute.-top-1');
      
      await expect(tripsIndicator).toBeVisible();
      
      // Dashboard indicator should be gone
      await expect(activeIndicator).not.toBeVisible();
    });

    test('should handle icon scaling on active state', async ({ page }) => {
      // Navigate to trips
      await page.click('a[role="tab"]:has-text("Trips")');
      await page.waitForURL(/\/trips/);
      
      const tripsIcon = page.locator('a[role="tab"]:has-text("Trips") span[aria-hidden="true"]').first();
      
      // Active icon should have scale-110 class
      await expect(tripsIcon).toHaveClass(/scale-110/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA attributes', async ({ page }) => {
      const nav = page.locator('nav[role="navigation"]');
      
      // Navigation should have proper label
      await expect(nav).toHaveAttribute('aria-label', 'Main navigation');
      
      // Check each tab has proper ARIA attributes
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();
      
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        
        await expect(tab).toHaveAttribute('role', 'tab');
        await expect(tab).toHaveAttribute('tabIndex', '0');
        await expect(tab).toHaveAttribute('aria-label');
        await expect(tab).toHaveAttribute('aria-selected');
      }
    });

    test('should have descriptive aria-labels', async ({ page }) => {
      const expectedLabels = [
        'Go to Dashboard - View overview and statistics',
        'Go to Shopping Trips - Manage your shopping lists', 
        'Go to Retailers - View and manage your favorite stores',
        'Go to Profile - Manage your account and settings'
      ];

      for (const label of expectedLabels) {
        const tab = page.locator(`a[aria-label="${label}"]`);
        await expect(tab).toBeVisible();
      }
    });

    test('should hide decorative elements from screen readers', async ({ page }) => {
      // Icons should be hidden from screen readers
      const icons = page.locator('a[role="tab"] span[aria-hidden="true"]');
      const iconCount = await icons.count();
      
      expect(iconCount).toBeGreaterThan(0);
      
      for (let i = 0; i < iconCount; i++) {
        const icon = icons.nth(i);
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
      }

      // Active indicators should be hidden from screen readers
      const indicators = page.locator('div.absolute.-top-1[aria-hidden="true"]');
      const indicatorCount = await indicators.count();
      
      if (indicatorCount > 0) {
        for (let i = 0; i < indicatorCount; i++) {
          const indicator = indicators.nth(i);
          await expect(indicator).toHaveAttribute('aria-hidden', 'true');
        }
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle invalid routes gracefully', async ({ page }) => {
      // Navigate to invalid route
      await page.goto('/nonexistent-route');
      
      // Should still show navigation
      const nav = page.locator('nav[role="navigation"]');
      await expect(nav).toBeVisible();
      
      // Should fall back to dashboard as active (based on implementation)
      const dashboardTab = page.locator('a[role="tab"]:has-text("Dashboard")');
      await expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should handle rapid navigation clicks', async ({ page }) => {
      // Rapidly click between tabs
      const tabs = ['Trips', 'Retailers', 'Profile', 'Dashboard'];
      
      for (let i = 0; i < 3; i++) { // Repeat 3 times
        for (const tab of tabs) {
          await page.click(`a[role="tab"]:has-text("${tab}")`, { force: true });
          // Small delay to prevent overwhelming the system
          await page.waitForTimeout(100);
        }
      }
      
      // Should end up on dashboard and still be functional
      await page.waitForURL(/\/dashboard/);
      const dashboardTab = page.locator('a[role="tab"]:has-text("Dashboard")');
      await expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
      
      // Test that navigation still works
      await page.click('a[role="tab"]:has-text("Trips")');
      await page.waitForURL(/\/trips/);
      await expect(page).toHaveURL(/\/trips/);
    });

    test('should handle page refresh while maintaining correct active state', async ({ page }) => {
      // Navigate to trips page
      await page.click('a[role="tab"]:has-text("Trips")');
      await page.waitForURL(/\/trips/);
      
      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should still show trips as active
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      await expect(tripsTab).toHaveAttribute('aria-selected', 'true');
      
      // Other tabs should not be active
      const dashboardTab = page.locator('a[role="tab"]:has-text("Dashboard")');
      await expect(dashboardTab).toHaveAttribute('aria-selected', 'false');
    });
  });
});