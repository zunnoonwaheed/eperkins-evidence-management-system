/**
 * PDF Service - Certificate PDF generation
 *
 * This service will handle:
 * - Generating PDF versions of certificates
 * - Embedding verification QR codes
 * - PDF storage and retrieval
 *
 * TODO: Implement when PDF generation feature is needed
 * Consider using: @react-pdf/renderer or puppeteer
 */

import type { Certificate } from '@/types';

/**
 * Generate PDF for a certificate
 * TODO: Implement PDF generation
 */
export async function generateCertificatePDF(certificate: Certificate): Promise<Buffer> {
  throw new Error('Not implemented: generateCertificatePDF - requires PDF library integration');
}

/**
 * Generate PDF with QR code for verification
 * TODO: Implement QR code embedding
 */
export async function generatePDFWithQR(
  certificate: Certificate,
  qrCodeUrl: string
): Promise<Buffer> {
  throw new Error('Not implemented: generatePDFWithQR - requires QR code library');
}

/**
 * Save PDF to storage
 * TODO: Implement storage integration (e.g., Supabase Storage)
 */
export async function saveCertificatePDF(
  certificateId: string,
  pdfBuffer: Buffer
): Promise<string> {
  throw new Error('Not implemented: saveCertificatePDF - requires storage integration');
}

/**
 * Get PDF URL for certificate
 * TODO: Implement storage URL retrieval
 */
export async function getCertificatePDFUrl(certificateId: string): Promise<string | null> {
  throw new Error('Not implemented: getCertificatePDFUrl - requires storage integration');
}
