/**
 * SmartCart Bottom Navigation Mobile-Specific Tests
 * 
 * Comprehensive mobile testing including:
 * - Safe area handling for notched devices
 * - Touch target optimization
 * - One-handed usage scenarios
 * - Orientation changes
 * - Browser UI conflicts
 */

import { test, expect, devices } from '@playwright/test';

test.describe('Bottom Navigation Mobile Experience', () => {
  test.describe('Safe Area and Notch Handling', () => {
    test('should handle iPhone notch and home indicator correctly', async ({ page, context }) => {
      // Use iPhone 12 Pro viewport with notch
      await page.setViewportSize(devices['iPhone 12 Pro'].viewport);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      const nav = page.locator('nav[role="navigation"]');
      
      // Check for safe area classes
      await expect(nav).toHaveClass(/pb-safe-area-inset-bottom/);
      
      // Check for additional safe area padding div
      const safeAreaDiv = nav.locator('div[aria-hidden="true"]').last();
      await expect(safeAreaDiv).toHaveClass(/h-safe-area-inset-bottom/);
      
      // Verify navigation is positioned at bottom
      const navBoundingBox = await nav.boundingBox();
      expect(navBoundingBox).not.toBeNull();
      
      if (navBoundingBox) {
        const viewportHeight = page.viewportSize()?.height || 0;
        // Navigation should be at the very bottom
        expect(navBoundingBox.y + navBoundingBox.height).toBeCloseTo(viewportHeight, 5);
      }
    });

    test('should adapt to different iPhone models', async ({ page }) => {
      const iphoneModels = [
        { name: 'iPhone SE', device: devices['iPhone SE'] },
        { name: 'iPhone 12', device: devices['iPhone 12'] },
        { name: 'iPhone 12 Pro', device: devices['iPhone 12 Pro'] },
        { name: 'iPhone 13 Pro', device: devices['iPhone 13 Pro'] }
      ];
      
      for (const model of iphoneModels) {
        await page.setViewportSize(model.device.viewport);
        await page.goto('/dashboard', { waitUntil: 'networkidle' });
        
        const nav = page.locator('nav[role="navigation"]');
        await expect(nav).toBeVisible();
        
        // All tabs should be visible and properly sized
        const tabs = page.locator('a[role="tab"]');
        const tabCount = await tabs.count();
        expect(tabCount).toBe(4);
        
        for (let i = 0; i < tabCount; i++) {
          const tab = tabs.nth(i);
          await expect(tab).toBeVisible();
          
          // Check touch target size
          const boundingBox = await tab.boundingBox();
          expect(boundingBox).not.toBeNull();
          
          if (boundingBox) {
            expect(boundingBox.width).toBeGreaterThanOrEqual(44);
            expect(boundingBox.height).toBeGreaterThanOrEqual(44);
          }
        }
        
        console.log(`${model.name}: Navigation properly displayed`);
      }
    });

    test('should handle Android device variations', async ({ page }) => {
      const androidDevices = [
        { name: 'Pixel 5', device: devices['Pixel 5'] },
        { name: 'Galaxy S9+', device: devices['Galaxy S9+'] },
        { name: 'Galaxy Note II', device: devices['Galaxy Note II'] }
      ];
      
      for (const androidDevice of androidDevices) {
        await page.setViewportSize(androidDevice.device.viewport);
        await page.goto('/dashboard', { waitUntil: 'networkidle' });
        
        const nav = page.locator('nav[role="navigation"]');
        await expect(nav).toBeVisible();
        
        // Test navigation functionality
        await page.click('a[role="tab"]:has-text("Trips")');
        await page.waitForURL(/\/trips/);
        
        const activeTab = page.locator('a[role="tab"]:has-text("Trips")');
        await expect(activeTab).toHaveAttribute('aria-selected', 'true');
        
        console.log(`${androidDevice.name}: Navigation functional`);
      }
    });
  });

  test.describe('Touch Target Optimization', () => {
    test('should have optimal touch targets for thumb reach', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12 Pro'].viewport);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();
      
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const boundingBox = await tab.boundingBox();
        
        expect(boundingBox).not.toBeNull();
        if (boundingBox) {
          // Our design spec uses 56px for enhanced usability
          expect(boundingBox.width).toBeGreaterThanOrEqual(56);
          expect(boundingBox.height).toBeGreaterThanOrEqual(56);
          
          // Verify touch-target-large class is applied
          await expect(tab).toHaveClass(/touch-target-large/);
          await expect(tab).toHaveClass(/min-h-\[56px\]/);
          await expect(tab).toHaveClass(/min-w-\[56px\]/);
        }
      }
    });

    test('should handle edge touches correctly', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12 Pro'].viewport);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Test touching near the edges of tabs
      const firstTab = page.locator('a[role="tab"]').first();
      const lastTab = page.locator('a[role="tab"]').last();
      
      const firstTabBox = await firstTab.boundingBox();
      const lastTabBox = await lastTab.boundingBox();
      
      expect(firstTabBox).not.toBeNull();
      expect(lastTabBox).not.toBeNull();
      
      if (firstTabBox && lastTabBox) {
        // Touch near left edge of first tab
        await page.tap(`${firstTabBox.x + 5}`, `${firstTabBox.y + firstTabBox.height / 2}`);
        await expect(firstTab).toHaveAttribute('aria-selected', 'true');
        
        // Touch near right edge of last tab
        await page.tap(`${lastTabBox.x + lastTabBox.width - 5}`, `${lastTabBox.y + lastTabBox.height / 2}`);
        await expect(lastTab).toHaveAttribute('aria-selected', 'true');
      }
    });

    test('should provide haptic-like feedback on touch', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12 Pro'].viewport);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      
      // Test active scale feedback
      await expect(tripsTab).toHaveClass(/active:scale-95/);
      await expect(tripsTab).toHaveClass(/active:bg-primary\/20/);
      
      // The active state provides visual feedback similar to haptic feedback
      await tripsTab.tap();
      await page.waitForURL(/\/trips/);
      await expect(tripsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('One-Handed Usage', () => {
    test('should be reachable with thumb on large phones', async ({ page }) => {
      // Test on iPhone 13 Pro Max (largest common phone)
      await page.setViewportSize({ width: 428, height: 926 });
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      const nav = page.locator('nav[role="navigation"]');
      const navBox = await nav.boundingBox();
      
      expect(navBox).not.toBeNull();
      if (navBox) {
        const viewportHeight = 926;
        
        // Navigation should be within thumb reach from bottom
        // Typical thumb reach is about 75% of screen height from bottom
        const thumbReachArea = viewportHeight * 0.25; // Bottom 25% is easily reachable
        const navPosition = viewportHeight - navBox.y;
        
        expect(navPosition).toBeLessThanOrEqual(thumbReachArea + 50); // 50px buffer
      }
    });

    test('should work comfortably in thumb-friendly zone', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12 Pro'].viewport);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Simulate thumb tap areas (bottom-right for right-handed users)
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();
      
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const tabBox = await tab.boundingBox();
        
        expect(tabBox).not.toBeNull();
        if (tabBox) {
          // Tap in bottom-right area of each tab (comfortable for right thumb)
          const tapX = tabBox.x + tabBox.width * 0.75;
          const tapY = tabBox.y + tabBox.height * 0.75;
          
          await page.tap(`${tapX}`, `${tapY}`);
          await expect(tab).toHaveAttribute('aria-selected', 'true');
        }
      }
    });

    test('should handle left-handed usage patterns', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12 Pro'].viewport);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Simulate left thumb tap areas (bottom-left for left-handed users)
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();
      
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const tabBox = await tab.boundingBox();
        
        expect(tabBox).not.toBeNull();
        if (tabBox) {
          // Tap in bottom-left area of each tab (comfortable for left thumb)
          const tapX = tabBox.x + tabBox.width * 0.25;
          const tapY = tabBox.y + tabBox.height * 0.75;
          
          await page.tap(`${tapX}`, `${tapY}`);
          await expect(tab).toHaveAttribute('aria-selected', 'true');
        }
      }
    });
  });

  test.describe('Orientation Changes', () => {
    test('should adapt to landscape orientation', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize(devices['iPhone 12 Pro'].viewport);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Verify portrait layout
      const navPortrait = page.locator('nav[role="navigation"]');
      await expect(navPortrait).toBeVisible();
      
      // Switch to landscape
      await page.setViewportSize({ 
        width: devices['iPhone 12 Pro'].viewport.height, 
        height: devices['iPhone 12 Pro'].viewport.width 
      });
      
      // Wait for layout adjustment
      await page.waitForTimeout(300);
      
      // Navigation should still be visible and functional
      const navLandscape = page.locator('nav[role="navigation"]');
      await expect(navLandscape).toBeVisible();
      
      // Test navigation functionality in landscape
      await page.click('a[role="tab"]:has-text("Trips")');
      await page.waitForURL(/\/trips/);
      
      const activeTab = page.locator('a[role="tab"]:has-text("Trips")');
      await expect(activeTab).toHaveAttribute('aria-selected', 'true');
      
      // All tabs should still be accessible
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();
      expect(tabCount).toBe(4);
      
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        await expect(tab).toBeVisible();
      }
    });

    test('should handle rapid orientation changes', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12 Pro'].viewport);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      const orientations = [
        { width: 390, height: 844 },  // Portrait
        { width: 844, height: 390 },  // Landscape
        { width: 390, height: 844 },  // Portrait again
        { width: 844, height: 390 }   // Landscape again
      ];
      
      for (const orientation of orientations) {
        await page.setViewportSize(orientation);
        await page.waitForTimeout(100); // Brief pause for layout
        
        const nav = page.locator('nav[role="navigation"]');
        await expect(nav).toBeVisible();
        
        // Navigation should remain functional
        const testTab = orientation.width > orientation.height ? 'Retailers' : 'Profile';
        await page.click(`a[role="tab"]:has-text("${testTab}")`);
        
        const activeTab = page.locator(`a[role="tab"]:has-text("${testTab}")`);
        await expect(activeTab).toHaveAttribute('aria-selected', 'true');
      }
    });

    test('should maintain aspect ratios in landscape', async ({ page }) => {
      await page.setViewportSize({ width: 844, height: 390 }); // iPhone landscape
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();
      
      // All tabs should maintain proper proportions
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const tabBox = await tab.boundingBox();
        
        expect(tabBox).not.toBeNull();
        if (tabBox) {
          // Height should remain adequate for touch targets
          expect(tabBox.height).toBeGreaterThanOrEqual(44);
          
          // Width should be reasonable (not too stretched)
          const aspectRatio = tabBox.width / tabBox.height;
          expect(aspectRatio).toBeLessThan(3); // Not more than 3:1 ratio
        }
      }
    });
  });

  test.describe('Browser UI Conflicts', () => {
    test('should not conflict with iOS Safari bottom bar', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12 Pro'].viewport);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Our navigation should be positioned to avoid Safari's bottom bar
      const nav = page.locator('nav[role="navigation"]');
      const navBox = await nav.boundingBox();
      
      expect(navBox).not.toBeNull();
      if (navBox) {
        // Should have proper z-index to appear above browser UI
        const zIndex = await nav.evaluate((el) => window.getComputedStyle(el).zIndex);
        expect(parseInt(zIndex)).toBeGreaterThanOrEqual(50);
        
        // Should use safe-area-inset-bottom for proper spacing
        await expect(nav).toHaveClass(/pb-safe-area-inset-bottom/);
      }
    });

    test('should handle Chrome mobile address bar changes', async ({ page }) => {
      // Chrome mobile hides/shows address bar on scroll
      await page.setViewportSize(devices['Pixel 5'].viewport);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Navigation should remain fixed at bottom
      const nav = page.locator('nav[role="navigation"]');
      await expect(nav).toHaveClass(/fixed/);
      await expect(nav).toHaveClass(/bottom-0/);
      
      // Test that navigation remains accessible during address bar transitions
      // (This would require actual browser testing, but we can verify styling)
      const navStyle = await nav.evaluate((el) => window.getComputedStyle(el));
      expect(navStyle.position).toBe('fixed');
      expect(navStyle.bottom).toBe('0px');
    });

    test('should avoid conflicts with swipe gestures', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12 Pro'].viewport);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Test that horizontal swipes don't interfere with navigation
      const nav = page.locator('nav[role="navigation"]');
      const navBox = await nav.boundingBox();
      
      expect(navBox).not.toBeNull();
      if (navBox) {
        // Swipe horizontally across the navigation area
        await page.mouse.move(navBox.x + 50, navBox.y + navBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(navBox.x + navBox.width - 50, navBox.y + navBox.height / 2);
        await page.mouse.up();
        
        // Navigation should still be visible and functional
        await expect(nav).toBeVisible();
        
        // Should be able to tap tabs after swipe
        await page.click('a[role="tab"]:has-text("Trips")');
        await page.waitForURL(/\/trips/);
        
        const activeTab = page.locator('a[role="tab"]:has-text("Trips")');
        await expect(activeTab).toHaveAttribute('aria-selected', 'true');
      }
    });

    test('should handle edge swipe gestures on iOS', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12 Pro'].viewport);
      await page.goto('/trips', { waitUntil: 'networkidle' });
      
      const nav = page.locator('nav[role="navigation"]');
      
      // Test that edge swipes don't interfere with tab interactions
      // Start swipe from very edge
      await page.mouse.move(0, 400);
      await page.mouse.down();
      await page.mouse.move(50, 400);
      await page.mouse.up();
      
      // Navigation should still work
      await expect(nav).toBeVisible();
      
      await page.click('a[role="tab"]:has-text("Profile")');
      await page.waitForURL(/\/profile/);
      
      const profileTab = page.locator('a[role="tab"]:has-text("Profile")');
      await expect(profileTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Touch Accessibility on Mobile', () => {
    test('should provide adequate touch spacing', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12 Pro'].viewport);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
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
            const spacing = nextBox.x - (currentBox.x + currentBox.width);
            
            // Should have adequate spacing (even if minimal in compact nav)
            expect(spacing).toBeGreaterThanOrEqual(-5); // Allow slight overlap for visual design
          }
        }
      }
    });

    test('should handle fat finger touches gracefully', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12 Pro'].viewport);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Simulate larger touch areas (fat finger effect)
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();
      
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const tabBox = await tab.boundingBox();
        
        expect(tabBox).not.toBeNull();
        if (tabBox) {
          // Touch slightly off-center to simulate imprecise touches
          const offsetX = (Math.random() - 0.5) * 20; // ±10px offset
          const offsetY = (Math.random() - 0.5) * 20; // ±10px offset
          
          const touchX = Math.max(tabBox.x, Math.min(tabBox.x + tabBox.width, tabBox.x + tabBox.width / 2 + offsetX));
          const touchY = Math.max(tabBox.y, Math.min(tabBox.y + tabBox.height, tabBox.y + tabBox.height / 2 + offsetY));
          
          await page.tap(`${touchX}`, `${touchY}`);
          await expect(tab).toHaveAttribute('aria-selected', 'true');
        }
      }
    });

    test('should work with accessibility touch accommodations', async ({ page }) => {
      await page.setViewportSize(devices['iPhone 12 Pro'].viewport);
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Simulate touch accommodations (longer touch times, multiple touches)
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      
      // Longer press duration
      await tripsTab.tap({ timeout: 1000 });
      await page.waitForURL(/\/trips/);
      await expect(tripsTab).toHaveAttribute('aria-selected', 'true');
      
      // Double tap (should still work, not cause issues)
      const profileTab = page.locator('a[role="tab"]:has-text("Profile")');
      await profileTab.tap();
      await page.waitForTimeout(100);
      await profileTab.tap();
      
      await page.waitForURL(/\/profile/);
      await expect(profileTab).toHaveAttribute('aria-selected', 'true');
    });
  });
});