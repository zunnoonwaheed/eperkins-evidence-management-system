/**
 * Certificate Logging
 *
 * Structured logging for certificate creation.
 * Only logs safe fields - never logs PII or API keys.
 *
 * Safe fields:
 * - company_key
 * - lead_id
 * - recording_id
 * - cert_uuid
 * - duplicate
 * - status
 * - error_type
 * - timestamp
 *
 * Never logs:
 * - email
 * - phone
 * - lead_data
 * - API keys
 * - full error messages (may contain sensitive data)
 */

import type { CertificateLogData, CertificateResult } from '@/types/certificate-client';

/**
 * Log certificate creation attempt
 *
 * @param data - Safe logging data
 */
export function logCertificateCreation(data: CertificateLogData): void {
  console.log('[Certificate Integration]', {
    company_key: data.company_key,
    lead_id: data.lead_id,
    recording_id: data.recording_id,
    cert_uuid: data.cert_uuid,
    duplicate: data.duplicate,
    status: data.status,
    error_type: data.error_type,
    timestamp: data.timestamp,
  });
}

/**
 * Log successful certificate creation
 *
 * @param company_key - Company identifier
 * @param lead_id - Lead identifier
 * @param recording_id - Recording identifier
 * @param cert_uuid - Certificate UUID
 * @param duplicate - Whether this was a duplicate request
 */
export function logCertificateSuccess(
  company_key: string,
  lead_id: string,
  recording_id: string,
  cert_uuid: string,
  duplicate: boolean
): void {
  logCertificateCreation({
    company_key,
    lead_id,
    recording_id,
    cert_uuid,
    duplicate,
    status: 'success',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log certificate creation error
 *
 * @param company_key - Company identifier
 * @param lead_id - Lead identifier
 * @param recording_id - Recording identifier
 * @param error_type - Type of error (e.g., 'network', 'timeout', 'validation', 'auth')
 */
export function logCertificateError(
  company_key: string,
  lead_id: string,
  recording_id: string,
  error_type: string
): void {
  logCertificateCreation({
    company_key,
    lead_id,
    recording_id,
    status: 'error',
    error_type,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log certificate result (success or error)
 *
 * @param company_key - Company identifier
 * @param lead_id - Lead identifier
 * @param recording_id - Recording identifier
 * @param result - Certificate creation result
 */
export function logCertificateResult(
  company_key: string,
  lead_id: string,
  recording_id: string,
  result: CertificateResult
): void {
  if (result.success) {
    logCertificateSuccess(
      company_key,
      lead_id,
      recording_id,
      result.certificate.cert_uuid,
      result.duplicate
    );
  } else {
    // Determine error type from error message
    const errorType = getErrorType(result.error);
    logCertificateError(company_key, lead_id, recording_id, errorType);
  }
}

/**
 * Get error type from error message
 *
 * @param error - Error message
 * @returns Error type
 */
function getErrorType(error: string): string {
  const lowerError = error.toLowerCase();

  if (lowerError.includes('timeout')) {
    return 'timeout';
  }

  if (lowerError.includes('network') || lowerError.includes('fetch')) {
    return 'network';
  }

  if (lowerError.includes('401') || lowerError.includes('authentication')) {
    return 'auth';
  }

  if (lowerError.includes('403') || lowerError.includes('forbidden')) {
    return 'forbidden';
  }

  if (lowerError.includes('404') || lowerError.includes('not found')) {
    return 'not_found';
  }

  if (lowerError.includes('400') || lowerError.includes('validation')) {
    return 'validation';
  }

  if (lowerError.includes('500') || lowerError.includes('internal server')) {
    return 'server_error';
  }

  if (lowerError.includes('retry')) {
    return 'retry_exhausted';
  }

  return 'unknown';
}

/**
 * Create warning message for failed certificate creation
 *
 * This is safe to show to end users or log in application logs.
 *
 * @param company_key - Company identifier
 * @param lead_id - Lead identifier
 * @returns Warning message
 */
export function createCertificateWarning(company_key: string, lead_id: string): string {
  return `Warning: Certificate creation failed for ${company_key} lead ${lead_id}. Video generation completed successfully.`;
}
