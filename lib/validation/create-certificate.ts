/**
 * Create Certificate API Payload Validation
 *
 * Validates incoming certificate creation requests from automation apps.
 */

import { z } from 'zod';

/**
 * Lead data schema - flexible object for form answers and contact info
 * Supports both camelCase and snake_case for field names
 */
const leadDataSchema = z.object({
  // camelCase (preferred, used by TypeScript frontend)
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),

  // snake_case (legacy support)
  first_name: z.string().optional(),
  last_name: z.string().optional(),

  // Form answers
  form_answers: z.record(z.string(), z.unknown()).optional(),
}).passthrough(); // Allow additional fields

/**
 * Create certificate payload schema
 */
export const createCertificatePayloadSchema = z.object({
  // Company identification
  company_key: z.string().min(1, 'company_key is required')
    .regex(/^[a-z0-9_-]+$/, 'company_key must contain only lowercase letters, numbers, hyphens, and underscores'),

  website: z.string().optional(),

  // Source tracking
  source_system: z.string().min(1, 'source_system is required'),

  // Lead identification
  lead_id: z.string().min(1, 'lead_id is required'),
  lead_data: leadDataSchema,

  // Recording information
  recording_id: z.string().min(1, 'recording_id is required'),
  recording_url: z.string().url('recording_url must be a valid URL'),
  recording_storage_path: z.string().optional(),
  recording_type: z.string().default('reconstructed_historical_recording'),

  // Timestamps
  lead_submitted_at: z.string().datetime('lead_submitted_at must be a valid ISO datetime'),
  video_generated_at: z.string().datetime('video_generated_at must be a valid ISO datetime'),

  // Idempotency
  idempotency_key: z.string().min(1, 'idempotency_key is required'),
});

/**
 * Type inference from schema
 */
export type CreateCertificatePayload = z.infer<typeof createCertificatePayloadSchema>;

/**
 * Validate and parse create certificate payload
 */
export function validateCreateCertificatePayload(data: unknown): {
  success: true;
  data: CreateCertificatePayload;
} | {
  success: false;
  errors: Array<{ field: string; message: string }>;
} {
  const result = createCertificatePayloadSchema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  // Format Zod errors into a user-friendly format
  const errors = result.error.issues.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return {
    success: false,
    errors,
  };
}
