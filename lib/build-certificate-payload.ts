/**
 * Certificate Payload Builder
 *
 * Standardizes certificate creation payloads across all automation apps.
 * Every automation app MUST use this builder to ensure consistency.
 *
 * IMPORTANT: The payload format must never differ between applications.
 */

import type { CreateCertificateInput } from '@/types/certificate-client';

/**
 * Build idempotency key from company, lead, and recording IDs
 *
 * Format: {company_key}-{lead_id}-{recording_id}
 *
 * @param company_key - Company identifier
 * @param lead_id - Lead identifier
 * @param recording_id - Recording identifier
 * @returns Idempotency key string
 */
export function buildIdempotencyKey(
  company_key: string,
  lead_id: string,
  recording_id: string
): string {
  return `${company_key}-${lead_id}-${recording_id}`;
}

/**
 * Build certificate creation payload
 *
 * This function ensures all automation apps send identical payload formats.
 *
 * @param input - Certificate creation parameters
 * @returns Standardized payload for certificate API
 */
export function buildCertificatePayload(
  input: CreateCertificateInput
): CreateCertificateInput {
  // Validate required fields
  if (!input.company_key || input.company_key.trim() === '') {
    throw new Error('company_key is required');
  }

  if (!input.source_system || input.source_system.trim() === '') {
    throw new Error('source_system is required');
  }

  if (!input.lead_id || input.lead_id.trim() === '') {
    throw new Error('lead_id is required');
  }

  if (!input.recording_id || input.recording_id.trim() === '') {
    throw new Error('recording_id is required');
  }

  if (!input.recording_url || input.recording_url.trim() === '') {
    throw new Error('recording_url is required');
  }

  if (!input.lead_submitted_at) {
    throw new Error('lead_submitted_at is required');
  }

  if (!input.video_generated_at) {
    throw new Error('video_generated_at is required');
  }

  // Build idempotency key if not provided
  const idempotency_key = input.idempotency_key || buildIdempotencyKey(
    input.company_key,
    input.lead_id,
    input.recording_id
  );

  // Build standardized payload
  const payload: CreateCertificateInput = {
    company_key: input.company_key.trim(),
    source_system: input.source_system.trim(),
    lead_id: input.lead_id.trim(),
    lead_data: input.lead_data || {},
    recording_id: input.recording_id.trim(),
    recording_url: input.recording_url.trim(),
    lead_submitted_at: input.lead_submitted_at,
    video_generated_at: input.video_generated_at,
    idempotency_key,
  };

  // Add optional fields if provided
  if (input.website && input.website.trim() !== '') {
    payload.website = input.website.trim();
  }

  if (input.recording_storage_path && input.recording_storage_path.trim() !== '') {
    payload.recording_storage_path = input.recording_storage_path.trim();
  }

  if (input.recording_type && input.recording_type.trim() !== '') {
    payload.recording_type = input.recording_type.trim();
  } else {
    // Default recording type
    payload.recording_type = 'reconstructed_historical_recording';
  }

  return payload;
}

/**
 * Validate ISO 8601 datetime string
 *
 * @param datetime - Datetime string to validate
 * @returns True if valid ISO 8601 format
 */
export function isValidISODateTime(datetime: string): boolean {
  try {
    const date = new Date(datetime);
    return !isNaN(date.getTime()) && datetime === date.toISOString();
  } catch {
    return false;
  }
}

/**
 * Get current ISO datetime string
 *
 * @returns Current datetime in ISO 8601 format
 */
export function getCurrentISODateTime(): string {
  return new Date().toISOString();
}
