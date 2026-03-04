/**
 * Supabase client singletons for browser and server environments.
 *
 * Browser client: Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Server client: Uses the same env vars (no service role key needed for localhost).
 *
 * References:
 * - Gap #5 (Launch Data Storage)
 * - tech-decisions.md (Supabase shared instance)
 * - WS-0.1 (project scaffolding -- env var setup)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// Environment Validation
// ============================================================================

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
        'Set it in .env.local to your Supabase project URL.'
    )
  }
  return url
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
        'Set it in .env.local to your Supabase anon key.'
    )
  }
  return key
}

// ============================================================================
// Browser Client (singleton)
// ============================================================================

let browserClient: SupabaseClient | null = null

/**
 * Get the Supabase client for browser-side usage.
 *
 * Returns a singleton instance. Safe to call multiple times.
 * Uses NEXT_PUBLIC_* env vars which are available in the browser bundle.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient

  browserClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      // No Supabase Auth for this localhost tool.
      // The anon key provides direct access per RLS policies.
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return browserClient
}

// ============================================================================
// Server Client (per-request)
// ============================================================================

/**
 * Create a Supabase client for server-side usage (Route Handlers, Server Components).
 *
 * Creates a new instance per call. For Route Handlers, create one per request.
 * Uses the same anon key (no service role key needed for localhost RLS policies).
 */
export function createSupabaseServerClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
