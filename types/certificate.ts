/**
 * Certificate Types
 * Matches the Supabase certificates table schema
 */

import type { Company } from './company';

/**
 * Certificate status values
 */
export type CertificateStatus = 'pending' | 'processing' | 'generated' | 'failed' | 'revoked';

/**
 * Lead data structure (stored as JSONB in database)
 */
export interface LeadData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  taxDebtAmount?: string;
  ipAddress?: string;
  dateOfVisit?: string;
  timeOfVisit?: string;
  duration?: string;
  consentVersion?: string;
  signedDate?: string;
  signedDateISO?: string;
  videoFormat?: string;
  // Allow additional dynamic fields
  [key: string]: unknown;
}

/**
 * Certificate database record
 * Matches the certificates table schema
 */
export interface Certificate {
  // Primary identification
  id: string;
  cert_uuid: string;

  // Company association
  company_id: string | null;
  company?: Company;

  // Source system tracking
  source_system: string | null;
  lead_id: string;

  // Lead data (flexible JSON storage)
  lead_data: LeadData;

  // Recording information
  recording_id: string | null;
  recording_url: string;
  recording_storage_path: string | null;
  recording_type: string;

  // Timestamps
  lead_submitted_at: string | null;
  video_generated_at: string | null;
  completed_at_utc: string | null;

  // Security and verification
  recording_sha256: string | null;
  hmac_signature: string | null;

  // Public access
  public_token: string | null;
  public_url: string | null;

  // Idempotency and deduplication
  idempotency_key: string | null;

  // PDF generation
  pdf_url: string | null;

  // Status tracking
  status: CertificateStatus;
  error_message: string | null;

  // Audit timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating a new certificate
 */
export interface CreateCertificateInput {
  cert_uuid?: string;
  company_id?: string;
  source_system?: string;
  lead_id: string;
  lead_data: LeadData;
  recording_id?: string;
  recording_url: string;
  recording_storage_path?: string;
  recording_type?: string;
  lead_submitted_at?: string;
  video_generated_at?: string;
  completed_at_utc?: string;
  recording_sha256?: string;
  hmac_signature?: string;
  public_token?: string;
  public_url?: string;
  idempotency_key?: string;
  pdf_url?: string;
  status?: CertificateStatus;
}

/**
 * Input for updating an existing certificate
 */
export interface UpdateCertificateInput {
  company_id?: string;
  source_system?: string;
  lead_data?: Partial<LeadData>;
  recording_id?: string;
  recording_url?: string;
  recording_storage_path?: string;
  recording_type?: string;
  lead_submitted_at?: string;
  video_generated_at?: string;
  completed_at_utc?: string;
  recording_sha256?: string;
  hmac_signature?: string;
  public_token?: string;
  public_url?: string;
  pdf_url?: string;
  status?: CertificateStatus;
  error_message?: string;
}

/**
 * History event for certificate timeline
 */
export interface HistoryEvent {
  date: string;
  time: string;
  title: string;
  description: string;
}

/**
 * Certificate with formatted display data
 * Used for backward compatibility with existing UI components
 */
export interface CertificateDisplay extends Certificate {
  // Display-friendly computed fields
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  taxDebtAmount: string;
  dateOfVisit: string;
  timeOfVisit: string;
  duration: string;
  signedDate: string;
  signedDateISO: string;
  ipAddress: string;
  consentVersion: string;
  videoFile: string;
  videoFormat: string;
  certificateId: string;
  historyEvents: HistoryEvent[];
}
