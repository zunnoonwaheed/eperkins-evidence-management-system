/**
 * Certificate Client Types
 *
 * Response types for certificate creation API integration
 */

/**
 * Certificate data returned from API
 */
export interface Certificate {
  cert_uuid: string;
  company_key: string;
  lead_id: string;
  recording_id: string;
  status: string;
  certificate_url: string;
}

/**
 * Successful API response
 */
export interface CertificateResponse {
  success: true;
  duplicate: boolean;
  certificate: Certificate;
}

/**
 * Error response from API
 */
export interface CertificateError {
  success: false;
  error: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Union type for all possible API responses
 */
export type CertificateApiResponse = CertificateResponse | CertificateError;

/**
 * Result type for certificate creation
 * Success case includes the certificate data
 * Error case includes error details
 */
export type CertificateResult =
  | { success: true; duplicate: boolean; certificate: Certificate }
  | { success: false; error: string; details?: Array<{ field: string; message: string }> };

/**
 * Input parameters for certificate creation
 */
export interface CreateCertificateInput {
  company_key: string;
  source_system: string;
  website?: string;
  lead_id: string;
  lead_data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    form_answers?: Record<string, unknown>;
    [key: string]: unknown;
  };
  recording_id: string;
  recording_url: string;
  recording_storage_path?: string;
  recording_type?: string;
  lead_submitted_at: string;
  video_generated_at: string;
  idempotency_key: string;
}

/**
 * Certificate client configuration
 */
export interface CertificateClientConfig {
  apiUrl: string;
  apiKey: string;
  timeout?: number;
  maxRetries?: number;
}

/**
 * Safe fields for logging (no PII)
 */
export interface CertificateLogData {
  company_key: string;
  lead_id: string;
  recording_id: string;
  cert_uuid?: string;
  duplicate?: boolean;
  status: 'success' | 'error';
  error_type?: string;
  timestamp: string;
}
