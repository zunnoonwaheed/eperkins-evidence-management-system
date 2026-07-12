/**
 * Certificate Client
 *
 * Reusable client for automation apps to create certificates.
 *
 * Features:
 * - HTTP POST to certificate API
 * - API key authentication
 * - Timeout support
 * - Retry logic with exponential backoff
 * - Meaningful error messages
 * - Never exposes API keys in logs or errors
 *
 * Usage:
 *
 * const result = await createCertificate({
 *   company_key: 'myrpmcare',
 *   source_system: 'myrpmcare-automation',
 *   lead_id: 'lead-123',
 *   lead_data: { ... },
 *   recording_id: 'rec-456',
 *   recording_url: 'https://...',
 *   lead_submitted_at: '2025-01-01T00:00:00Z',
 *   video_generated_at: '2025-01-01T00:05:00Z',
 *   idempotency_key: 'myrpmcare-lead-123-rec-456',
 * }, {
 *   apiUrl: process.env.CERTIFICATE_API_URL!,
 *   apiKey: process.env.MYRPMCARE_CERT_API_KEY!,
 *   timeout: 30000,
 *   maxRetries: 3,
 * });
 */

import type {
  CreateCertificateInput,
  CertificateResult,
  CertificateApiResponse,
  CertificateClientConfig,
} from '@/types/certificate-client';
import { buildCertificatePayload } from './build-certificate-payload';

/**
 * Default timeout: 30 seconds
 */
const DEFAULT_TIMEOUT = 30000;

/**
 * Default max retries: 3
 */
const DEFAULT_MAX_RETRIES = 3;

/**
 * Retry delay base: 1 second
 */
const RETRY_DELAY_BASE = 1000;

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate retry delay with exponential backoff
 *
 * @param attempt - Current retry attempt (0-indexed)
 * @returns Delay in milliseconds
 */
function getRetryDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, etc.
  return RETRY_DELAY_BASE * Math.pow(2, attempt);
}

/**
 * Check if error is retryable
 *
 * @param status - HTTP status code
 * @returns True if error should be retried
 */
function isRetryableError(status?: number): boolean {
  if (!status) return true; // Network errors are retryable

  // Retry on:
  // - 408 Request Timeout
  // - 429 Too Many Requests
  // - 500 Internal Server Error
  // - 502 Bad Gateway
  // - 503 Service Unavailable
  // - 504 Gateway Timeout
  return status === 408 || status === 429 || status >= 500;
}

/**
 * Make HTTP POST request with timeout
 *
 * @param url - API endpoint URL
 * @param payload - Request payload
 * @param apiKey - API key for authentication
 * @param timeout - Timeout in milliseconds
 * @returns API response
 */
async function makeRequest(
  url: string,
  payload: CreateCertificateInput,
  apiKey: string,
  timeout: number
): Promise<{ status: number; data: CertificateApiResponse }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    return {
      status: response.status,
      data,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }

    throw error;
  }
}

/**
 * Create certificate via API with retry logic
 *
 * This is the main function that automation apps should call.
 *
 * @param input - Certificate creation parameters
 * @param config - Client configuration
 * @returns Certificate creation result
 */
export async function createCertificate(
  input: CreateCertificateInput,
  config: CertificateClientConfig
): Promise<CertificateResult> {
  // Validate configuration
  if (!config.apiUrl || config.apiUrl.trim() === '') {
    throw new Error('Certificate API URL is required');
  }

  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new Error('Certificate API key is required');
  }

  // Build standardized payload
  const payload = buildCertificatePayload(input);

  // Configuration
  const timeout = config.timeout || DEFAULT_TIMEOUT;
  const maxRetries = config.maxRetries || DEFAULT_MAX_RETRIES;
  const url = `${config.apiUrl}/api/certificates/create`;

  // Retry loop
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add delay before retry (but not on first attempt)
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1);
        await sleep(delay);
      }

      // Make request
      const { status, data } = await makeRequest(url, payload, config.apiKey, timeout);

      // Success response (201 or 200)
      if (data.success) {
        return {
          success: true,
          duplicate: data.duplicate,
          certificate: data.certificate,
        };
      }

      // Error response - check if retryable
      if (!isRetryableError(status)) {
        // Non-retryable error (4xx client errors except 408, 429)
        return {
          success: false,
          error: data.error || 'Certificate creation failed',
          details: data.errors,
        };
      }

      // Retryable error - save it and continue loop
      lastError = new Error(`HTTP ${status}: ${data.error || 'Unknown error'}`);

      // If this was the last retry, fall through to throw the error
      if (attempt === maxRetries) {
        break;
      }
    } catch (error) {
      // Network error or timeout
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // If this was the last retry, fall through to throw the error
      if (attempt === maxRetries) {
        break;
      }

      // Otherwise continue to next retry
    }
  }

  // All retries exhausted
  return {
    success: false,
    error: lastError
      ? `Certificate creation failed after ${maxRetries} retries: ${lastError.message}`
      : 'Certificate creation failed',
  };
}

/**
 * Create certificate with safe error handling
 *
 * This wrapper ensures video generation never fails due to certificate errors.
 * It catches all errors and returns a result object.
 *
 * Use this in production automation apps.
 *
 * @param input - Certificate creation parameters
 * @param config - Client configuration
 * @returns Certificate result (never throws)
 */
export async function createCertificateSafe(
  input: CreateCertificateInput,
  config: CertificateClientConfig
): Promise<CertificateResult> {
  try {
    return await createCertificate(input, config);
  } catch (error) {
    // Catch any unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: `Certificate creation failed: ${errorMessage}`,
    };
  }
}
