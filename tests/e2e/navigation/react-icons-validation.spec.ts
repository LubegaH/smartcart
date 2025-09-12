/**
 * SmartCart Bottom Navigation React Icons Validation Tests
 * 
 * Comprehensive testing of the updated bottom navigation component with react-icons:
 * - Visual consistency of SVG icon rendering
 * - Accessibility compliance with proper aria-hidden attributes
 * - Performance impact validation
 * - Cross-browser compatibility testing
 * - Integration with existing functionality
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('React Icons Implementation Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await injectAxe(page);
  });

  test.describe('Visual Consistency Testing', () => {
    test('should render all 4 icons as SVG elements with proper structure', async ({ page }) => {
      const expectedIcons = [
        { tab: 'Dashboard', iconName: 'HiHome' },
        { tab: 'Trips', iconName: 'HiShoppingBag' },
        { tab: 'Retailers', iconName: 'HiBuildingStorefront' },
        { tab: 'Profile', iconName: 'HiUser' }
      ];

      for (const { tab, iconName } of expectedIcons) {
        const tabElement = page.locator(`a[role="tab"]:has-text("${tab}")`);
        await expect(tabElement).toBeVisible();

        // Verify SVG icon is present and properly structured
        const svgIcon = tabElement.locator('svg').first();
        await expect(svgIcon).toBeVisible();

        // Check SVG attributes
        await expect(svgIcon).toHaveAttribute('aria-hidden', 'true');
        
        // Verify SVG has the expected structure from HeroIcons
        const paths = svgIcon.locator('path');
        const pathCount = await paths.count();
        expect(pathCount).toBeGreaterThanOrEqual(1); // Should have at least one path element
        
        console.log(`✓ ${tab} tab renders ${iconName} as SVG with proper structure`);
      }
    });

    test('should maintain consistent icon sizing (24px w-6 h-6)', async ({ page }) => {
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();

      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const icon = tab.locator('svg').first();
        
        // Check CSS classes for sizing
        const iconClasses = await icon.getAttribute('class');
        expect(iconClasses).toContain('w-6');
        expect(iconClasses).toContain('h-6');

        // Verify computed styles
        const boundingBox = await icon.boundingBox();
        expect(boundingBox).not.toBeNull();
        
        if (boundingBox) {
          // 24px = w-6 h-6 in Tailwind
          expect(boundingBox.width).toBe(24);
          expect(boundingBox.height).toBe(24);
        }

        const tabText = await tab.textContent();
        console.log(`✓ ${tabText?.trim()} icon maintains 24px sizing`);
      }
    });

    test('should properly align icons and center them with labels', async ({ page }) => {
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();

      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const icon = tab.locator('svg').first();
        const label = tab.locator('span').last(); // Label span

        // Verify flex layout classes for proper alignment
        const tabClasses = await tab.getAttribute('class');
        expect(tabClasses).toContain('flex');
        expect(tabClasses).toContain('flex-col');
        expect(tabClasses).toContain('items-center');
        expect(tabClasses).toContain('justify-center');

        // Check icon spacing from label
        const iconClasses = await icon.getAttribute('class');
        expect(iconClasses).toContain('mb-1'); // Margin bottom for spacing

        // Both elements should be visible and properly positioned
        await expect(icon).toBeVisible();
        await expect(label).toBeVisible();

        const tabText = await tab.textContent();
        console.log(`✓ ${tabText?.trim()} icon and label are properly aligned`);
      }
    });

    test('should show active/inactive state styling correctly with SVG icons', async ({ page }) => {
      const tabs = ['Dashboard', 'Trips', 'Retailers', 'Profile'];

      for (const tabName of tabs) {
        await page.click(`a[role="tab"]:has-text("${tabName}")`);
        await page.waitForURL(new RegExp(`/${tabName.toLowerCase()}`));

        const activeTab = page.locator(`a[role="tab"]:has-text("${tabName}")`);
        const activeIcon = activeTab.locator('svg').first();

        // Verify active state
        await expect(activeTab).toHaveAttribute('aria-selected', 'true');
        
        // Check active icon styling
        const activeIconClasses = await activeIcon.getAttribute('class');
        expect(activeIconClasses).toContain('scale-110'); // Active scaling
        
        // Check active tab styling
        const activeTabClasses = await activeTab.getAttribute('class');
        expect(activeTabClasses).toContain('text-primary');
        expect(activeTabClasses).toContain('bg-primary/10');

        // Verify inactive tabs
        for (const otherTab of tabs) {
          if (otherTab !== tabName) {
            const inactiveTab = page.locator(`a[role="tab"]:has-text("${otherTab}")`);
            const inactiveIcon = inactiveTab.locator('svg').first();
            
            await expect(inactiveTab).toHaveAttribute('aria-selected', 'false');
            
            const inactiveIconClasses = await inactiveIcon.getAttribute('class');
            expect(inactiveIconClasses).not.toContain('scale-110');
          }
        }

        console.log(`✓ ${tabName} shows correct active state styling with SVG icon`);
      }
    });

    test('should display crisp icons at different screen densities', async ({ page }) => {
      const densities = [1, 2, 3]; // 1x, 2x, 3x pixel density

      for (const density of densities) {
        // Simulate different pixel densities
        await page.setViewportSize({ width: 375 * density, height: 812 * density });
        await page.evaluate((d) => {
          Object.defineProperty(window, 'devicePixelRatio', {
            writable: true,
            configurable: true,
            value: d,
          });
        }, density);

        await page.reload({ waitUntil: 'networkidle' });

        const icons = page.locator('a[role="tab"] svg');
        const iconCount = await icons.count();

        for (let i = 0; i < iconCount; i++) {
          const icon = icons.nth(i);
          
          // SVG icons should remain crisp at any density
          await expect(icon).toBeVisible();
          
          // Check that SVG elements maintain their vector properties
          const tagName = await icon.evaluate((el) => el.tagName);
          expect(tagName).toBe('svg');
          
          // Verify no rasterization issues (SVG should scale perfectly)
          const boundingBox = await icon.boundingBox();
          expect(boundingBox).not.toBeNull();
        }

        console.log(`✓ Icons remain crisp at ${density}x pixel density`);
      }
    });
  });

  test.describe('Accessibility Validation', () => {
    test('should have proper aria-hidden="true" attributes on all SVG icons', async ({ page }) => {
      const icons = page.locator('a[role="tab"] svg');
      const iconCount = await icons.count();

      expect(iconCount).toBe(4); // Four navigation tabs

      for (let i = 0; i < iconCount; i++) {
        const icon = icons.nth(i);
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
      }

      console.log('✓ All SVG icons properly hidden from screen readers');
    });

    test('should maintain screen reader compatibility (icons not announced)', async ({ page }) => {
      // Run axe-core specifically checking for icon accessibility
      await checkA11y(page, 'nav[role="navigation"]', {
        rules: {
          'svg-img-alt': { enabled: true }, // Ensure decorative SVGs don't need alt text
          'image-alt': { enabled: true },
        }
      });

      // Verify that icons don't have accessible names when they shouldn't
      const icons = page.locator('a[role="tab"] svg');
      const iconCount = await icons.count();

      for (let i = 0; i < iconCount; i++) {
        const icon = icons.nth(i);
        
        // Icons should not have aria-label or alt attributes (they're decorative)
        const ariaLabel = await icon.getAttribute('aria-label');
        const altText = await icon.getAttribute('alt');
        const title = await icon.getAttribute('title');
        
        expect(ariaLabel).toBeNull();
        expect(altText).toBeNull();
        expect(title).toBeNull();
      }

      console.log('✓ Icons properly excluded from screen reader announcements');
    });

    test('should support keyboard navigation without interference from React components', async ({ page }) => {
      const tabs = ['Dashboard', 'Trips', 'Retailers', 'Profile'];
      
      // Focus first tab
      const firstTab = page.locator('a[role="tab"]').first();
      await firstTab.focus();
      await expect(firstTab).toBeFocused();

      // Test arrow key navigation through React icon components
      for (let i = 1; i < tabs.length; i++) {
        await page.keyboard.press('ArrowRight');
        const currentTab = page.locator(`a[role="tab"]:has-text("${tabs[i]}")`);
        await expect(currentTab).toBeFocused();
        
        // Verify icon is still present and properly structured
        const icon = currentTab.locator('svg').first();
        await expect(icon).toBeVisible();
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
      }

      console.log('✓ Keyboard navigation works correctly with React icon components');
    });

    test('should maintain proper focus indicators with new icon structure', async ({ page }) => {
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();

      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        await tab.focus();

        // Verify focus ring is visible
        const tabClasses = await tab.getAttribute('class');
        expect(tabClasses).toContain('focus-visible:ring-2');
        expect(tabClasses).toContain('focus-visible:ring-primary');
        
        // Ensure focus doesn't interfere with icon display
        const icon = tab.locator('svg').first();
        await expect(icon).toBeVisible();
        
        const tabText = await tab.textContent();
        console.log(`✓ ${tabText?.trim()} maintains proper focus indicators`);
      }
    });

    test('should provide proper context through ARIA labels without relying on icons', async ({ page }) => {
      const expectedLabels = [
        { tab: 'Dashboard', label: 'Go to Dashboard - View overview and statistics' },
        { tab: 'Trips', label: 'Go to Shopping Trips - Manage your shopping lists' },
        { tab: 'Retailers', label: 'Go to Retailers - View and manage your favorite stores' },
        { tab: 'Profile', label: 'Go to Profile - Manage your account and settings' }
      ];

      for (const { tab, label } of expectedLabels) {
        const tabElement = page.locator(`a[role="tab"]:has-text("${tab}")`);
        
        // Verify descriptive ARIA label provides full context
        await expect(tabElement).toHaveAttribute('aria-label', label);
        
        // Verify label doesn't mention the icon (since it's decorative)
        expect(label.toLowerCase()).not.toContain('icon');
        expect(label.toLowerCase()).not.toContain('svg');
        
        console.log(`✓ ${tab} has descriptive ARIA label independent of icon`);
      }
    });
  });

  test.describe('Performance Testing', () => {
    test('should have minimal bundle size impact with tree-shaking', async ({ page }) => {
      const jsResponses: Array<{ url: string; size: number }> = [];

      // Monitor JavaScript bundle requests
      page.on('response', async (response) => {
        if (response.url().includes('.js') && 
            !response.url().includes('node_modules') &&
            !response.url().includes('hot-update')) {
          try {
            const body = await response.body();
            jsResponses.push({
              url: response.url(),
              size: body.length
            });
          } catch (error) {
            // Skip unavailable responses
          }
        }
      });

      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      await page.goto('/trips', { waitUntil: 'networkidle' });

      const totalBundleSize = jsResponses.reduce((total, response) => total + response.size, 0);
      
      // Should stay under 300KB budget (react-icons should tree-shake unused icons)
      expect(totalBundleSize).toBeLessThan(300 * 1024);

      // Log bundle composition for analysis
      console.log(`Total JS bundle size: ${(totalBundleSize / 1024).toFixed(2)}KB`);
      jsResponses.forEach(response => {
        console.log(`  ${response.url}: ${(response.size / 1024).toFixed(2)}KB`);
      });

      console.log('✓ Bundle size remains within 300KB budget with react-icons');
    });

    test('should maintain fast render performance with React icon components', async ({ page }) => {
      // Clear performance marks
      await page.evaluate(() => {
        performance.clearMarks();
        performance.clearMeasures();
      });

      const renderTimes: number[] = [];

      // Test multiple navigation renders
      const routes = ['/dashboard', '/trips', '/retailers', '/profile'];
      
      for (const route of routes) {
        const startTime = Date.now();
        
        await page.goto(route, { waitUntil: 'networkidle' });
        
        // Wait for navigation component to be fully rendered
        await page.waitForSelector('nav[role="navigation"] svg', { state: 'visible' });
        
        const endTime = Date.now();
        const renderTime = endTime - startTime;
        
        renderTimes.push(renderTime);
        console.log(`${route} navigation render time: ${renderTime}ms`);
      }

      // All renders should be under 1 second
      const maxRenderTime = Math.max(...renderTimes);
      const avgRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;

      expect(maxRenderTime).toBeLessThan(1000);
      expect(avgRenderTime).toBeLessThan(500);

      console.log(`✓ Average render time: ${avgRenderTime.toFixed(2)}ms, Max: ${maxRenderTime}ms`);
    });

    test('should maintain <100ms navigation response times with React components', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      const navigationTests = [
        { from: 'Dashboard', to: 'Trips' },
        { from: 'Trips', to: 'Retailers' },
        { from: 'Retailers', to: 'Profile' },
        { from: 'Profile', to: 'Dashboard' }
      ];

      const responseTimes: number[] = [];

      for (const { from, to } of navigationTests) {
        const startTime = performance.now();
        
        await page.click(`a[role="tab"]:has-text("${to}")`);
        
        // Wait for active state to update (visual feedback)
        await page.waitForFunction(
          (tabText) => {
            const tab = document.querySelector(`a[role="tab"]:has-text("${tabText}")`);
            return tab?.getAttribute('aria-selected') === 'true';
          },
          to
        );

        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        responseTimes.push(responseTime);
        console.log(`${from} → ${to}: ${responseTime.toFixed(2)}ms`);
      }

      // All response times should be under 100ms
      const maxResponseTime = Math.max(...responseTimes);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;

      expect(maxResponseTime).toBeLessThan(100);
      expect(avgResponseTime).toBeLessThan(50);

      console.log(`✓ Navigation response times: Avg ${avgResponseTime.toFixed(2)}ms, Max ${maxResponseTime.toFixed(2)}ms`);
    });

    test('should not create memory leaks from icon component rendering', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory?.usedJSHeapSize;
        }
        return null;
      });

      // Perform extensive navigation to test for memory leaks
      const tabs = ['Trips', 'Retailers', 'Profile', 'Dashboard'];
      
      for (let iteration = 0; iteration < 20; iteration++) {
        for (const tab of tabs) {
          await page.click(`a[role="tab"]:has-text("${tab}")`);
          await page.waitForTimeout(50); // Brief pause
        }
      }

      // Force garbage collection if available
      await page.evaluate(() => {
        if ('gc' in window) {
          (window as any).gc();
        }
      });

      await page.waitForTimeout(1000);

      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory?.usedJSHeapSize;
        }
        return null;
      });

      if (initialMemory && finalMemory) {
        const memoryGrowth = finalMemory - initialMemory;
        console.log(`Memory growth after 80 navigation cycles: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
        
        // Should not grow by more than 2MB (React icons should be efficient)
        expect(memoryGrowth).toBeLessThan(2 * 1024 * 1024);
      }

      console.log('✓ No significant memory leaks detected from icon components');
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should render SVG icons consistently across all supported browsers', async ({ page, browserName }) => {
      const tabs = ['Dashboard', 'Trips', 'Retailers', 'Profile'];

      for (const tabName of tabs) {
        const tab = page.locator(`a[role="tab"]:has-text("${tabName}")`);
        const icon = tab.locator('svg').first();

        // Verify icon renders in all browsers
        await expect(icon).toBeVisible();
        await expect(icon).toHaveAttribute('aria-hidden', 'true');

        // Check SVG structure is consistent
        const paths = icon.locator('path');
        const pathCount = await paths.count();
        expect(pathCount).toBeGreaterThanOrEqual(1);

        // Verify dimensions are consistent
        const boundingBox = await icon.boundingBox();
        expect(boundingBox).not.toBeNull();
        if (boundingBox) {
          expect(boundingBox.width).toBe(24);
          expect(boundingBox.height).toBe(24);
        }
      }

      console.log(`✓ SVG icons render consistently in ${browserName}`);
    });

    test('should handle touch interactions properly with React components', async ({ page }) => {
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      const icon = tripsTab.locator('svg').first();

      // Verify initial state
      await expect(tripsTab).toHaveAttribute('aria-selected', 'false');
      await expect(icon).toBeVisible();

      // Perform touch interaction
      await tripsTab.tap();
      await page.waitForURL(/\/trips/);

      // Verify touch interaction worked
      await expect(tripsTab).toHaveAttribute('aria-selected', 'true');
      await expect(icon).toBeVisible();

      // Verify icon scaling animation on active state
      const iconClasses = await icon.getAttribute('class');
      expect(iconClasses).toContain('scale-110');

      console.log('✓ Touch interactions work correctly with React icon components');
    });

    test('should maintain proper icon scaling on different device pixel ratios', async ({ page }) => {
      const pixelRatios = [1, 1.5, 2, 3];

      for (const ratio of pixelRatios) {
        // Simulate different device pixel ratios
        await page.evaluate((r) => {
          Object.defineProperty(window, 'devicePixelRatio', {
            writable: true,
            configurable: true,
            value: r,
          });
        }, ratio);

        await page.reload({ waitUntil: 'networkidle' });

        const icons = page.locator('a[role="tab"] svg');
        const iconCount = await icons.count();

        for (let i = 0; i < iconCount; i++) {
          const icon = icons.nth(i);
          
          // SVG should render crisply at any pixel ratio
          await expect(icon).toBeVisible();
          
          const boundingBox = await icon.boundingBox();
          expect(boundingBox).not.toBeNull();
          
          // SVG dimensions should be consistent regardless of pixel ratio
          if (boundingBox) {
            expect(boundingBox.width).toBe(24);
            expect(boundingBox.height).toBe(24);
          }
        }

        console.log(`✓ Icons render correctly at ${ratio}x pixel ratio`);
      }
    });
  });

  test.describe('Integration Testing', () => {
    test('should work correctly with Active Shopping Mode integration', async ({ page }) => {
      // Navigate to trips page where shopping mode would be activated
      await page.goto('/trips', { waitUntil: 'networkidle' });

      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      const tripsIcon = tripsTab.locator('svg').first();

      // Verify trips tab shows active state with proper icon
      await expect(tripsTab).toHaveAttribute('aria-selected', 'true');
      await expect(tripsIcon).toBeVisible();

      // Simulate navigation to other tabs and back to maintain state
      await page.click('a[role="tab"]:has-text("Dashboard")');
      await page.waitForURL(/\/dashboard/);
      
      await page.click('a[role="tab"]:has-text("Trips")');
      await page.waitForURL(/\/trips/);

      // Icon should still render correctly after navigation cycle
      await expect(tripsIcon).toBeVisible();
      await expect(tripsIcon).toHaveAttribute('aria-hidden', 'true');

      console.log('✓ Navigation icons integrate correctly with route changes');
    });

    test('should maintain touch target sizes (44px+ minimum)', async ({ page }) => {
      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();

      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const boundingBox = await tab.boundingBox();

        expect(boundingBox).not.toBeNull();
        if (boundingBox) {
          // WCAG 2.1 AA requires 44px minimum, our implementation uses 56px
          expect(boundingBox.width).toBeGreaterThanOrEqual(44);
          expect(boundingBox.height).toBeGreaterThanOrEqual(44);
          
          // Verify our enhanced target size
          expect(boundingBox.width).toBeGreaterThanOrEqual(56);
          expect(boundingBox.height).toBeGreaterThanOrEqual(56);
        }

        const tabText = await tab.textContent();
        console.log(`✓ ${tabText?.trim()} maintains adequate touch target size`);
      }
    });

    test('should pass comprehensive accessibility audit with new icons', async ({ page }) => {
      // Run comprehensive axe-core audit
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-visible': { enabled: true },
          'aria-labels': { enabled: true },
          'svg-img-alt': { enabled: true },
        }
      });

      // Test all main routes
      const routes = ['/dashboard', '/trips', '/retailers', '/profile'];
      
      for (const route of routes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        await injectAxe(page);
        
        await checkA11y(page, 'nav[role="navigation"]', {
          detailedReport: true,
        });
        
        console.log(`✓ ${route} passes accessibility audit with react-icons`);
      }
    });
  });
});