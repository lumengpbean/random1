import { createClient } from '@supabase/supabase-js'

// Server-only Supabase client with service role key
// This bypasses RLS — only use in API routes, never in client code
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
  }
  return createClient(url, key)
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
const REVIEWER_EMAILS = (process.env.REVIEWER_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

// Admins can access both /admin and /review
export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

// Reviewers can only access /review
export function isReviewerEmail(email: string | undefined): boolean {
  if (!email) return false
  return REVIEWER_EMAILS.includes(email.toLowerCase())
}

// Can access /review (admins + reviewers)
export function canReview(email: string | undefined): boolean {
  return isAdminEmail(email) || isReviewerEmail(email)
}

// Can access /admin (admins only)
export function canAdmin(email: string | undefined): boolean {
  return isAdminEmail(email)
}
