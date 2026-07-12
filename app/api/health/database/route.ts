/**
 * Database Health Check Endpoint
 *
 * GET /api/health/database
 *
 * Tests the database connection and returns a simple status.
 *
 * SECURITY:
 * - Does NOT expose credentials
 * - Does NOT expose raw errors
 * - Does NOT expose connection details
 * - Does NOT expose table data
 * - Only returns simple success/failure status
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/database/supabase-admin';

export async function GET() {
  try {
    // Perform a simple query to test database connectivity
    // This queries the companies table which should exist after migration
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('id')
      .limit(1);

    if (error) {
      // Log error server-side but don't expose it
      console.error('Database health check failed:', error.message);

      return NextResponse.json(
        {
          success: false,
          database: 'unavailable',
        },
        { status: 503 }
      );
    }

    // Database is connected and responsive
    return NextResponse.json(
      {
        success: true,
        database: 'connected',
      },
      { status: 200 }
    );
  } catch (error) {
    // Log error server-side but don't expose details
    console.error('Database health check error:', error);

    return NextResponse.json(
      {
        success: false,
        database: 'unavailable',
      },
      { status: 503 }
    );
  }
}
