import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from '../auth'
import { supabase, handleSupabaseError } from '../supabase'

// Mock the supabase module
vi.mock('../supabase')

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z'
      }
      const mockSession = { access_token: 'token123' }

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true
      })

      expect(result.success).toBe(true)
      expect(result.data?.user).toEqual(mockUser)
      expect(result.data?.needsVerification).toBe(false) // Has session
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle registration requiring email verification', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z'
      }

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true
      })

      expect(result.success).toBe(true)
      expect(result.data?.user).toEqual(mockUser)
      expect(result.data?.needsVerification).toBe(true) // No session
    })

    it('should handle registration errors', async () => {
      const mockError = { message: 'Email already exists' }

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      vi.mocked(handleSupabaseError).mockReturnValue('Email already exists')

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already exists')
    })

    it('should handle registration exceptions', async () => {
      vi.mocked(supabase.auth.signUp).mockRejectedValue(new Error('Network error'))

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Registration failed. Please try again.')
    })
  })

  describe('login', () => {
    it('should successfully log in a user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z'
      }
      const mockSession = { access_token: 'token123' }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })

    it('should handle invalid credentials error', async () => {
      const mockError = { message: 'Invalid login credentials' }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
    })

    it('should handle email not confirmed error', async () => {
      const mockError = { message: 'Email not confirmed' }

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Please check your email and click the verification link')
    })

    it('should handle missing user in response', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: null
      })

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Login failed. Please try again.')
    })

    it('should handle login exceptions', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockRejectedValue(new Error('Network error'))

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Login failed. Please try again.')
    })
  })

  describe('logout', () => {
    it('should successfully log out a user', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null
      })

      const result = await authService.logout()

      expect(result.success).toBe(true)
      expect(result.data).toBe(null)
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle logout errors', async () => {
      const mockError = { message: 'Logout failed' }

      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: mockError
      })

      const result = await authService.logout()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Logout failed')
    })

    it('should handle logout exceptions', async () => {
      vi.mocked(supabase.auth.signOut).mockRejectedValue(new Error('Network error'))

      const result = await authService.logout()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Logout failed. Please try again.')
    })
  })

  describe('resetPassword', () => {
    it('should successfully send password reset email', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null
      })

      const result = await authService.resetPassword({
        email: 'test@example.com'
      })

      expect(result.success).toBe(true)
      expect(result.data).toBe(null)
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: 'http://localhost:3000/auth/reset-password' }
      )
    })

    it('should handle password reset errors', async () => {
      const mockError = { message: 'Email not found' }

      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: mockError
      })

      const result = await authService.resetPassword({
        email: 'test@example.com'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email not found')
    })

    it('should handle password reset exceptions', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockRejectedValue(new Error('Network error'))

      const result = await authService.resetPassword({
        email: 'test@example.com'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Password reset failed. Please try again.')
    })
  })

  describe('updatePassword', () => {
    it('should successfully update password', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      })

      const result = await authService.updatePassword('newpassword123')

      expect(result.success).toBe(true)
      expect(result.data).toBe(null)
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123'
      })
    })

    it('should handle password update errors', async () => {
      const mockError = { message: 'Password too weak' }

      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: mockError
      })

      const result = await authService.updatePassword('weak')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Password too weak')
    })

    it('should handle password update exceptions', async () => {
      vi.mocked(supabase.auth.updateUser).mockRejectedValue(new Error('Network error'))

      const result = await authService.updatePassword('newpassword123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Password update failed. Please try again.')
    })
  })

  describe('getSession', () => {
    it('should successfully get current session', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z'
      }
      const mockSession = { user: mockUser }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await authService.getSession()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
      expect(supabase.auth.getSession).toHaveBeenCalled()
    })

    it('should handle no session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      })

      const result = await authService.getSession()

      expect(result.success).toBe(true)
      expect(result.data).toBe(null)
    })

    it('should handle session errors', async () => {
      const mockError = { message: 'Session expired' }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: mockError
      })

      const result = await authService.getSession()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session expired')
    })

    it('should handle session exceptions', async () => {
      vi.mocked(supabase.auth.getSession).mockRejectedValue(new Error('Network error'))

      const result = await authService.getSession()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to get session')
    })
  })

  describe('refreshSession', () => {
    it('should successfully refresh session', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z'
      }
      const mockSession = { user: mockUser }

      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await authService.refreshSession()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUser)
      expect(supabase.auth.refreshSession).toHaveBeenCalled()
    })

    it('should handle refresh session errors', async () => {
      const mockError = { message: 'Refresh token expired' }

      vi.mocked(supabase.auth.refreshSession).mockResolvedValue({
        data: { session: null },
        error: mockError
      })

      const result = await authService.refreshSession()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Refresh token expired')
    })

    it('should handle refresh session exceptions', async () => {
      vi.mocked(supabase.auth.refreshSession).mockRejectedValue(new Error('Network error'))

      const result = await authService.refreshSession()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to refresh session')
    })
  })

  describe('resendVerification', () => {
    it('should successfully resend verification email', async () => {
      vi.mocked(supabase.auth.resend).mockResolvedValue({
        data: {},
        error: null
      })

      const result = await authService.resendVerification('test@example.com')

      expect(result.success).toBe(true)
      expect(result.data).toBe(null)
      expect(supabase.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback'
        }
      })
    })

    it('should handle resend verification errors', async () => {
      const mockError = { message: 'Too many requests' }

      vi.mocked(supabase.auth.resend).mockResolvedValue({
        data: {},
        error: mockError
      })

      const result = await authService.resendVerification('test@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Too many requests')
    })

    it('should handle resend verification exceptions', async () => {
      vi.mocked(supabase.auth.resend).mockRejectedValue(new Error('Network error'))

      const result = await authService.resendVerification('test@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to resend verification email')
    })
  })
})