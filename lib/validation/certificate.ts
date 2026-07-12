/**
 * Certificate Validation Schemas
 * Uses Zod for runtime validation
 */

import { z } from 'zod';

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Certificate status validation
 */
export const certificateStatusSchema = z.enum([
  'pending',
  'processing',
  'generated',
  'failed',
  'revoked',
]);

/**
 * Company key validation
 */
export const companyKeySchema = z
  .string()
  .min(1, 'Company key is required')
  .max(100, 'Company key too long')
  .regex(/^[a-z0-9_-]+$/, 'Company key must contain only lowercase letters, numbers, hyphens, and underscores');

/**
 * Lead data validation (flexible schema)
 */
export const leadDataSchema = z.record(z.string(), z.unknown()).default({});

/**
 * Create certificate input validation
 */
export const createCertificateSchema = z.object({
  company_id: uuidSchema.optional(),
  source_system: z.string().optional(),
  lead_id: z.string().min(1, 'Lead ID is required'),
  lead_data: leadDataSchema,
  recording_id: z.string().optional(),
  recording_url: z.string().url('Invalid recording URL'),
  recording_storage_path: z.string().optional(),
  recording_type: z.string().default('reconstructed_historical_recording'),
  lead_submitted_at: z.string().datetime().optional(),
  video_generated_at: z.string().datetime().optional(),
  completed_at_utc: z.string().datetime().optional(),
  recording_sha256: z.string().optional(),
  hmac_signature: z.string().optional(),
  public_token: z.string().optional(),
  public_url: z.string().url().optional(),
  idempotency_key: z.string().optional(),
  pdf_url: z.string().url().optional(),
  status: certificateStatusSchema.default('pending'),
});

/**
 * Update certificate input validation
 */
export const updateCertificateSchema = z.object({
  company_id: uuidSchema.optional(),
  source_system: z.string().optional(),
  lead_data: z.record(z.string(), z.unknown()).optional(),
  recording_id: z.string().optional(),
  recording_url: z.string().url().optional(),
  recording_storage_path: z.string().optional(),
  recording_type: z.string().optional(),
  lead_submitted_at: z.string().datetime().optional(),
  video_generated_at: z.string().datetime().optional(),
  completed_at_utc: z.string().datetime().optional(),
  recording_sha256: z.string().optional(),
  hmac_signature: z.string().optional(),
  public_token: z.string().optional(),
  public_url: z.string().url().optional(),
  pdf_url: z.string().url().optional(),
  status: certificateStatusSchema.optional(),
  error_message: z.string().optional(),
});

/**
 * Date filter validation (for queries)
 */
export const dateFilterSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

/**
 * Certificate query filters validation
 */
export const certificateFiltersSchema = z.object({
  company: companyKeySchema.optional(),
  leadId: z.string().optional(),
  status: certificateStatusSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

/**
 * Type inference from schemas
 */
export type CreateCertificateInput = z.infer<typeof createCertificateSchema>;
export type UpdateCertificateInput = z.infer<typeof updateCertificateSchema>;
export type CertificateFilters = z.infer<typeof certificateFiltersSchema>;
