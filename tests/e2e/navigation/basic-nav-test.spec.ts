/**
 * SmartCart Basic Navigation Test
 * Simple test to verify navigation component renders and functions
 */

import { test, expect } from '@playwright/test';

test.describe('Basic Navigation Test', () => {
  test('should render navigation component on dashboard page', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Check if navigation exists
    const nav = page.locator('nav[role="navigation"][aria-label="Main navigation"]');
    await expect(nav).toBeVisible();
    
    // Check if all expected tabs are present
    const dashboardTab = page.locator('a[role="tab"]:has-text("Dashboard")');
    const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
    const retailersTab = page.locator('a[role="tab"]:has-text("Retailers")');
    const profileTab = page.locator('a[role="tab"]:has-text("Profile")');
    
    await expect(dashboardTab).toBeVisible();
    await expect(tripsTab).toBeVisible();
    await expect(retailersTab).toBeVisible();
    await expect(profileTab).toBeVisible();
    
    // Dashboard should be active
    await expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should navigate between available pages', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test navigation to profile
    await page.click('a[role="tab"]:has-text("Profile")');
    await expect(page).toHaveURL(/\/profile/);
    
    // Profile tab should be active
    const profileTab = page.locator('a[role="tab"]:has-text("Profile")');
    await expect(profileTab).toHaveAttribute('aria-selected', 'true');
    
    // Navigate back to dashboard
    await page.click('a[role="tab"]:has-text("Dashboard")');
    await expect(page).toHaveURL(/\/dashboard/);
    
    const dashboardTab = page.locator('a[role="tab"]:has-text("Dashboard")');
    await expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should have proper ARIA attributes for accessibility', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check navigation has proper role and label
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    
    // Check tabs have proper attributes
    const tabs = page.locator('a[role="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBe(4);
    
    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      await expect(tab).toHaveAttribute('role', 'tab');
      await expect(tab).toHaveAttribute('tabIndex', '0');
      await expect(tab).toHaveAttribute('aria-label');
      await expect(tab).toHaveAttribute('aria-selected');
    }
  });

  test('should have proper touch target sizes', async ({ page }) => {
    await page.goto('/dashboard');
    
    const tabs = page.locator('a[role="tab"]');
    const tabCount = await tabs.count();
    
    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i);
      const boundingBox = await tab.boundingBox();
      
      expect(boundingBox).not.toBeNull();
      if (boundingBox) {
        // Should meet WCAG touch target requirements (44px minimum)
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});