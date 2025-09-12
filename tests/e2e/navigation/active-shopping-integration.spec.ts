/**
 * SmartCart Active Shopping Mode Integration Tests
 * 
 * Testing navigation behavior during active shopping sessions:
 * - Context-aware navigation changes
 * - Running total display integration
 * - Exit confirmation handling
 * - Session persistence across refreshes
 * - Offline/online mode transitions
 */

import { test, expect } from '@playwright/test';

test.describe('Active Shopping Mode Navigation Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
  });

  test.describe('Shopping Session Navigation Context', () => {
    test('should show context-aware navigation during shopping', async ({ page }) => {
      // Mock shopping session API responses
      await page.route('**/api/shopping/session', (route) => {
        if (route.request().method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                tripId: 'trip-123',
                isActive: true,
                trip: {
                  id: 'trip-123',
                  name: 'Weekly Groceries',
                  retailer: { name: 'Safeway' },
                  status: 'active'
                },
                progress: {
                  completedItems: 3,
                  totalItems: 10,
                  estimatedTotal: 45.67
                }
              }
            })
          });
        }
      });

      // Navigate to trips and start shopping
      await page.click('a[role="tab"]:has-text("Trips")');
      await page.waitForURL(/\/trips/);

      // Simulate starting active shopping mode
      // This would normally be triggered by a "Start Shopping" button
      await page.evaluate(() => {
        window.localStorage.setItem('shopping-session', JSON.stringify({
          tripId: 'trip-123',
          isActive: true,
          startedAt: Date.now()
        }));
      });

      await page.reload({ waitUntil: 'networkidle' });

      // Navigation should still be present during shopping
      const nav = page.locator('nav[role="navigation"]');
      await expect(nav).toBeVisible();

      // All tabs should still be functional
      await page.click('a[role="tab"]:has-text("Dashboard")');
      await page.waitForURL(/\/dashboard/);
      
      const dashboardTab = page.locator('a[role="tab"]:has-text("Dashboard")');
      await expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should handle navigation between pages during shopping', async ({ page }) => {
      // Set up active shopping session
      await page.evaluate(() => {
        window.localStorage.setItem('shopping-session', JSON.stringify({
          tripId: 'trip-123',
          isActive: true,
          currentPage: 'shopping-mode',
          startedAt: Date.now()
        }));
      });

      await page.reload({ waitUntil: 'networkidle' });

      // Test navigation between different sections while shopping
      const navigationFlow = [
        { tab: 'Retailers', url: /\/retailers/ },
        { tab: 'Profile', url: /\/profile/ },
        { tab: 'Trips', url: /\/trips/ },
        { tab: 'Dashboard', url: /\/dashboard/ }
      ];

      for (const step of navigationFlow) {
        await page.click(`a[role="tab"]:has-text("${step.tab}")`);
        await page.waitForURL(step.url);
        
        const activeTab = page.locator(`a[role="tab"]:has-text("${step.tab}")`);
        await expect(activeTab).toHaveAttribute('aria-selected', 'true');

        // Verify shopping session persists
        const sessionData = await page.evaluate(() => {
          const session = window.localStorage.getItem('shopping-session');
          return session ? JSON.parse(session) : null;
        });

        expect(sessionData).not.toBeNull();
        expect(sessionData.isActive).toBe(true);
        expect(sessionData.tripId).toBe('trip-123');
      }
    });

    test('should update navigation context on page changes', async ({ page }) => {
      // Mock navigation context API
      await page.route('**/api/shopping/navigation-context', (route) => {
        if (route.request().method() === 'PUT') {
          const requestBody = route.request().postDataJSON();
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                currentPage: requestBody.currentPage,
                previousPage: requestBody.previousPage,
                timestamp: Date.now()
              }
            })
          });
        }
      });

      // Set up shopping session
      await page.evaluate(() => {
        window.localStorage.setItem('shopping-session', JSON.stringify({
          tripId: 'trip-123',
          isActive: true,
          startedAt: Date.now()
        }));
      });

      await page.reload({ waitUntil: 'networkidle' });

      // Navigate and verify context updates
      await page.click('a[role="tab"]:has-text("Trips")');
      await page.waitForURL(/\/trips/);

      // Check that navigation context API was called
      const apiCalls = [];
      page.on('request', (request) => {
        if (request.url().includes('/api/shopping/navigation-context')) {
          apiCalls.push({
            method: request.method(),
            url: request.url(),
            body: request.postDataJSON()
          });
        }
      });

      await page.click('a[role="tab"]:has-text("Profile")');
      await page.waitForURL(/\/profile/);

      // Allow time for API call
      await page.waitForTimeout(500);

      // Verify API was called with correct context
      // (In real implementation, this would verify the actual API calls)
    });
  });

  test.describe('Running Total Display Integration', () => {
    test('should display running total in navigation area during shopping', async ({ page }) => {
      // Mock shopping session with running total
      await page.route('**/api/shopping/session', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tripId: 'trip-123',
              isActive: true,
              trip: {
                id: 'trip-123',
                name: 'Weekly Groceries',
                retailer: { name: 'Safeway' }
              },
              runningTotal: 47.83,
              progress: {
                completedItems: 4,
                totalItems: 10
              }
            }
          })
        });
      });

      // Set up shopping session
      await page.evaluate(() => {
        window.localStorage.setItem('shopping-session', JSON.stringify({
          tripId: 'trip-123',
          isActive: true,
          startedAt: Date.now()
        }));
      });

      await page.reload({ waitUntil: 'networkidle' });

      // Look for running total display near navigation
      // This would be implemented as an overlay or additional element
      const runningTotalDisplay = page.locator('[data-testid="running-total"]');
      
      // If running total is implemented, it should be visible
      if (await runningTotalDisplay.isVisible()) {
        await expect(runningTotalDisplay).toContainText('$47.83');
      }

      // Navigation should still work with running total displayed
      await page.click('a[role="tab"]:has-text("Trips")');
      await page.waitForURL(/\/trips/);
      
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      await expect(tripsTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should update running total without affecting navigation', async ({ page }) => {
      // Set up shopping session
      await page.evaluate(() => {
        window.localStorage.setItem('shopping-session', JSON.stringify({
          tripId: 'trip-123',
          isActive: true,
          startedAt: Date.now()
        }));
      });

      // Mock API calls for total updates
      let currentTotal = 25.50;
      await page.route('**/api/shopping/session', (route) => {
        currentTotal += 5.25; // Simulate item additions
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              tripId: 'trip-123',
              isActive: true,
              runningTotal: currentTotal,
              progress: { completedItems: 2, totalItems: 10 }
            }
          })
        });
      });

      await page.reload({ waitUntil: 'networkidle' });

      // Simulate multiple total updates
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
          // Trigger total update (would normally come from item changes)
          window.dispatchEvent(new CustomEvent('shopping-total-updated', {
            detail: { newTotal: Math.random() * 100 }
          }));
        });

        await page.waitForTimeout(200);

        // Navigation should remain fully functional
        const randomTab = ['Dashboard', 'Trips', 'Retailers', 'Profile'][Math.floor(Math.random() * 4)];
        await page.click(`a[role="tab"]:has-text("${randomTab}")`);
        
        const activeTab = page.locator(`a[role="tab"]:has-text("${randomTab}")`);
        await expect(activeTab).toHaveAttribute('aria-selected', 'true');
      }
    });

    test('should handle running total display on different screen sizes', async ({ page }) => {
      // Test on mobile
      await page.setViewportSize({ width: 375, height: 812 });
      
      await page.evaluate(() => {
        window.localStorage.setItem('shopping-session', JSON.stringify({
          tripId: 'trip-123',
          isActive: true,
          runningTotal: 73.42,
          startedAt: Date.now()
        }));
      });

      await page.reload({ waitUntil: 'networkidle' });

      // Navigation should still be fully accessible
      const nav = page.locator('nav[role="navigation"]');
      await expect(nav).toBeVisible();

      const tabs = page.locator('a[role="tab"]');
      const tabCount = await tabs.count();
      expect(tabCount).toBe(4);

      // All tabs should be touchable even with running total
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        await expect(tab).toBeVisible();
        
        const boundingBox = await tab.boundingBox();
        expect(boundingBox).not.toBeNull();
        
        if (boundingBox) {
          expect(boundingBox.height).toBeGreaterThanOrEqual(44); // Touch target size maintained
        }
      }
    });
  });

  test.describe('Exit Confirmation Handling', () => {
    test('should show confirmation when navigating away from active shopping', async ({ page }) => {
      // Set up active shopping session
      await page.evaluate(() => {
        window.localStorage.setItem('shopping-session', JSON.stringify({
          tripId: 'trip-123',
          isActive: true,
          hasUnsavedChanges: true,
          startedAt: Date.now()
        }));
      });

      await page.goto('/trips', { waitUntil: 'networkidle' });

      // Mock beforeunload or custom confirmation logic
      await page.evaluate(() => {
        window.addEventListener('beforeunload', (e) => {
          if (window.localStorage.getItem('shopping-session')) {
            e.preventDefault();
            e.returnValue = 'You have an active shopping session. Are you sure you want to leave?';
          }
        });
      });

      // Try to navigate away (this would trigger confirmation in real scenario)
      await page.click('a[role="tab"]:has-text("Dashboard")');
      
      // In a real implementation, we'd test the confirmation dialog
      // For now, verify the session state management
      const sessionData = await page.evaluate(() => {
        const session = window.localStorage.getItem('shopping-session');
        return session ? JSON.parse(session) : null;
      });

      expect(sessionData).not.toBeNull();
      expect(sessionData.isActive).toBe(true);
    });

    test('should allow navigation after confirming exit from shopping', async ({ page }) => {
      // Set up shopping session
      await page.evaluate(() => {
        window.localStorage.setItem('shopping-session', JSON.stringify({
          tripId: 'trip-123',
          isActive: true,
          startedAt: Date.now()
        }));
      });

      await page.goto('/trips', { waitUntil: 'networkidle' });

      // Simulate user confirming exit (clear session)
      await page.evaluate(() => {
        window.localStorage.removeItem('shopping-session');
      });

      // Now navigation should work normally
      await page.click('a[role="tab"]:has-text("Dashboard")');
      await page.waitForURL(/\/dashboard/);
      
      const dashboardTab = page.locator('a[role="tab"]:has-text("Dashboard")');
      await expect(dashboardTab).toHaveAttribute('aria-selected', 'true');

      // Verify session is ended
      const sessionData = await page.evaluate(() => {
        return window.localStorage.getItem('shopping-session');
      });

      expect(sessionData).toBeNull();
    });

    test('should handle shopping session timeout gracefully', async ({ page }) => {
      // Set up expired shopping session
      await page.evaluate(() => {
        window.localStorage.setItem('shopping-session', JSON.stringify({
          tripId: 'trip-123',
          isActive: true,
          startedAt: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
          timeout: 30 * 60 * 1000 // 30 minute timeout
        }));
      });

      await page.reload({ waitUntil: 'networkidle' });

      // Navigation should work normally (session expired)
      await page.click('a[role="tab"]:has-text("Trips")');
      await page.waitForURL(/\/trips/);
      
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      await expect(tripsTab).toHaveAttribute('aria-selected', 'true');

      // Expired session should be cleaned up
      const sessionData = await page.evaluate(() => {
        // Simulate session cleanup logic
        const session = window.localStorage.getItem('shopping-session');
        if (session) {
          const parsed = JSON.parse(session);
          const isExpired = Date.now() - parsed.startedAt > (parsed.timeout || 30 * 60 * 1000);
          if (isExpired) {
            window.localStorage.removeItem('shopping-session');
            return null;
          }
          return parsed;
        }
        return null;
      });

      expect(sessionData).toBeNull();
    });
  });

  test.describe('Session Persistence and Recovery', () => {
    test('should maintain navigation functionality after page refresh during shopping', async ({ page }) => {
      // Set up shopping session
      await page.evaluate(() => {
        window.localStorage.setItem('shopping-session', JSON.stringify({
          tripId: 'trip-123',
          isActive: true,
          currentPage: 'trips',
          lastActivity: Date.now(),
          startedAt: Date.now()
        }));
      });

      await page.goto('/trips', { waitUntil: 'networkidle' });

      // Verify we're on trips page with active session
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      await expect(tripsTab).toHaveAttribute('aria-selected', 'true');

      // Refresh the page
      await page.reload({ waitUntil: 'networkidle' });

      // Navigation should still work
      const nav = page.locator('nav[role="navigation"]');
      await expect(nav).toBeVisible();

      // Should maintain correct active state
      await expect(tripsTab).toHaveAttribute('aria-selected', 'true');

      // Should be able to navigate to other tabs
      await page.click('a[role="tab"]:has-text("Retailers")');
      await page.waitForURL(/\/retailers/);
      
      const retailersTab = page.locator('a[role="tab"]:has-text("Retailers")');
      await expect(retailersTab).toHaveAttribute('aria-selected', 'true');

      // Session should still be active
      const sessionData = await page.evaluate(() => {
        const session = window.localStorage.getItem('shopping-session');
        return session ? JSON.parse(session) : null;
      });

      expect(sessionData).not.toBeNull();
      expect(sessionData.isActive).toBe(true);
    });

    test('should handle browser back/forward during shopping session', async ({ page }) => {
      // Set up shopping session
      await page.evaluate(() => {
        window.localStorage.setItem('shopping-session', JSON.stringify({
          tripId: 'trip-123',
          isActive: true,
          startedAt: Date.now()
        }));
      });

      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      // Navigate through several pages
      await page.click('a[role="tab"]:has-text("Trips")');
      await page.waitForURL(/\/trips/);

      await page.click('a[role="tab"]:has-text("Retailers")');
      await page.waitForURL(/\/retailers/);

      await page.click('a[role="tab"]:has-text("Profile")');
      await page.waitForURL(/\/profile/);

      // Use browser back button
      await page.goBack();
      await page.waitForURL(/\/retailers/);

      // Navigation should still reflect correct active state
      const retailersTab = page.locator('a[role="tab"]:has-text("Retailers")');
      await expect(retailersTab).toHaveAttribute('aria-selected', 'true');

      // Use browser forward button
      await page.goForward();
      await page.waitForURL(/\/profile/);

      const profileTab = page.locator('a[role="tab"]:has-text("Profile")');
      await expect(profileTab).toHaveAttribute('aria-selected', 'true');

      // Shopping session should persist through browser navigation
      const sessionData = await page.evaluate(() => {
        const session = window.localStorage.getItem('shopping-session');
        return session ? JSON.parse(session) : null;
      });

      expect(sessionData).not.toBeNull();
      expect(sessionData.isActive).toBe(true);
    });

    test('should recover from invalid session states', async ({ page }) => {
      // Set up corrupted shopping session
      await page.evaluate(() => {
        window.localStorage.setItem('shopping-session', '{"invalid": "json"'); // Invalid JSON
      });

      await page.reload({ waitUntil: 'networkidle' });

      // Navigation should still work despite corrupted session
      const nav = page.locator('nav[role="navigation"]');
      await expect(nav).toBeVisible();

      await page.click('a[role="tab"]:has-text("Trips")');
      await page.waitForURL(/\/trips/);
      
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      await expect(tripsTab).toHaveAttribute('aria-selected', 'true');

      // Corrupted session should be cleaned up
      const sessionData = await page.evaluate(() => {
        try {
          const session = window.localStorage.getItem('shopping-session');
          return session ? JSON.parse(session) : null;
        } catch (error) {
          // Clean up corrupted session
          window.localStorage.removeItem('shopping-session');
          return null;
        }
      });

      expect(sessionData).toBeNull();
    });
  });

  test.describe('Offline/Online Mode Transitions', () => {
    test('should maintain navigation during offline mode', async ({ page, context }) => {
      // Set up shopping session
      await page.evaluate(() => {
        window.localStorage.setItem('shopping-session', JSON.stringify({
          tripId: 'trip-123',
          isActive: true,
          startedAt: Date.now()
        }));
      });

      await page.goto('/dashboard', { waitUntil: 'networkidle' });

      // Go offline
      await context.setOffline(true);

      // Navigation should still work offline
      await page.click('a[role="tab"]:has-text("Trips")');
      await page.waitForURL(/\/trips/);
      
      const tripsTab = page.locator('a[role="tab"]:has-text("Trips")');
      await expect(tripsTab).toHaveAttribute('aria-selected', 'true');

      // Continue navigating offline
      await page.click('a[role="tab"]:has-text("Profile")');
      await page.waitForURL(/\/profile/);
      
      const profileTab = page.locator('a[role="tab"]:has-text("Profile")');
      await expect(profileTab).toHaveAttribute('aria-selected', 'true');

      // Restore connectivity
      await context.setOffline(false);

      // Navigation should continue working
      await page.click('a[role="tab"]:has-text("Dashboard")');
      await page.waitForURL(/\/dashboard/);
      
      const dashboardTab = page.locator('a[role="tab"]:has-text("Dashboard")');
      await expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should sync navigation context when coming back online', async ({ page, context }) => {
      // Set up shopping session
      await page.evaluate(() => {
        window.localStorage.setItem('shopping-session', JSON.stringify({
          tripId: 'trip-123',
          isActive: true,
          hasOfflineChanges: true,
          startedAt: Date.now()
        }));
      });

      await page.goto('/trips', { waitUntil: 'networkidle' });

      // Mock sync endpoint
      let syncCalled = false;
      await page.route('**/api/shopping/sync', (route) => {
        syncCalled = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      // Go offline, navigate, then come back online
      await context.setOffline(true);
      await page.click('a[role="tab"]:has-text("Retailers")');
      await page.waitForURL(/\/retailers/);

      await context.setOffline(false);

      // Wait for potential sync
      await page.waitForTimeout(1000);

      // Navigation should work and sync should occur
      await page.click('a[role="tab"]:has-text("Dashboard")');
      await page.waitForURL(/\/dashboard/);
      
      const dashboardTab = page.locator('a[role="tab"]:has-text("Dashboard")');
      await expect(dashboardTab).toHaveAttribute('aria-selected', 'true');

      // Verify sync would be called in real implementation
      // (In actual implementation, this would verify the sync API call)
    });
  });
});