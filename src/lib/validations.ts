import { z } from 'zod'

// Password validation schema
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')

// Authentication form schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
})

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  preferredCurrency: z
    .enum(['USD', 'EUR', 'GBP', 'CAD', 'UGX'])
    .default('USD'),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms of service')
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword']
  }
)

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
})

export const updatePasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match", 
    path: ['confirmPassword']
  }
)

// Shopping session validation schemas
export const navigationContextSchema = z.object({
  currentPage: z.enum(['trip-details', 'shopping-mode', 'add-item', 'edit-item']),
  previousPage: z.string().optional(),
  tripProgress: z.object({
    totalItems: z.number().min(0),
    completedItems: z.number().min(0),
    percentage: z.number().min(0).max(100)
  }),
  lastViewedItemId: z.string().optional(),
  isInShoppingMode: z.boolean(),
  hasUnsavedChanges: z.boolean()
})

export const shoppingSessionSchema = z.object({
  tripId: z.string().uuid(),
  trip: z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    retailer_id: z.string().uuid(),
    name: z.string().min(1),
    date: z.string(),
    status: z.enum(['planned', 'active', 'completed', 'archived']),
    estimated_total: z.number().min(0),
    actual_total: z.number().min(0),
    created_at: z.string(),
    updated_at: z.string(),
    completed_at: z.string().nullable().optional()
  }),
  startTime: z.date(),
  lastActivity: z.date(),
  navigationContext: navigationContextSchema,
  isActive: z.boolean()
})

export const sessionPersistenceOptionsSchema = z.object({
  persistAcrossRefresh: z.boolean().default(true),
  maxIdleTime: z.number().min(1).max(1440).default(60), // 1-1440 minutes (1 day max)
  cleanupInterval: z.number().min(1).max(60).default(5) // 1-60 minutes
})

// Shopping session API validation schemas
export const startSessionRequestSchema = z.object({
  tripId: z.string().uuid('Invalid trip ID format')
})

export const updateNavigationContextRequestSchema = z.object({
  currentPage: z.enum(['trip-details', 'shopping-mode', 'add-item', 'edit-item']).optional(),
  previousPage: z.string().optional(),
  lastViewedItemId: z.string().uuid().optional(),
  isInShoppingMode: z.boolean().optional(),
  hasUnsavedChanges: z.boolean().optional(),
  tripProgress: z.object({
    totalItems: z.number().min(0),
    completedItems: z.number().min(0),
    percentage: z.number().min(0).max(100)
  }).optional()
})

// Type exports for forms
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>

// Type exports for shopping session
export type NavigationContextData = z.infer<typeof navigationContextSchema>
export type ShoppingSessionData = z.infer<typeof shoppingSessionSchema>
export type SessionPersistenceOptionsData = z.infer<typeof sessionPersistenceOptionsSchema>
export type StartSessionRequestData = z.infer<typeof startSessionRequestSchema>
export type UpdateNavigationContextRequestData = z.infer<typeof updateNavigationContextRequestSchema>