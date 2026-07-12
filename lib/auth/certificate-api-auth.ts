/**
 * Certificate API Authentication
 *
 * Validates API keys for certificate creation requests.
 * Each automation app has its own API key that maps to a specific company.
 *
 * SECURITY:
 * - Uses timing-safe comparison to prevent timing attacks
 * - Never exposes configured keys in responses
 * - Server-side only - never import in client components
 */

import { timingSafeEqual } from 'crypto';

/**
 * API key to company mapping
 * Loaded from environment variables
 */
const API_KEY_MAP: Record<string, string> = {
  [process.env.CERT_API_KEY_MYRPMCARE || '']: 'myrpmcare',
  [process.env.CERT_API_KEY_CACOPHINEY || '']: 'cacophiney',
  [process.env.CERT_API_KEY_THEGOODNEWS360 || '']: 'thegoodnews360',
  [process.env.CERT_API_KEY_FOURTH_SITE || '']: 'fourth_site',
};

/**
 * Timing-safe string comparison
 * Prevents timing attacks when comparing API keys
 */
function timingSafeCompare(a: string, b: string): boolean {
  try {
    // Both strings must be the same length for timingSafeEqual
    if (a.length !== b.length) {
      return false;
    }

    const bufferA = Buffer.from(a, 'utf8');
    const bufferB = Buffer.from(b, 'utf8');

    return timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}

/**
 * Authentication result
 */
export interface AuthResult {
  authenticated: boolean;
  companyKey?: string;
  error?: string;
}

/**
 * Authenticate API key and identify company
 *
 * @param apiKey - The API key from X-API-Key header
 * @returns Authentication result with company key if valid
 */
export function authenticateApiKey(apiKey: string | null | undefined): AuthResult {
  // Check if API key is provided
  if (!apiKey || apiKey.trim() === '') {
    return {
      authenticated: false,
      error: 'Missing API key',
    };
  }

  // Find matching company using timing-safe comparison
  for (const [configuredKey, companyKey] of Object.entries(API_KEY_MAP)) {
    // Skip empty keys (missing env vars)
    if (!configuredKey) {
      continue;
    }

    if (timingSafeCompare(apiKey, configuredKey)) {
      return {
        authenticated: true,
        companyKey,
      };
    }
  }

  // No match found
  return {
    authenticated: false,
    error: 'Invalid API key',
  };
}

/**
 * Validate that the authenticated company matches the request
 *
 * @param authenticatedCompanyKey - Company key from API auth
 * @param requestCompanyKey - Company key from request payload
 * @returns True if they match
 */
export function validateCompanyMatch(
  authenticatedCompanyKey: string,
  requestCompanyKey: string
): boolean {
  return authenticatedCompanyKey === requestCompanyKey;
}

/**
 * Extract API key from request headers
 *
 * @param headers - Request headers
 * @returns API key or null
 */
export function extractApiKey(headers: Headers): string | null {
  return headers.get('x-api-key') || headers.get('X-API-Key') || null;
}
