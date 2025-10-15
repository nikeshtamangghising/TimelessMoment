/**
 * Production-level environment variable validation
 * Ensures all required variables are present before app starts
 */

import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('Invalid database URL'),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('Invalid NextAuth URL'),
  
  // Email
  RESEND_API_KEY: z.string().startsWith('re_', 'Invalid Resend API key format'),
  
  // Optional environment variables
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  
  // Payment gateways (optional in production)
  ESEWA_MERCHANT_ID: z.string().optional(),
  ESEWA_SECRET_KEY: z.string().optional(),
  KHALTI_PUBLIC_KEY: z.string().optional(),
  KHALTI_SECRET_KEY: z.string().optional(),
  
  // URLs
  PAYMENT_SUCCESS_URL: z.string().url().optional(),
  PAYMENT_FAILURE_URL: z.string().url().optional(),
  
  // Admin and cron secrets
  CRON_SECRET: z.string().min(16, 'Cron secret should be at least 16 characters').optional(),
  ADMIN_SECRET: z.string().min(16, 'Admin secret should be at least 16 characters').optional(),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:')
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Critical environment variables are missing or invalid')
      }
    }
    throw error
  }
}

// Export validated environment variables
export const env = validateEnv()

// Helper function to check if in production
export const isProduction = env.NODE_ENV === 'production'

// Helper function to check if in development
export const isDevelopment = env.NODE_ENV === 'development'

// Helper function to get safe environment info for client-side
export function getClientEnv() {
  return {
    NODE_ENV: env.NODE_ENV,
    NEXTAUTH_URL: env.NEXTAUTH_URL,
    // Add other client-safe variables here
  }
}