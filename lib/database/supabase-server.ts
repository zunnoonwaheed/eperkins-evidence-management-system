/**
 * Supabase Server Client
 *
 * This client uses the ANON KEY and respects Row Level Security (RLS).
 *
 * Use this for:
 * - Server Components
 * - Server Actions
 * - API routes that should respect RLS
 *
 * Note: Since we're using RLS to restrict all public access to certificates
 * and companies tables, this client will have limited permissions.
 * Use supabase-admin.ts for actual data operations.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Supabase server client with anon key
 * Respects RLS policies
 */
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
