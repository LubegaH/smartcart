import { test, expect } from '@playwright/test';

/**
 * Basic E2E Test: ConditionalNav Component Behavior
 * 
 * Simple tests to verify navbar visibility behavior on auth vs authenticated pages
 */

test.describe('Basic Navbar Visibility Tests', () => {
  test('login page should not show bottom navbar', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Wait for page load
    await page.waitForLoadState('domcontentloaded');
    
    // Check that navbar is not present
    const navbar = page.locator('nav[aria-label="Main navigation"]');
    await expect(navbar).not.toBeVisible();
  });

  test('register page should not show bottom navbar', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Wait for page load
    await page.waitForLoadState('domcontentloaded');
    
    // Check that navbar is not present
    const navbar = page.locator('nav[aria-label="Main navigation"]');
    await expect(navbar).not.toBeVisible();
  });

  test('reset password page should not show bottom navbar', async ({ page }) => {
    await page.goto('/auth/reset-password');
    
    // Wait for page load
    await page.waitForLoadState('domcontentloaded');
    
    // Check that navbar is not present
    const navbar = page.locator('nav[aria-label="Main navigation"]');
    await expect(navbar).not.toBeVisible();
  });
});