/**
 * Certificate Repository
 *
 * Server-side only functions for certificate database operations.
 * Uses supabase-admin client with service role key to bypass RLS.
 *
 * SECURITY: Never import this in client components.
 */

import { supabaseAdmin } from './supabase-admin';
import type { Certificate, CreateCertificateInput, UpdateCertificateInput, CertificateDisplay } from '@/types/certificate';
import type { CertificateStatus } from '@/types/certificate';

/**
 * Transform database certificate to display format for UI compatibility
 */
function transformToDisplay(cert: Certificate): CertificateDisplay {
  const leadData = cert.lead_data || {};

  // Generate history events from timestamps
  const historyEvents = [];

  if (cert.completed_at_utc || cert.video_generated_at || cert.created_at) {
    const completedDate = new Date(cert.completed_at_utc || cert.video_generated_at || cert.created_at);
    historyEvents.push({
      date: completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: completedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' UTC',
      title: 'Certificate Created',
      description: 'Certificate automatically generated and locked. Verification hash computed and stored immutably.',
    });
  }

  if (cert.lead_submitted_at) {
    const submittedDate = new Date(cert.lead_submitted_at);
    historyEvents.push({
      date: submittedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: submittedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' UTC',
      title: 'Consent Recorded',
      description: 'User consent captured via form submission. IP address logged, session replay initiated.',
    });
  }

  // Sort history events by date descending (newest first)
  historyEvents.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());

  return {
    ...cert,
    certificateId: cert.cert_uuid,
    fullName: (leadData.fullName as string) || `${leadData.firstName || ''} ${leadData.lastName || ''}`.trim() || 'Unknown',
    firstName: (leadData.firstName as string) || '',
    lastName: (leadData.lastName as string) || '',
    email: (leadData.email as string) || '',
    phone: (leadData.phone as string) || '',
    taxDebtAmount: (leadData.taxDebtAmount as string) || '',
    dateOfVisit: (leadData.dateOfVisit as string) || '',
    timeOfVisit: (leadData.timeOfVisit as string) || '',
    duration: (leadData.duration as string) || '',
    signedDate: (leadData.signedDate as string) || '',
    signedDateISO: (leadData.signedDateISO as string) || cert.lead_submitted_at || cert.created_at,
    ipAddress: (leadData.ipAddress as string) || '',
    consentVersion: (leadData.consentVersion as string) || '',
    videoFile: cert.recording_url,
    videoFormat: (leadData.videoFormat as string) || cert.recording_type,
    historyEvents,
  };
}

/**
 * Get all certificates
 * Optionally filter by status
 */
export async function getAllCertificates(
  status?: CertificateStatus
): Promise<CertificateDisplay[]> {
  try {
    let query = supabaseAdmin
      .from('certificates')
      .select('*, company:companies(*)')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching certificates:', error);
      throw new Error('Failed to fetch certificates');
    }

    return (data || []).map(transformToDisplay);
  } catch (error) {
    console.error('getAllCertificates error:', error);
    throw error;
  }
}

/**
 * Get certificate by cert_uuid (public-facing UUID)
 */
export async function getCertificateByUuid(
  certUuid: string
): Promise<CertificateDisplay | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select('*, company:companies(*)')
      .eq('cert_uuid', certUuid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching certificate by UUID:', error);
      throw new Error('Failed to fetch certificate');
    }

    return data ? transformToDisplay(data) : null;
  } catch (error) {
    console.error('getCertificateByUuid error:', error);
    return null;
  }
}

/**
 * Get certificate by internal ID
 */
export async function getCertificateById(
  id: string
): Promise<Certificate | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select('*, company:companies(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching certificate by ID:', error);
      throw new Error('Failed to fetch certificate');
    }

    return data || null;
  } catch (error) {
    console.error('getCertificateById error:', error);
    return null;
  }
}

/**
 * Get certificate by idempotency key
 */
export async function getCertificateByIdempotencyKey(
  idempotencyKey: string
): Promise<Certificate | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select('*, company:companies(*)')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching certificate by idempotency key:', error);
      throw new Error('Failed to fetch certificate');
    }

    return data || null;
  } catch (error) {
    console.error('getCertificateByIdempotencyKey error:', error);
    return null;
  }
}

/**
 * Create a new certificate
 */
export async function createCertificate(
  input: CreateCertificateInput
): Promise<Certificate> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .insert([input])
      .select('*, company:companies(*)')
      .single();

    if (error) {
      console.error('Error creating certificate:', error);
      throw new Error('Failed to create certificate');
    }

    return data;
  } catch (error) {
    console.error('createCertificate error:', error);
    throw error;
  }
}

/**
 * Update an existing certificate
 */
export async function updateCertificate(
  id: string,
  updates: UpdateCertificateInput
): Promise<Certificate | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .update(updates)
      .eq('id', id)
      .select('*, company:companies(*)')
      .single();

    if (error) {
      console.error('Error updating certificate:', error);
      throw new Error('Failed to update certificate');
    }

    return data || null;
  } catch (error) {
    console.error('updateCertificate error:', error);
    throw error;
  }
}

/**
 * Get certificates by company ID
 */
export async function getCertificatesByCompany(
  companyId: string
): Promise<CertificateDisplay[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select('*, company:companies(*)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching certificates by company:', error);
      throw new Error('Failed to fetch certificates');
    }

    return (data || []).map(transformToDisplay);
  } catch (error) {
    console.error('getCertificatesByCompany error:', error);
    throw error;
  }
}

/**
 * Get certificates by lead ID
 */
export async function getCertificatesByLeadId(
  leadId: string
): Promise<CertificateDisplay[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select('*, company:companies(*)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching certificates by lead ID:', error);
      throw new Error('Failed to fetch certificates');
    }

    return (data || []).map(transformToDisplay);
  } catch (error) {
    console.error('getCertificatesByLeadId error:', error);
    throw error;
  }
}

/**
 * Get certificates with filters (for admin dashboard)
 */
export async function getCertificatesWithFilters(filters: {
  companyId?: string;
  leadId?: string;
  status?: CertificateStatus;
  from?: string;
  to?: string;
}): Promise<CertificateDisplay[]> {
  try {
    let query = supabaseAdmin
      .from('certificates')
      .select('*, company:companies(*)')
      .order('created_at', { ascending: false });

    if (filters.companyId) {
      query = query.eq('company_id', filters.companyId);
    }

    if (filters.leadId) {
      query = query.eq('lead_id', filters.leadId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.from) {
      query = query.gte('created_at', filters.from);
    }

    if (filters.to) {
      query = query.lte('created_at', filters.to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching certificates with filters:', error);
      throw new Error('Failed to fetch certificates');
    }

    return (data || []).map(transformToDisplay);
  } catch (error) {
    console.error('getCertificatesWithFilters error:', error);
    throw error;
  }
}
