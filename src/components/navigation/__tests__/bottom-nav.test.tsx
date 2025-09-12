/**
 * @vitest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BottomNav, navigationTabs } from '../bottom-nav'

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

const mockUsePathname = usePathname as ReturnType<typeof vi.fn>

describe('BottomNav', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders all navigation tabs with icons', () => {
    render(<BottomNav />)
    
    navigationTabs.forEach(tab => {
      expect(screen.getByRole('tab', { name: tab.ariaLabel })).toBeInTheDocument()
      expect(screen.getByText(tab.label)).toBeInTheDocument()
      // Verify that the tab element contains an SVG (icon component renders as SVG)
      const tabElement = screen.getByRole('tab', { name: tab.ariaLabel })
      expect(tabElement.querySelector('svg')).toBeInTheDocument()
    })
  })

  it('applies active state to current route', () => {
    mockUsePathname.mockReturnValue('/trips')
    render(<BottomNav />)
    
    const tripsTab = screen.getByRole('tab', { name: /Go to Shopping Trips/ })
    expect(tripsTab).toHaveAttribute('aria-selected', 'true')
    
    const dashboardTab = screen.getByRole('tab', { name: /Go to Dashboard/ })
    expect(dashboardTab).toHaveAttribute('aria-selected', 'false')
  })

  it('handles keyboard navigation with arrow keys', () => {
    render(<BottomNav />)
    
    const dashboardTab = screen.getByRole('tab', { name: /Go to Dashboard/ })
    const tripsTab = screen.getByRole('tab', { name: /Go to Shopping Trips/ })
    
    // Focus first tab
    dashboardTab.focus()
    
    // Press right arrow key
    fireEvent.keyDown(dashboardTab, { key: 'ArrowRight' })
    
    // Check that focus moves to next tab (testing focus management)
    expect(document.activeElement).toBe(tripsTab)
  })

  it('handles keyboard navigation with left arrow key', () => {
    render(<BottomNav />)
    
    const tripsTab = screen.getByRole('tab', { name: /Go to Shopping Trips/ })
    const dashboardTab = screen.getByRole('tab', { name: /Go to Dashboard/ })
    
    // Focus second tab
    tripsTab.focus()
    
    // Press left arrow key
    fireEvent.keyDown(tripsTab, { key: 'ArrowLeft' })
    
    // Check that focus moves to previous tab
    expect(document.activeElement).toBe(dashboardTab)
  })

  it('has proper ARIA attributes for accessibility', () => {
    render(<BottomNav />)
    
    // Navigation should have proper role and label
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveAttribute('aria-label', 'Main navigation')
    
    // Each tab should have proper ARIA attributes
    navigationTabs.forEach(tab => {
      const tabElement = screen.getByRole('tab', { name: tab.ariaLabel })
      expect(tabElement).toHaveAttribute('tabIndex', '0')
      expect(tabElement).toHaveAttribute('role', 'tab')
    })
  })

  it('has minimum touch target sizes', () => {
    render(<BottomNav />)
    
    navigationTabs.forEach(tab => {
      const tabElement = screen.getByRole('tab', { name: tab.ariaLabel })
      // Check that touch-target-large class is applied (56px minimum)
      expect(tabElement).toHaveClass('touch-target-large')
    })
  })

  it('supports custom className prop', () => {
    const customClass = 'custom-nav-class'
    render(<BottomNav className={customClass} />)
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass(customClass)
  })

  it('handles Enter key press on tabs', () => {
    render(<BottomNav />)
    
    const dashboardTab = screen.getByRole('tab', { name: /Go to Dashboard/ })
    
    // Should not throw error when Enter is pressed
    expect(() => {
      fireEvent.keyDown(dashboardTab, { key: 'Enter' })
    }).not.toThrow()
  })

  it('handles Space key press on tabs', () => {
    render(<BottomNav />)
    
    const dashboardTab = screen.getByRole('tab', { name: /Go to Dashboard/ })
    
    // Should not throw error when Space is pressed
    expect(() => {
      fireEvent.keyDown(dashboardTab, { key: ' ' })
    }).not.toThrow()
  })
})