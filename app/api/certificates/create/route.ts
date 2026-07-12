/**
 * POST /api/certificates/create
 *
 * Create a new certificate from automation apps
 *
 * This endpoint:
 * - Validates API key authentication
 * - Validates request payload
 * - Checks company exists and is active
 * - Implements idempotency using idempotency_key
 * - Creates certificate record in database
 * - Returns certificate details with public URL
 *
 * Security:
 * - Requires X-API-Key header
 * - API key must match company_key in payload
 * - No secrets exposed in responses
 * - Safe error messages only
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { extractApiKey, authenticateApiKey, validateCompanyMatch } from '@/lib/auth/certificate-api-auth';
import { validateCreateCertificatePayload } from '@/lib/validation/create-certificate';
import { getCompanyByKey } from '@/lib/database/company-repository';
import { getCertificateByIdempotencyKey, createCertificate } from '@/lib/database/certificate-repository';
import type { CreateCertificateInput } from '@/types/certificate';

/**
 * Certificate API Response
 */
interface CertificateApiResponse {
  success: boolean;
  duplicate?: boolean;
  certificate?: {
    cert_uuid: string;
    company_key: string;
    lead_id: string;
    recording_id: string;
    status: string;
    certificate_url: string;
  };
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Get base URL for certificate URLs
 */
function getBaseUrl(request: NextRequest): string {
  // Use configured app URL if available
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Fallback to request origin for local development
  const origin = request.headers.get('origin') || request.headers.get('host');
  if (origin) {
    return origin.startsWith('http') ? origin : `https://${origin}`;
  }

  return 'http://localhost:3000';
}

/**
 * Safe error logger - logs only safe fields
 */
function logCertificateCreation(data: {
  company_key: string;
  lead_id: string;
  recording_id: string;
  result: 'created' | 'duplicate' | 'error';
  cert_uuid?: string;
  error?: string;
}) {
  console.log('[Certificate API]', {
    company_key: data.company_key,
    lead_id: data.lead_id,
    recording_id: data.recording_id,
    result: data.result,
    cert_uuid: data.cert_uuid,
    error: data.error,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Extract and validate API key
    const apiKey = extractApiKey(request.headers);
    const authResult = authenticateApiKey(apiKey);

    if (!authResult.authenticated) {
      return NextResponse.json<CertificateApiResponse>(
        {
          success: false,
          error: authResult.error || 'Authentication failed',
        },
        { status: 401 }
      );
    }

    const authenticatedCompanyKey = authResult.companyKey!;

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = validateCreateCertificatePayload(body);

    if (!validation.success) {
      return NextResponse.json<CertificateApiResponse>(
        {
          success: false,
          error: 'Invalid request payload',
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const payload = validation.data;

    // 3. Validate company key matches authenticated API key
    if (!validateCompanyMatch(authenticatedCompanyKey, payload.company_key)) {
      logCertificateCreation({
        company_key: payload.company_key,
        lead_id: payload.lead_id,
        recording_id: payload.recording_id,
        result: 'error',
        error: 'Company/API key mismatch',
      });

      return NextResponse.json<CertificateApiResponse>(
        {
          success: false,
          error: 'API key does not match company_key in request',
        },
        { status: 403 }
      );
    }

    // 4. Check if company exists and is active
    const company = await getCompanyByKey(payload.company_key);

    if (!company) {
      logCertificateCreation({
        company_key: payload.company_key,
        lead_id: payload.lead_id,
        recording_id: payload.recording_id,
        result: 'error',
        error: 'Company not found',
      });

      return NextResponse.json<CertificateApiResponse>(
        {
          success: false,
          error: 'Company not found',
        },
        { status: 404 }
      );
    }

    if (!company.is_active) {
      logCertificateCreation({
        company_key: payload.company_key,
        lead_id: payload.lead_id,
        recording_id: payload.recording_id,
        result: 'error',
        error: 'Company inactive',
      });

      return NextResponse.json<CertificateApiResponse>(
        {
          success: false,
          error: 'Company is not active',
        },
        { status: 403 }
      );
    }

    // 5. Check for existing certificate (idempotency)
    const existing = await getCertificateByIdempotencyKey(payload.idempotency_key);

    if (existing) {
      logCertificateCreation({
        company_key: payload.company_key,
        lead_id: payload.lead_id,
        recording_id: payload.recording_id,
        result: 'duplicate',
        cert_uuid: existing.cert_uuid,
      });

      const baseUrl = getBaseUrl(request);

      return NextResponse.json<CertificateApiResponse>(
        {
          success: true,
          duplicate: true,
          certificate: {
            cert_uuid: existing.cert_uuid,
            company_key: payload.company_key,
            lead_id: existing.lead_id,
            recording_id: existing.recording_id || '',
            status: existing.status,
            certificate_url: `${baseUrl}/certificates/${existing.cert_uuid}`,
          },
        },
        { status: 200 }
      );
    }

    // 6. Create new certificate
    const cert_uuid = randomUUID();
    const now = new Date().toISOString();

    const certificateInput: CreateCertificateInput = {
      cert_uuid,
      company_id: company.id,
      source_system: payload.source_system,
      lead_id: payload.lead_id,
      lead_data: payload.lead_data,
      recording_id: payload.recording_id,
      recording_url: payload.recording_url,
      recording_storage_path: payload.recording_storage_path,
      recording_type: payload.recording_type,
      lead_submitted_at: payload.lead_submitted_at,
      video_generated_at: payload.video_generated_at,
      completed_at_utc: now,
      idempotency_key: payload.idempotency_key,
      status: 'generated',
    };

    try {
      const certificate = await createCertificate(certificateInput);

      logCertificateCreation({
        company_key: payload.company_key,
        lead_id: payload.lead_id,
        recording_id: payload.recording_id,
        result: 'created',
        cert_uuid: certificate.cert_uuid,
      });

      const baseUrl = getBaseUrl(request);

      return NextResponse.json<CertificateApiResponse>(
        {
          success: true,
          duplicate: false,
          certificate: {
            cert_uuid: certificate.cert_uuid,
            company_key: payload.company_key,
            lead_id: certificate.lead_id,
            recording_id: certificate.recording_id || '',
            status: certificate.status,
            certificate_url: `${baseUrl}/certificates/${certificate.cert_uuid}`,
          },
        },
        { status: 201 }
      );
    } catch (dbError: unknown) {
      // Handle database unique constraint violation (race condition)
      const error = dbError as { code?: string; message?: string };

      if (error.code === '23505' || error.message?.includes('duplicate')) {
        // Race condition: Another request created the same certificate
        const existingAfterRace = await getCertificateByIdempotencyKey(payload.idempotency_key);

        if (existingAfterRace) {
          logCertificateCreation({
            company_key: payload.company_key,
            lead_id: payload.lead_id,
            recording_id: payload.recording_id,
            result: 'duplicate',
            cert_uuid: existingAfterRace.cert_uuid,
          });

          const baseUrl = getBaseUrl(request);

          return NextResponse.json<CertificateApiResponse>(
            {
              success: true,
              duplicate: true,
              certificate: {
                cert_uuid: existingAfterRace.cert_uuid,
                company_key: payload.company_key,
                lead_id: existingAfterRace.lead_id,
                recording_id: existingAfterRace.recording_id || '',
                status: existingAfterRace.status,
                certificate_url: `${baseUrl}/certificates/${existingAfterRace.cert_uuid}`,
              },
            },
            { status: 200 }
          );
        }

        // Duplicate key but can't find the record (shouldn't happen)
        return NextResponse.json<CertificateApiResponse>(
          {
            success: false,
            error: 'Certificate already exists',
          },
          { status: 409 }
        );
      }

      // Other database error
      throw dbError;
    }
  } catch (error) {
    console.error('[Certificate API] Unexpected error:', error);

    return NextResponse.json<CertificateApiResponse>(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Disable other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
