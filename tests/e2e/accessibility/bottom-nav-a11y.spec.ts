/**
 * SmartCart Bottom Navigation Accessibility Tests
 * 
 * Comprehensive WCAG 2.1 AA compliance testing including:
 * - Automated axe-core scanning
 * - Keyboard navigation accessibility
 * - Screen reader compatibility
 * - Color contrast validation
 * - Touch target requirements
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('Bottom Navigation Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Inject axe-core for accessibility testing
    await injectAxe(page);
  });

  test.describe('Automated Accessibility Scanning', () => {
    test('should pass axe-core accessibility checks', async ({ page }) => {
      // Run axe-core scan on the entire page
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
      });
    });

    test('should pass axe-core checks specifically for navigation', async ({ page }) => {
      // Run axe-core scan specifically on the navigation component
      await checkA11y(page, 'nav[role="navigation"]', {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
      });
    });

    test('should pass axe-core checks on all main routes', async ({ page }) => {
      const routes = ['/dashboard', '/trips', '/retailers', '/profile'];
      
      for (const route of routes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        
        // Re-inject axe after navigation
        await injectAxe(page);
        
        await checkA11y(page, 'nav[role="navigation"]', {
          detailedReport: true,
          detailedReportOptions: {
            html: true,
          },
        });
      }
    });
  });

  test.describe('Keyboard Accessibility', () => {
    test('should be fully navigable with keyboard only', async ({ page }) => {
      // Start navigation from top of page
      await page.keyboard.press('Tab');
      
      // Keep tabbing until we reach navigation
      let currentElement = await page.locator(':focus');
      let attempts = 0;
      const maxAttempts = 50;
      
      while (attempts < maxAttempts) {
        const elementRole = await currentElement.getAttribute('role');
        if (elementRole === 'tab') {
          break;
        }
        await page.keyboard.press('Tab');
        currentElement = await page.locator(':focus');
        attempts++;
      }
      
      expect(attempts).toBeLessThan(maxAttempts);
      
      // Should be able to navigate through all tabs
      const tabs = ['Dashboard', 'Trips', 'Retailers', 'Profile'];
      
      for (let i = 0; i < tabs.length; i++) {
        const focusedTab = page.locator(':focus');
        const tabText = await focusedTab.textContent();
        expect(tabText).toContain(tabs[i]);
        
        if (i < tabs.length - 1) {
          await page.keyboard.press('Tab');
        }
      }
    });

    test('should support arrow key navigation within tab group', async ({ page }) => {
      // Focus first tab
      const firstTab = page.locator('a[role="tab"]').first();
      await firstTab.focus();
      
      // Test right arrow navigation
      await page.keyboard.press('ArrowRight');
      const secondTab = page.locator(':focus');
      expect(await secondTab.textContent()).toContain('Trips');
      
      // Test left arrow navigation
      await page.keyboard.press('ArrowLeft');
      const backToFirst = page.locator(':focus');
      expect(await backToFirst.textContent()).toContain('Dashboard');
    });

    test('should have visible focus indicators', async ({ page }) => {
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();
      
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        await tab.focus();
        
        // Check that focus is visible
        const isVisible = await tab.isVisible();
        expect(isVisible).toBe(true);
        
        // Check for focus ring styles
        const classList = await tab.getAttribute('class');
        expect(classList).toContain('focus-visible:ring-2');
        expect(classList).toContain('focus-visible:ring-primary');
      }
    });

    test('should have proper focus trap behavior', async ({ page }) => {
      // Focus the first tab
      const firstTab = page.locator('a[role="tab"]').first();
      await firstTab.focus();
      
      // Navigate to last tab
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      
      const lastTab = page.locator(':focus');
      expect(await lastTab.textContent()).toContain('Profile');
      
      // Press right arrow again - should wrap to first tab
      await page.keyboard.press('ArrowRight');
      const wrappedTab = page.locator(':focus');
      expect(await wrappedTab.textContent()).toContain('Dashboard');
    });
  });

  test.describe('Screen Reader Compatibility', () => {
    test('should have proper semantic structure', async ({ page }) => {
      // Check navigation landmark
      const nav = page.locator('nav[role="navigation"]');
      await expect(nav).toHaveAttribute('aria-label', 'Main navigation');
      
      // Check tab list semantics
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();
      expect(tabCount).toBe(4);
      
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        await expect(tab).toHaveAttribute('role', 'tab');
        await expect(tab).toHaveAttribute('tabIndex', '0');
      }
    });

    test('should provide descriptive labels for each tab', async ({ page }) => {
      const expectedLabels = [
        { tab: 'Dashboard', label: 'Go to Dashboard - View overview and statistics' },
        { tab: 'Trips', label: 'Go to Shopping Trips - Manage your shopping lists' },
        { tab: 'Retailers', label: 'Go to Retailers - View and manage your favorite stores' },
        { tab: 'Profile', label: 'Go to Profile - Manage your account and settings' }
      ];
      
      for (const { tab, label } of expectedLabels) {
        const tabElement = page.locator(`a[role="tab"]:has-text("${tab}")`);
        await expect(tabElement).toHaveAttribute('aria-label', label);
      }
    });

    test('should properly indicate active/selected state', async ({ page }) => {
      // Dashboard should be active initially
      const dashboardTab = page.locator('a[role="tab"]:has-text("Dashboard")');
      await expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
      
      // Other tabs should not be selected
      const otherTabs = page.locator('a[role="tab"]:not(:has-text("Dashboard"))');
      const otherTabCount = await otherTabs.count();
      
      for (let i = 0; i < otherTabCount; i++) {
        const tab = otherTabs.nth(i);
        await expect(tab).toHaveAttribute('aria-selected', 'false');
      }
      
      // Navigate to trips and check state update
      await page.click('a[role="tab"]:has-text("Trips")');
      await page.waitForURL(/\/trips/);
      
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      await expect(tripsTab).toHaveAttribute('aria-selected', 'true');
      await expect(dashboardTab).toHaveAttribute('aria-selected', 'false');
    });

    test('should hide decorative elements from assistive technology', async ({ page }) => {
      // Icons should be hidden from screen readers
      const icons = page.locator('a[role="tab"] span[aria-hidden="true"]');
      const iconCount = await icons.count();
      
      expect(iconCount).toBe(4); // One icon per tab
      
      for (let i = 0; i < iconCount; i++) {
        const icon = icons.nth(i);
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
      }
      
      // Active indicators should be hidden
      await page.click('a[role="tab"]:has-text("Trips")');
      const activeIndicator = page.locator('div.absolute.-top-1[aria-hidden="true"]');
      await expect(activeIndicator).toHaveAttribute('aria-hidden', 'true');
    });

    test('should announce state changes to screen readers', async ({ page }) => {
      // This test ensures the aria-selected attribute changes are properly announced
      // by validating the attributes change when navigating
      
      const tabs = ['Trips', 'Retailers', 'Profile', 'Dashboard'];
      
      for (const tabName of tabs) {
        await page.click(`a[role="tab"]:has-text("${tabName}")`);
        await page.waitForTimeout(100); // Allow for state update
        
        const activeTab = page.locator(`a[role="tab"]:has-text("${tabName}")`);
        await expect(activeTab).toHaveAttribute('aria-selected', 'true');
        
        // Verify other tabs are not selected
        const otherTabs = page.locator(`a[role="tab"]:not(:has-text("${tabName}"))`);
        const otherCount = await otherTabs.count();
        
        for (let i = 0; i < otherCount; i++) {
          const otherTab = otherTabs.nth(i);
          await expect(otherTab).toHaveAttribute('aria-selected', 'false');
        }
      }
    });
  });

  test.describe('Touch and Mobile Accessibility', () => {
    test('should meet minimum touch target size requirements', async ({ page }) => {
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();
      
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const boundingBox = await tab.boundingBox();
        
        expect(boundingBox).not.toBeNull();
        if (boundingBox) {
          // WCAG 2.1 AA requires minimum 44x44px touch targets
          // Our implementation uses 56px for better usability
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
          
          // Verify our enhanced target size
          expect(boundingBox.width).toBeGreaterThanOrEqual(56);
          expect(boundingBox.height).toBeGreaterThanOrEqual(56);
        }
      }
    });

    test('should have adequate spacing between touch targets', async ({ page }) => {
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();
      
      if (tabCount > 1) {
        for (let i = 0; i < tabCount - 1; i++) {
          const currentTab = tabs.nth(i);
          const nextTab = tabs.nth(i + 1);
          
          const currentBox = await currentTab.boundingBox();
          const nextBox = await nextTab.boundingBox();
          
          expect(currentBox).not.toBeNull();
          expect(nextBox).not.toBeNull();
          
          if (currentBox && nextBox) {
            // Calculate horizontal spacing
            const spacing = nextBox.x - (currentBox.x + currentBox.width);
            // Should have some spacing, but tabs can be close in navigation bar
            expect(spacing).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    test('should support gesture navigation alternatives', async ({ page }) => {
      // Test that tap, click, and keyboard all work for the same result
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      
      // Test touch tap
      await tripsTab.tap();
      await page.waitForURL(/\/trips/);
      await expect(page).toHaveURL(/\/trips/);
      
      // Navigate back and test keyboard
      await page.click('a[role="tab"]:has-text("Dashboard")');
      await page.waitForURL(/\/dashboard/);
      
      await tripsTab.focus();
      await page.keyboard.press('Enter');
      await page.waitForURL(/\/trips/);
      await expect(page).toHaveURL(/\/trips/);
    });
  });

  test.describe('Color Contrast and Visual Accessibility', () => {
    test('should meet WCAG color contrast requirements', async ({ page }) => {
      // This test validates that axe-core checks pass, which includes color contrast
      // We'll also do some basic visual validation
      
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();
      
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        
        // Check that text is visible and has contrast
        await expect(tab).toBeVisible();
        
        // Check both active and inactive states
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true');
        await expect(tab).toBeVisible();
        
        // Verify active state styling is applied
        const classList = await tab.getAttribute('class');
        expect(classList).toContain('text-primary');
      }
    });

    test('should be usable without color alone', async ({ page }) => {
      // Active state should be indicated by more than just color
      const dashboardTab = page.locator('a[role="tab"]:has-text("Dashboard")');
      
      // Should have active indicator beyond color
      const activeIndicator = dashboardTab.locator('div.absolute.-top-1');
      await expect(activeIndicator).toBeVisible();
      
      // Should have aria-selected for non-visual indication
      await expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
      
      // Should have text content that doesn't rely on color
      await expect(dashboardTab).toContainText('Dashboard');
    });

    test('should handle high contrast modes', async ({ page }) => {
      // Force high contrast mode simulation
      await page.emulateMedia({ 'prefers-contrast': 'high' });
      
      // Navigation should still be visible and functional
      const nav = page.locator('nav[role="navigation"]');
      await expect(nav).toBeVisible();
      
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();
      
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        await expect(tab).toBeVisible();
        
        // Should still be clickable
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true');
      }
    });
  });

  test.describe('Reduced Motion Accessibility', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ 'prefers-reduced-motion': 'reduce' });
      
      // Navigation should still be functional with reduced motion
      await page.click('a[role="tab"]:has-text("Trips")');
      await page.waitForURL(/\/trips/);
      await expect(page).toHaveURL(/\/trips/);
      
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      await expect(tripsTab).toHaveAttribute('aria-selected', 'true');
      
      // Focus states should still work
      await tripsTab.focus();
      await expect(tripsTab).toBeFocused();
    });

    test('should maintain functionality without animations', async ({ page }) => {
      // Disable animations via CSS
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-delay: -0.01ms !important;
            animation-iteration-count: 1 !important;
            background-attachment: initial !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            transition-delay: -0.01ms !important;
          }
        `
      });
      
      // Navigation should still work without smooth transitions
      await page.click('a[role="tab"]:has-text("Retailers")');
      await page.waitForURL(/\/retailers/);
      await expect(page).toHaveURL(/\/retailers/);
      
      const retailersTab = page.locator('a[role="tab"]:has-text("Retailers")');
      await expect(retailersTab).toHaveAttribute('aria-selected', 'true');
    });
  });
});