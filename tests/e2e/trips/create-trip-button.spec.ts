import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E Testing Suite for Create Trip Button
 * 
 * Tests mobile design consistency, accessibility, and functionality
 * Validates compliance with WCAG 2.1 AA standards and SmartCart design patterns
 * 
 * Requirements Tested:
 * - Mobile design consistency and responsive behavior
 * - Touch target accessibility (44px minimum)
 * - Visual design quality and icon rendering
 * - Cross-device compatibility
 * - Functionality and keyboard navigation
 * - Integration with page elements and bottom navigation
 */

test.describe('Create Trip Button - Mobile Design & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to trips page for each test
    await page.goto('/trips');
    
    // Wait for page to fully load - look for actual content instead of loading states
    await page.waitForSelector('h1:has-text("Shopping Trips")', { timeout: 15000 });
    
    // Wait for the Create Trip button to be visible
    await page.waitForSelector('button:has-text("Create Trip")', { timeout: 10000 });
    
    // Ensure no loading states are present
    await expect(page.locator('.animate-pulse')).toHaveCount(0);
  });

  test.describe('Mobile Design Consistency', () => {
    test('should display proper proportions on mobile screens', async ({ page }) => {
      // Set mobile viewport (iPhone 12 Pro dimensions)
      await page.setViewportSize({ width: 375, height: 812 });
      
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      // Verify button is visible and properly sized
      await expect(createButton).toBeVisible();
      
      // Check button height matches small size (h-9 = 36px)
      const buttonBox = await createButton.boundingBox();
      expect(buttonBox?.height).toBe(36);
      
      // Verify button is full-width on mobile (w-full sm:w-auto)
      const parentContainer = createButton.locator('..');
      const containerBox = await parentContainer.boundingBox();
      expect(buttonBox?.width).toBe(containerBox?.width);
    });

    test('should be compact on desktop screens', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1024, height: 768 });
      
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      // Button should not be full width on desktop
      const buttonBox = await createButton.boundingBox();
      const parentContainer = createButton.locator('..');
      const containerBox = await parentContainer.boundingBox();
      
      // Button width should be less than container on desktop
      expect(buttonBox?.width).toBeLessThan(containerBox?.width || 0);
    });

    test('should maintain visual hierarchy with page elements', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      
      const createButton = page.locator('button:has-text("Create Trip")').first();
      const pageHeader = page.locator('h1:has-text("Shopping Trips")');
      const breadcrumb = page.locator('nav').first();
      
      // Verify all elements are visible
      await expect(createButton).toBeVisible();
      await expect(pageHeader).toBeVisible();
      await expect(breadcrumb).toBeVisible();
      
      // Check positioning: breadcrumb → header → button (top to bottom)
      const breadcrumbBox = await breadcrumb.boundingBox();
      const headerBox = await pageHeader.boundingBox();
      const buttonBox = await createButton.boundingBox();
      
      expect(breadcrumbBox?.y).toBeLessThan(headerBox?.y || 0);
      expect(headerBox?.y).toBeLessThan(buttonBox?.y || 0);
    });

    test('should follow design system patterns', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      // Verify consistent styling classes
      await expect(createButton).toHaveClass(/bg-primary/);
      await expect(createButton).toHaveClass(/hover:bg-primary\/90/);
      await expect(createButton).toHaveClass(/text-white/);
      await expect(createButton).toHaveClass(/shadow-sm/);
      await expect(createButton).toHaveClass(/focus-ring-primary/);
      
      // Check for proper transitions
      await expect(createButton).toHaveClass(/transition-all/);
      await expect(createButton).toHaveClass(/duration-200/);
    });
  });

  test.describe('Touch Target Accessibility', () => {
    test('should meet 44px minimum touch target requirement', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      
      const createButton = page.locator('button:has-text("Create Trip")').first();
      const buttonBox = await createButton.boundingBox();
      
      // Verify height meets minimum 44px (WCAG 2.1 AA requirement)
      // Button has h-9 (36px) but .touch-target class adds min-height: 44px
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
      
      // Verify width meets minimum 44px (should be much larger due to text)
      expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
    });

    test('should be optimized for one-handed use and thumb reach', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      
      const createButton = page.locator('button:has-text("Create Trip")').first();
      const buttonBox = await createButton.boundingBox();
      
      // Button should be positioned in the top-right area, accessible to thumb
      // It's in the header section, within reasonable reach (not at very top)
      expect(buttonBox?.y).toBeGreaterThan(60); // Below status bar and nav
      expect(buttonBox?.y).toBeLessThan(200); // Within upper thumb reach
    });

    test('should provide proper touch feedback states', async ({ page }) => {
      // Set mobile viewport and enable touch events
      await page.setViewportSize({ width: 375, height: 812 });
      
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      // Test hover state (will be triggered by touch on mobile)
      await createButton.hover();
      
      // Verify hover styles are applied
      const buttonStyles = await createButton.evaluate((el) => {
        return window.getComputedStyle(el);
      });
      
      // Should have hover effects (shadow, background color changes)
      expect(buttonStyles.boxShadow).toBeTruthy();
      
      // Test focus state
      await createButton.focus();
      await expect(createButton).toBeFocused();
      
      // Focus ring should be visible (tested via computed styles)
      const focusedStyles = await createButton.evaluate((el) => {
        return window.getComputedStyle(el);
      });
      expect(focusedStyles.outline).toBeTruthy();
    });

    test('should not conflict with bottom navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Check if bottom navigation exists
      const bottomNav = page.locator('[data-testid="bottom-navigation"], nav:last-of-type');
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      const buttonBox = await createButton.boundingBox();
      
      if (await bottomNav.count() > 0) {
        const navBox = await bottomNav.boundingBox();
        
        // Button should be well above bottom navigation
        expect(buttonBox?.y + (buttonBox?.height || 0)).toBeLessThan(navBox?.y || 0);
        
        // Ensure adequate spacing (at least 16px)
        expect(navBox?.y - (buttonBox?.y + (buttonBox?.height || 0))).toBeGreaterThan(16);
      }
    });
  });

  test.describe('Visual Design Quality', () => {
    test('should render HiPlus icon correctly', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create Trip")').first();
      const plusIcon = createButton.locator('svg').first();
      
      await expect(plusIcon).toBeVisible();
      
      // Verify icon size (w-4 h-4 = 16px)
      const iconBox = await plusIcon.boundingBox();
      expect(iconBox?.width).toBe(16);
      expect(iconBox?.height).toBe(16);
      
      // Verify icon has proper ARIA attributes
      await expect(plusIcon).toHaveAttribute('aria-hidden', 'true');
    });

    test('should display consistent hover and focus states', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      // Test initial state
      await expect(createButton).toHaveCSS('transition-property', 'all');
      
      // Test hover state
      await createButton.hover();
      await page.waitForTimeout(300); // Allow transition to complete
      
      // Test focus state
      await createButton.focus();
      await expect(createButton).toBeFocused();
      
      // Focus should be visible with proper ring
      const focusStyles = await createButton.evaluate((el) => {
        return window.getComputedStyle(el);
      });
      expect(focusStyles.outline).toBeTruthy();
    });

    test('should match primary brand color scheme', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      // Verify background color matches primary
      const styles = await createButton.evaluate((el) => {
        return window.getComputedStyle(el);
      });
      
      // Should use CSS custom property for primary color
      expect(styles.backgroundColor).toBeTruthy();
      expect(styles.color).toBe('rgb(255, 255, 255)'); // White text
    });

    test('should be consistent with other buttons in app', async ({ page }) => {
      // Navigate to a page with multiple buttons to compare
      await page.goto('/dashboard');
      await page.waitForSelector('.min-h-screen', { timeout: 5000 });
      
      await page.goto('/trips');
      await page.waitForSelector('.min-h-screen', { timeout: 5000 });
      
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      // Check if there's an empty state button to compare with
      const emptyStateButton = page.locator('button:has-text("Create your first trip")');
      
      if (await emptyStateButton.count() > 0) {
        // Both buttons should have similar base classes
        const mainButtonClasses = await createButton.getAttribute('class');
        const emptyButtonClasses = await emptyStateButton.getAttribute('class');
        
        // Should share common button classes
        expect(mainButtonClasses).toContain('bg-primary');
        expect(emptyButtonClasses).toContain('bg-primary');
        expect(mainButtonClasses).toContain('text-white');
        expect(emptyButtonClasses).toContain('text-white');
      }
    });
  });

  test.describe('Cross-Device Testing', () => {
    const devices = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12 Pro', width: 390, height: 844 },
      { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
      { name: 'Samsung Galaxy S21', width: 360, height: 800 },
    ];

    devices.forEach(({ name, width, height }) => {
      test(`should display correctly on ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        
        const createButton = page.locator('button:has-text("Create Trip")').first();
        await expect(createButton).toBeVisible();
        
        // Button should be full-width on mobile
        const buttonBox = await createButton.boundingBox();
        expect(buttonBox?.width).toBeGreaterThan(width * 0.8); // At least 80% of screen width
        
        // Should maintain proper height
        expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
      });
    });

    test('should handle orientation changes correctly', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 812 });
      
      const createButton = page.locator('button:has-text("Create Trip")').first();
      await expect(createButton).toBeVisible();
      
      // Switch to landscape
      await page.setViewportSize({ width: 812, height: 375 });
      
      await expect(createButton).toBeVisible();
      
      // Button should adapt to new layout (might become compact in landscape)
      const landscapeBox = await createButton.boundingBox();
      expect(landscapeBox?.height).toBeGreaterThanOrEqual(36);
    });

    test('should maintain layout integrity with existing content', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      
      const createButton = page.locator('button:has-text("Create Trip")').first();
      const headerSection = page.locator('.flex.flex-col.sm\\:flex-row.sm\\:items-center.sm\\:justify-between');
      
      // Verify the header section maintains its flex layout
      await expect(headerSection).toBeVisible();
      
      // Button should be in the right position within the flex container
      const headerBox = await headerSection.boundingBox();
      const buttonBox = await createButton.boundingBox();
      
      // Button should be within the header container
      expect(buttonBox?.y).toBeGreaterThanOrEqual(headerBox?.y || 0);
      expect(buttonBox?.y + (buttonBox?.height || 0)).toBeLessThanOrEqual((headerBox?.y || 0) + (headerBox?.height || 0));
    });
  });

  test.describe('Functionality Validation', () => {
    test('should navigate to create trip page on click', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      // Click the button and verify navigation
      await createButton.click();
      
      // Should navigate to /trips/new
      await page.waitForURL('**/trips/new');
      expect(page.url()).toContain('/trips/new');
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab to the create button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      // Continue tabbing until we reach the create button
      let tabCount = 0;
      while (!(await createButton.isFocused()) && tabCount < 10) {
        await page.keyboard.press('Tab');
        tabCount++;
      }
      
      await expect(createButton).toBeFocused();
      
      // Press Enter to activate
      await page.keyboard.press('Enter');
      
      // Should navigate to create trip page
      await page.waitForURL('**/trips/new');
      expect(page.url()).toContain('/trips/new');
    });

    test('should have proper ARIA labels and accessibility attributes', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      // Verify ARIA label
      await expect(createButton).toHaveAttribute('aria-label', 'Create new shopping trip');
      
      // Verify button type
      await expect(createButton).toHaveAttribute('type', 'button');
      
      // Icon should be hidden from screen readers
      const icon = createButton.locator('svg');
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    test('should not cause TypeScript compilation errors', async ({ page }) => {
      // This test validates that the page loads without console errors
      const consoleErrors: string[] = [];
      
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Reload page to catch any compilation errors
      await page.reload();
      await page.waitForSelector('button:has-text("Create Trip")', { timeout: 5000 });
      
      // Filter out known development warnings
      const relevantErrors = consoleErrors.filter(error => 
        !error.includes('webpack') && 
        !error.includes('HMR') &&
        !error.includes('PWA') &&
        !error.includes('GenerateSW')
      );
      
      expect(relevantErrors).toHaveLength(0);
    });
  });

  test.describe('Integration Testing', () => {
    test('should work correctly with bottom navigation present', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      
      // Check for bottom navigation
      const bottomNav = page.locator('[data-testid="bottom-navigation"]');
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      await expect(createButton).toBeVisible();
      
      // Click should still work if bottom nav is present
      await createButton.click();
      await page.waitForURL('**/trips/new');
      expect(page.url()).toContain('/trips/new');
    });

    test('should not interfere with page scrolling', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 600 }); // Shorter viewport to force scrolling
      
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      // Ensure button is visible initially
      await expect(createButton).toBeVisible();
      
      // Scroll down if there's content
      await page.evaluate(() => window.scrollTo(0, 200));
      
      // Scroll back up
      await page.evaluate(() => window.scrollTo(0, 0));
      
      // Button should still be accessible
      await expect(createButton).toBeVisible();
      await createButton.click();
      await page.waitForURL('**/trips/new');
    });

    test('should work in both empty state and with existing trips', async ({ page }) => {
      // Test with existing trips (if any)
      const createButton = page.locator('button:has-text("Create Trip")').first();
      await expect(createButton).toBeVisible();
      
      // Check if empty state button exists
      const emptyStateButton = page.locator('button:has-text("Create your first trip")');
      
      if (await emptyStateButton.count() > 0) {
        // Test empty state button
        await expect(emptyStateButton).toBeVisible();
        await emptyStateButton.click();
        await page.waitForURL('**/trips/new');
        expect(page.url()).toContain('/trips/new');
        
        // Navigate back
        await page.goBack();
        await page.waitForSelector('.min-h-screen');
      }
      
      // Test main create button
      await createButton.click();
      await page.waitForURL('**/trips/new');
      expect(page.url()).toContain('/trips/new');
    });

    test('should not conflict with other interactive elements', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create Trip")').first();
      const breadcrumbLink = page.locator('button:has-text("Dashboard")');
      
      // Both elements should be interactive
      await expect(createButton).toBeVisible();
      await expect(breadcrumbLink).toBeVisible();
      
      // Test breadcrumb navigation
      await breadcrumbLink.click();
      await page.waitForURL('**/dashboard');
      
      // Navigate back to trips
      await page.goto('/trips');
      await page.waitForSelector('button:has-text("Create Trip")');
      
      // Create button should still work
      await createButton.click();
      await page.waitForURL('**/trips/new');
    });
  });

  test.describe('Accessibility Audit Integration', () => {
    test('should pass axe-core accessibility scan', async ({ page }) => {
      // Wait for page to load completely
      await page.waitForSelector('button:has-text("Create Trip")');
      
      // Inject axe-core for accessibility testing
      await page.addScriptTag({
        url: 'https://unpkg.com/axe-core@4.8.2/axe.min.js'
      });
      
      // Run axe scan
      const axeResults = await page.evaluate(async () => {
        // @ts-ignore
        return await axe.run();
      });
      
      // Check for violations
      expect(axeResults.violations).toHaveLength(0);
    });

    test('should provide proper screen reader support', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      // Verify accessible name is properly set
      const accessibleName = await createButton.getAttribute('aria-label');
      expect(accessibleName).toBe('Create new shopping trip');
      
      // Verify button role is implicit
      const role = await createButton.getAttribute('role');
      expect(role).toBeFalsy(); // Should be null/undefined for implicit button role
      
      // Verify text content is available
      const textContent = await createButton.textContent();
      expect(textContent).toContain('Create Trip');
    });

    test('should maintain focus management', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      // Focus should be manageable
      await createButton.focus();
      await expect(createButton).toBeFocused();
      
      // Tab away and back
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await expect(createButton).toBeFocused();
    });
  });

  test.describe('Performance Validation', () => {
    test('should not impact page load performance', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/trips');
      await page.waitForSelector('button:has-text("Create Trip")');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within reasonable time (under 3 seconds)
      expect(loadTime).toBeLessThan(3000);
    });

    test('should have smooth hover and focus transitions', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create Trip")').first();
      
      // Test transition timing
      const transitionDuration = await createButton.evaluate((el) => {
        return window.getComputedStyle(el).transitionDuration;
      });
      
      // Should have proper transition duration (200ms)
      expect(transitionDuration).toBe('0.2s');
    });
  });
});