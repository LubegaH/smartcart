import { supabase, handleSupabaseError } from './supabase'
import type { LoginFormData, RegisterFormData, ResetPasswordFormData } from './validations'
import type { Result } from '@/types'
import type { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  // Use the existing User interface from Supabase
}

// Authentication service functions
export const authService = {
  // Register new user
  async register(data: RegisterFormData): Promise<Result<{ user: AuthUser | null; needsVerification: boolean }>> {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password
      })

      if (error) {
        return { success: false, error: handleSupabaseError(error) }
      }

      return {
        success: true,
        data: {
          user: authData.user as AuthUser,
          needsVerification: !authData.session // No session means email verification required
        }
      }
    } catch (error) {
      return { success: false, error: 'Registration failed. Please try again.' }
    }
  },

  // Login user
  async login(data: LoginFormData): Promise<Result<AuthUser>> {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) {
        // Handle specific auth errors with user-friendly messages
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Invalid email or password' }
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Please check your email and click the verification link' }
        }
        return { success: false, error: handleSupabaseError(error) }
      }

      if (!authData.user) {
        return { success: false, error: 'Login failed. Please try again.' }
      }

      return { success: true, data: authData.user as AuthUser }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' }
    }
  },

  // Logout user
  async logout(): Promise<Result<null>> {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return { success: false, error: handleSupabaseError(error) }
      }

      return { success: true, data: null }
    } catch (error) {
      return { success: false, error: 'Logout failed. Please try again.' }
    }
  },

  // Reset password
  async resetPassword(data: ResetPasswordFormData): Promise<Result<null>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`
      })

      if (error) {
        return { success: false, error: handleSupabaseError(error) }
      }

      return { success: true, data: null }
    } catch (error) {
      return { success: false, error: 'Password reset failed. Please try again.' }
    }
  },

  // Update password (when user has reset token)
  async updatePassword(newPassword: string): Promise<Result<null>> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return { success: false, error: handleSupabaseError(error) }
      }

      return { success: true, data: null }
    } catch (error) {
      return { success: false, error: 'Password update failed. Please try again.' }
    }
  },

  // Get current session
  async getSession(): Promise<Result<AuthUser | null>> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        return { success: false, error: handleSupabaseError(error) }
      }

      return { success: true, data: session?.user as AuthUser || null }
    } catch (error) {
      return { success: false, error: 'Failed to get session' }
    }
  },

  // Refresh session
  async refreshSession(): Promise<Result<AuthUser | null>> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()

      if (error) {
        return { success: false, error: handleSupabaseError(error) }
      }

      return { success: true, data: session?.user as AuthUser || null }
    } catch (error) {
      return { success: false, error: 'Failed to refresh session' }
    }
  },

  // Resend verification email
  async resendVerification(email: string): Promise<Result<null>> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`
        }
      })

      if (error) {
        return { success: false, error: handleSupabaseError(error) }
      }

      return { success: true, data: null }
    } catch (error) {
      return { success: false, error: 'Failed to resend verification email' }
    }
  }
}

// Auth state change listener
export const onAuthStateChange = (callback: (user: AuthUser | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user as AuthUser || null)
  })
}