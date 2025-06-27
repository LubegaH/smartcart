import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema, resetPasswordSchema, passwordSchema } from '../validations'

describe('validations', () => {
  describe('passwordSchema', () => {
    it('should validate valid passwords', () => {
      const validPasswords = [
        'password',
        'Password123',
        'MySecure123',
        'StrongP@ss1',
        'ValidPass456',
        '123456'
      ]

      validPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password)
        expect(result.success).toBe(true)
      })
    })

    it('should reject passwords that are too short', () => {
      const invalidPasswords = [
        '',
        'short',
        '12345'
      ]

      invalidPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password)
        expect(result.success).toBe(false)
      })
    })

    it('should provide helpful error messages for short passwords', () => {
      const result = passwordSchema.safeParse('short')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Password must be at least 6 characters')
      }
    })
  })

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        acceptTerms: true
      }

      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        '',
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid.com',
        'test@',
        'test@.com'
      ]

      invalidEmails.forEach(email => {
        const data = {
          email,
          password: 'Password123',
          confirmPassword: 'Password123',
          acceptTerms: true
        }

        const result = registerSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    it('should reject mismatched passwords', () => {
      const data = {
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'DifferentPassword123',
        acceptTerms: true
      }

      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const confirmPasswordError = result.error.errors.find(
          err => err.path.includes('confirmPassword')
        )
        expect(confirmPasswordError?.message).toBe("Passwords don't match")
      }
    })

    it('should require terms acceptance', () => {
      const data = {
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        acceptTerms: false
      }

      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const termsError = result.error.errors.find(
          err => err.path.includes('acceptTerms')
        )
        expect(termsError?.message).toBe('You must accept the terms of service')
      }
    })

    it('should reject short passwords in registration', () => {
      const data = {
        email: 'test@example.com',
        password: 'short',
        confirmPassword: 'short',
        acceptTerms: true
      }

      const result = registerSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should provide detailed validation errors', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'short',
        confirmPassword: 'different',
        acceptTerms: false
      }

      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(1)
        
        const emailError = result.error.errors.find(err => err.path.includes('email'))
        const passwordError = result.error.errors.find(err => err.path.includes('password'))
        const termsError = result.error.errors.find(err => err.path.includes('acceptTerms'))
        
        expect(emailError).toBeDefined()
        expect(passwordError).toBeDefined()
        expect(termsError).toBeDefined()
      }
    })
  })

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123'
      }

      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require email field', () => {
      const data = {
        email: '',
        password: 'Password123'
      }

      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const emailError = result.error.errors.find(err => err.path.includes('email'))
        expect(emailError?.message).toBe('Email is required')
      }
    })

    it('should require password field', () => {
      const data = {
        email: 'test@example.com',
        password: ''
      }

      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const passwordError = result.error.errors.find(err => err.path.includes('password'))
        expect(passwordError?.message).toBe('Password is required')
      }
    })

    it('should validate email format in login', () => {
      const data = {
        email: 'invalid-email',
        password: 'Password123'
      }

      const result = loginSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const emailError = result.error.errors.find(err => err.path.includes('email'))
        expect(emailError?.message).toBe('Please enter a valid email address')
      }
    })
  })

  describe('resetPasswordSchema', () => {
    it('should validate correct reset password data', () => {
      const validData = {
        email: 'test@example.com'
      }

      const result = resetPasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require email field', () => {
      const data = {
        email: ''
      }

      const result = resetPasswordSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const emailError = result.error.errors.find(err => err.path.includes('email'))
        expect(emailError?.message).toBe('Email is required')
      }
    })

    it('should validate email format in reset', () => {
      const data = {
        email: 'invalid-email'
      }

      const result = resetPasswordSchema.safeParse(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        const emailError = result.error.errors.find(err => err.path.includes('email'))
        expect(emailError?.message).toBe('Please enter a valid email address')
      }
    })

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+label@gmail.com',
        'user123@test-domain.org'
      ]

      validEmails.forEach(email => {
        const result = resetPasswordSchema.safeParse({ email })
        expect(result.success).toBe(true)
      })
    })
  })
})