/**
 * Supabase Admin Client
 *
 * This client uses the SERVICE ROLE KEY and bypasses Row Level Security (RLS).
 *
 * IMPORTANT SECURITY NOTES:
 * - ONLY use this in server-side code (API routes, Server Components, Server Actions)
 * - NEVER import this in client components
 * - NEVER expose the service role key to the browser
 * - This client has full database access and bypasses all RLS policies
 *
 * Use this for:
 * - Administrative operations
 * - Server-side data fetching
 * - Background jobs
 * - API endpoints that need elevated permissions
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseServiceKey) {
  throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

/**
 * Supabase admin client with service role key
 * Bypasses RLS - use with caution
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
