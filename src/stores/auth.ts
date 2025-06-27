import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { authService, onAuthStateChange, type AuthUser } from '@/lib/auth'
import type { UserProfile } from '@/types'

interface AuthState {
  user: AuthUser | null
  profile: UserProfile | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null
}

interface AuthActions {
  // Core state setters
  setUser: (user: AuthUser | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setInitialized: (initialized: boolean) => void
  
  // Auth actions
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, confirmPassword: string, acceptTerms: boolean) => Promise<{ success: boolean; needsVerification?: boolean }>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<boolean>
  
  // Utilities
  reset: () => void
  clearError: () => void
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  error: null
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Core state setters
        setUser: (user) => {
          set({ user, error: null }, false, 'setUser')
        },
        
        setProfile: (profile) => {
          set({ profile }, false, 'setProfile')
        },
        
        setLoading: (isLoading) => {
          set({ isLoading }, false, 'setLoading')
        },
        
        setError: (error) => {
          set({ error }, false, 'setError')
        },
        
        setInitialized: (isInitialized) => {
          set({ isInitialized, isLoading: !isInitialized }, false, 'setInitialized')
        },
        
        // Initialize auth state on app startup
        initialize: async () => {
          try {
            set({ isLoading: true, error: null }, false, 'initialize:start')
            
            // Get current session
            const sessionResult = await authService.getSession()
            
            if (sessionResult.success) {
              set({ 
                user: sessionResult.data,
                isInitialized: true,
                isLoading: false 
              }, false, 'initialize:success')
              
              // Set up auth state change listener
              onAuthStateChange((user) => {
                set({ user }, false, 'authStateChange')
              })
            } else {
              set({ 
                error: sessionResult.error,
                isInitialized: true,
                isLoading: false 
              }, false, 'initialize:error')
            }
          } catch (error) {
            set({ 
              error: 'Failed to initialize authentication',
              isInitialized: true,
              isLoading: false 
            }, false, 'initialize:catch')
          }
        },
        
        // Login action
        login: async (email, password) => {
          try {
            set({ isLoading: true, error: null }, false, 'login:start')
            
            const result = await authService.login({ email, password })
            
            if (result.success) {
              set({ 
                user: result.data,
                isLoading: false,
                error: null 
              }, false, 'login:success')
              return true
            } else {
              set({ 
                error: result.error,
                isLoading: false 
              }, false, 'login:error')
              return false
            }
          } catch (error) {
            set({ 
              error: 'Login failed. Please try again.',
              isLoading: false 
            }, false, 'login:catch')
            return false
          }
        },
        
        // Register action
        register: async (email, password, confirmPassword, acceptTerms) => {
          try {
            set({ isLoading: true, error: null }, false, 'register:start')
            
            const result = await authService.register({ 
              email, 
              password, 
              confirmPassword, 
              acceptTerms 
            })
            
            if (result.success) {
              if (result.data.needsVerification) {
                set({ 
                  isLoading: false,
                  error: null 
                }, false, 'register:verification-needed')
                return { success: true, needsVerification: true }
              } else {
                set({ 
                  user: result.data.user,
                  isLoading: false,
                  error: null 
                }, false, 'register:success')
                return { success: true, needsVerification: false }
              }
            } else {
              set({ 
                error: result.error,
                isLoading: false 
              }, false, 'register:error')
              return { success: false }
            }
          } catch (error) {
            set({ 
              error: 'Registration failed. Please try again.',
              isLoading: false 
            }, false, 'register:catch')
            return { success: false }
          }
        },
        
        // Logout action
        logout: async () => {
          try {
            set({ isLoading: true, error: null }, false, 'logout:start')
            
            const result = await authService.logout()
            
            if (result.success) {
              set({ 
                user: null,
                profile: null,
                isLoading: false,
                error: null 
              }, false, 'logout:success')
            } else {
              set({ 
                error: result.error,
                isLoading: false 
              }, false, 'logout:error')
            }
          } catch (error) {
            set({ 
              error: 'Logout failed',
              isLoading: false 
            }, false, 'logout:catch')
          }
        },
        
        // Reset password action
        resetPassword: async (email) => {
          try {
            set({ isLoading: true, error: null }, false, 'resetPassword:start')
            
            const result = await authService.resetPassword({ email })
            
            if (result.success) {
              set({ 
                isLoading: false,
                error: null 
              }, false, 'resetPassword:success')
              return true
            } else {
              set({ 
                error: result.error,
                isLoading: false 
              }, false, 'resetPassword:error')
              return false
            }
          } catch (error) {
            set({ 
              error: 'Password reset failed. Please try again.',
              isLoading: false 
            }, false, 'resetPassword:catch')
            return false
          }
        },
        
        // Utilities
        clearError: () => {
          set({ error: null }, false, 'clearError')
        },
        
        reset: () => {
          set({ ...initialState, isInitialized: true }, false, 'reset')
        }
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          profile: state.profile
        })
      }
    ),
    { name: 'auth-store' }
  )
)