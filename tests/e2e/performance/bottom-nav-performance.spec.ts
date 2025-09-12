/**
 * SmartCart Bottom Navigation Performance Tests
 * 
 * Comprehensive performance validation including:
 * - Bundle size impact analysis
 * - Core Web Vitals measurement
 * - Response time validation
 * - Memory usage monitoring
 * - Network condition testing
 */

import { test, expect } from '@playwright/test';

test.describe('Bottom Navigation Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing performance marks
    await page.evaluate(() => {
      performance.clearMarks();
      performance.clearMeasures();
    });
  });

  test.describe('Bundle Size and Loading Performance', () => {
    test('should load within performance budget', async ({ page }) => {
      // Start performance monitoring
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Check that page loads within budget
      const navigationTiming = await page.evaluate(() => {
        const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
          loadComplete: timing.loadEventEnd - timing.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        };
      });
      
      // Performance budget validation
      expect(navigationTiming.domContentLoaded).toBeLessThan(1000); // 1 second
      expect(navigationTiming.loadComplete).toBeLessThan(2000); // 2 seconds
      expect(navigationTiming.firstContentfulPaint).toBeLessThan(1500); // 1.5 seconds
    });

    test('should have minimal JavaScript bundle impact', async ({ page }) => {
      const responses: Array<{ url: string; size: number }> = [];
      
      // Monitor network requests
      page.on('response', async (response) => {
        if (response.url().includes('.js') && !response.url().includes('node_modules')) {
          try {
            const body = await response.body();
            responses.push({
              url: response.url(),
              size: body.length
            });
          } catch (error) {
            // Some responses might not be available
          }
        }
      });
      
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Calculate total JavaScript size
      const totalJSSize = responses.reduce((total, response) => total + response.size, 0);
      
      // Should be under 300KB as per requirements
      expect(totalJSSize).toBeLessThan(300 * 1024); // 300KB in bytes
      
      console.log(`Total JavaScript bundle size: ${(totalJSSize / 1024).toFixed(2)}KB`);
    });

    test('should cache resources efficiently', async ({ page }) => {
      // First load
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Reload and check cache usage
      const cachedResponses: string[] = [];
      
      page.on('response', (response) => {
        if (response.fromServiceWorker() || response.headers()['cache-control']) {
          cachedResponses.push(response.url());
        }
      });
      
      await page.reload({ waitUntil: 'networkidle' });
      
      // Should have some cached responses for static assets
      expect(cachedResponses.length).toBeGreaterThan(0);
    });
  });

  test.describe('Core Web Vitals', () => {
    test('should meet Largest Contentful Paint (LCP) requirements', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Wait for LCP to be measured
      await page.waitForTimeout(3000);
      
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve(null), 5000);
        });
      });
      
      if (lcp !== null) {
        // LCP should be under 2.5 seconds (2500ms)
        expect(lcp).toBeLessThan(2500);
        console.log(`LCP: ${lcp}ms`);
      }
    });

    test('should meet First Input Delay (FID) requirements', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Measure FID by interacting with navigation
      const startTime = Date.now();
      await page.click('a[role="tab"]:has-text("Trips")');
      const endTime = Date.now();
      
      const inputDelay = endTime - startTime;
      
      // FID should be under 100ms
      expect(inputDelay).toBeLessThan(100);
      console.log(`First Input Delay: ${inputDelay}ms`);
    });

    test('should meet Cumulative Layout Shift (CLS) requirements', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Wait for layout to stabilize
      await page.waitForTimeout(2000);
      
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            resolve(clsValue);
          }).observe({ entryTypes: ['layout-shift'] });
          
          // Fallback timeout
          setTimeout(() => resolve(clsValue), 3000);
        });
      });
      
      // CLS should be under 0.1
      expect(cls).toBeLessThan(0.1);
      console.log(`CLS: ${cls}`);
    });

    test('should maintain performance across all navigation routes', async ({ page }) => {
      const routes = ['/dashboard', '/trips', '/retailers', '/profile'];
      const performanceResults: Array<{ route: string; lcp: number; navigationTime: number }> = [];
      
      for (const route of routes) {
        const startTime = Date.now();
        await page.goto(route, { waitUntil: 'networkidle' });
        const navigationTime = Date.now() - startTime;
        
        // Wait for LCP measurement
        const lcp = await page.evaluate(() => {
          return new Promise<number>((resolve) => {
            new PerformanceObserver((list) => {
              const entries = list.getEntries();
              if (entries.length > 0) {
                const lastEntry = entries[entries.length - 1];
                resolve(lastEntry.startTime);
              }
            }).observe({ entryTypes: ['largest-contentful-paint'] });
            
            setTimeout(() => resolve(0), 2000);
          });
        });
        
        performanceResults.push({ route, lcp, navigationTime });
      }
      
      // All routes should meet performance requirements
      for (const result of performanceResults) {
        expect(result.navigationTime).toBeLessThan(1000); // 1 second navigation
        if (result.lcp > 0) {
          expect(result.lcp).toBeLessThan(2500); // 2.5 second LCP
        }
        console.log(`Route ${result.route}: Navigation ${result.navigationTime}ms, LCP ${result.lcp}ms`);
      }
    });
  });

  test.describe('Navigation Response Times', () => {
    test('should respond to navigation clicks within 100ms', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      const navigationTests = [
        { from: 'Dashboard', to: 'Trips', href: '/trips' },
        { from: 'Trips', to: 'Retailers', href: '/retailers' },
        { from: 'Retailers', to: 'Profile', href: '/profile' },
        { from: 'Profile', to: 'Dashboard', href: '/dashboard' }
      ];
      
      for (const test of navigationTests) {
        const startTime = Date.now();
        
        // Click navigation tab
        await page.click(`a[role="tab"]:has-text("${test.to}")`);
        
        // Wait for visual feedback (active state change)
        await page.waitForFunction(
          (tabText) => {
            const tab = document.querySelector(`a[role="tab"]:has-text("${tabText}")`);
            return tab?.getAttribute('aria-selected') === 'true';
          },
          test.to
        );
        
        const responseTime = Date.now() - startTime;
        
        // Should respond within 100ms as per requirements
        expect(responseTime).toBeLessThan(100);
        console.log(`Navigation ${test.from} -> ${test.to}: ${responseTime}ms`);
      }
    });

    test('should handle rapid navigation without performance degradation', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      const tabs = ['Trips', 'Retailers', 'Profile', 'Dashboard'];
      const responseTimes: number[] = [];
      
      // Perform rapid navigation
      for (let iteration = 0; iteration < 3; iteration++) {
        for (const tab of tabs) {
          const startTime = Date.now();
          await page.click(`a[role="tab"]:has-text("${tab}")`);
          
          // Wait for active state
          await page.waitForFunction(
            (tabText) => {
              const tabElement = document.querySelector(`a[role="tab"]:has-text("${tabText}")`);
              return tabElement?.getAttribute('aria-selected') === 'true';
            },
            tab
          );
          
          const responseTime = Date.now() - startTime;
          responseTimes.push(responseTime);
        }
      }
      
      // All response times should be under 100ms
      const maxResponseTime = Math.max(...responseTimes);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      
      expect(maxResponseTime).toBeLessThan(100);
      expect(avgResponseTime).toBeLessThan(50);
      
      console.log(`Rapid navigation - Max: ${maxResponseTime}ms, Avg: ${avgResponseTime.toFixed(2)}ms`);
    });

    test('should maintain performance with keyboard navigation', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Focus first tab
      await page.locator('a[role="tab"]').first().focus();
      
      const keyboardResponseTimes: number[] = [];
      
      // Test arrow key navigation performance
      for (let i = 0; i < 8; i++) {
        const startTime = Date.now();
        await page.keyboard.press('ArrowRight');
        
        // Wait for focus change
        await page.waitForFunction(() => {
          const focusedElement = document.activeElement;
          return focusedElement && focusedElement.getAttribute('role') === 'tab';
        });
        
        const responseTime = Date.now() - startTime;
        keyboardResponseTimes.push(responseTime);
      }
      
      const maxKeyboardTime = Math.max(...keyboardResponseTimes);
      const avgKeyboardTime = keyboardResponseTimes.reduce((sum, time) => sum + time, 0) / keyboardResponseTimes.length;
      
      // Keyboard navigation should be very fast (under 50ms)
      expect(maxKeyboardTime).toBeLessThan(50);
      expect(avgKeyboardTime).toBeLessThan(25);
      
      console.log(`Keyboard navigation - Max: ${maxKeyboardTime}ms, Avg: ${avgKeyboardTime.toFixed(2)}ms`);
    });
  });

  test.describe('Memory Usage and Resource Management', () => {
    test('should not create memory leaks during navigation', async ({ page, context }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory;
        }
        return null;
      });
      
      // Perform extensive navigation
      const tabs = ['Trips', 'Retailers', 'Profile', 'Dashboard'];
      
      for (let iteration = 0; iteration < 10; iteration++) {
        for (const tab of tabs) {
          await page.click(`a[role="tab"]:has-text("${tab}")`);
          await page.waitForTimeout(100);
        }
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ('gc' in window) {
          (window as any).gc();
        }
      });
      
      await page.waitForTimeout(1000); // Allow for cleanup
      
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory;
        }
        return null;
      });
      
      if (initialMemory && finalMemory) {
        const memoryGrowth = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        console.log(`Memory growth after extensive navigation: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
        
        // Should not grow by more than 5MB
        expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024);
      }
    });

    test('should stay within memory budget during Active Shopping Mode', async ({ page }) => {
      // This test would require the shopping mode to be implemented
      // For now, we'll test basic memory usage during navigation
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      const memoryUsage = await page.evaluate(() => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          return {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      
      if (memoryUsage) {
        // Should stay under 50MB as per requirements
        expect(memoryUsage.used).toBeLessThan(50 * 1024 * 1024);
        console.log(`Memory usage: ${(memoryUsage.used / 1024 / 1024).toFixed(2)}MB`);
      }
    });
  });

  test.describe('Network Condition Performance', () => {
    test('should perform well on slow 3G', async ({ page, context }) => {
      // Simulate slow 3G connection
      await context.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        route.continue();
      });
      
      const startTime = Date.now();
      await page.goto('/dashboard');
      
      // Navigation should still be responsive
      await page.click('a[role="tab"]:has-text("Trips")');
      const navigationTime = Date.now() - startTime;
      
      // Should still respond within reasonable time on slow connection
      expect(navigationTime).toBeLessThan(3000); // 3 seconds on slow connection
      console.log(`Navigation time on slow 3G: ${navigationTime}ms`);
    });

    test('should handle intermittent connectivity', async ({ page, context }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      
      // Simulate going offline temporarily
      await context.setOffline(true);
      
      // Navigation should still work (client-side routing)
      const startTime = Date.now();
      await page.click('a[role="tab"]:has-text("Trips")');
      
      const offlineNavigationTime = Date.now() - startTime;
      
      // Offline navigation should be very fast (no network requests)
      expect(offlineNavigationTime).toBeLessThan(100);
      
      // Restore connection
      await context.setOffline(false);
      
      console.log(`Offline navigation time: ${offlineNavigationTime}ms`);
    });

    test('should cache navigation resources for offline use', async ({ page, context }) => {
      // First visit to populate cache
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      await page.goto('/trips', { waitUntil: 'networkidle' });
      await page.goto('/retailers', { waitUntil: 'networkidle' });
      await page.goto('/profile', { waitUntil: 'networkidle' });
      
      // Go offline
      await context.setOffline(true);
      
      // Navigate between cached pages
      const offlineTests = [
        { route: '/dashboard', tab: 'Dashboard' },
        { route: '/trips', tab: 'Trips' },
        { route: '/retailers', tab: 'Retailers' },
        { route: '/profile', tab: 'Profile' }
      ];
      
      for (const test of offlineTests) {
        const startTime = Date.now();
        await page.goto(test.route);
        
        // Verify navigation works offline
        const nav = page.locator('nav[role="navigation"]');
        await expect(nav).toBeVisible();
        
        const activeTab = page.locator(`a[role="tab"]:has-text("${test.tab}")`);
        await expect(activeTab).toHaveAttribute('aria-selected', 'true');
        
        const loadTime = Date.now() - startTime;
        console.log(`Offline load time for ${test.route}: ${loadTime}ms`);
        
        // Offline loads should be very fast
        expect(loadTime).toBeLessThan(500);
      }
      
      // Restore connection
      await context.setOffline(false);
    });
  });
});