/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { ConditionalNav } from '../conditional-nav'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

// Mock auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

// Mock BottomNav component
vi.mock('../bottom-nav', () => ({
  BottomNav: () => <div data-testid="bottom-nav">Bottom Navigation</div>,
}))

const mockUsePathname = usePathname as ReturnType<typeof vi.fn>
const mockUseAuthStore = useAuthStore as ReturnType<typeof vi.fn>

describe('ConditionalNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when auth is not initialized', () => {
    it('should not render navigation', () => {
      mockUsePathname.mockReturnValue('/dashboard')
      mockUseAuthStore.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        isInitialized: false,
      } as any)

      render(<ConditionalNav />)
      
      expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
    })
  })

  describe('when user is not authenticated', () => {
    it('should not render navigation on any page', () => {
      mockUsePathname.mockReturnValue('/dashboard')
      mockUseAuthStore.mockReturnValue({
        user: null,
        isInitialized: true,
      } as any)

      render(<ConditionalNav />)
      
      expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
    })
  })

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        user: { id: '1', email: 'test@example.com' },
        isInitialized: true,
      } as any)
    })

    it('should render navigation on dashboard page', () => {
      mockUsePathname.mockReturnValue('/dashboard')

      render(<ConditionalNav />)
      
      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
    })

    it('should render navigation on trips page', () => {
      mockUsePathname.mockReturnValue('/trips')

      render(<ConditionalNav />)
      
      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
    })

    it('should render navigation on retailers page', () => {
      mockUsePathname.mockReturnValue('/retailers')

      render(<ConditionalNav />)
      
      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
    })

    it('should render navigation on profile page', () => {
      mockUsePathname.mockReturnValue('/profile')

      render(<ConditionalNav />)
      
      expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
    })

    it('should NOT render navigation on login page', () => {
      mockUsePathname.mockReturnValue('/auth/login')

      render(<ConditionalNav />)
      
      expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
    })

    it('should NOT render navigation on register page', () => {
      mockUsePathname.mockReturnValue('/auth/register')

      render(<ConditionalNav />)
      
      expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
    })

    it('should NOT render navigation on reset password page', () => {
      mockUsePathname.mockReturnValue('/auth/reset-password')

      render(<ConditionalNav />)
      
      expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
    })

    it('should NOT render navigation on auth callback page', () => {
      mockUsePathname.mockReturnValue('/auth/callback')

      render(<ConditionalNav />)
      
      expect(screen.queryByTestId('bottom-nav')).not.toBeInTheDocument()
    })
  })
})