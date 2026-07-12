/**
 * Certificate Data Layer - DEPRECATED
 *
 * ⚠️ This file is NO LONGER USED in the application.
 * All certificate data now comes from the Supabase database.
 *
 * This file is kept temporarily as a backup reference for the seed script.
 * It can be safely deleted after verifying the database integration works correctly.
 *
 * To remove this file:
 * 1. Verify database is working: npm run seed:certificates
 * 2. Test all certificate pages load from database
 * 3. Delete this file: rm data/certificates.ts
 */

import type { Certificate } from '@/types';

type CertificateDatabase = {
  [certificateId: string]: Certificate;
};

// Dummy certificate database
// TODO: Replace with actual database queries when Supabase is integrated
export const CERTIFICATES: CertificateDatabase = {
  // Certificate 1: Shridhar Ratnam
  "9f4a1c72-2d8e-4f01-91b3-1c7e6a9d8b44": {
    token: "ZWZmMGQ4ZGUxOTk4ZTU1ZjYxZjJmMjA3YzkyMDkxZDMtN2U3YTY5YjdiMjQ5ZTE0YzM5MWI5MDgxYzg5OTc3MTM=",
    status: "verified",
    fullName: "Shridhar Ratnam",
    firstName: "Shridhar",
    lastName: "Ratnam",
    email: "shridhar.ratnam@gmail.com",
    phone: "7189005959",
    taxDebtAmount: "Not sure",
    certificateId: "9f4a1c72-2d8e-4f01-91b3-1c7e6a9d8b44",
    signedDate: "Jun 29, 2026 · 04:10 UTC",
    signedDateISO: "2026-06-29T04:10:00.794Z",
    dateOfVisit: "June 29, 2026",
    timeOfVisit: "04:10:00 UTC",
    duration: "0:49",
    ipAddress: "158.59.127.249",
    consentVersion: "v2026-06b",
    videoFile: "/videos/rec1.mp4",
    videoFormat: "Screen recording",
    historyEvents: [
      {
        date: "Jun 29, 2026",
        time: "04:10:00 UTC",
        title: "Certificate Created",
        description: "Certificate automatically generated and locked. Verification hash computed and stored immutably."
      },
      {
        date: "Jun 29, 2026",
        time: "04:10:00 UTC",
        title: "Consent Recorded",
        description: "User consent captured via form submission. IP address logged, session replay initiated."
      },
      {
        date: "Jun 29, 2026",
        time: "04:09:11 UTC",
        title: "Session Initiated",
        description: "User accessed consent form. Consent language version v2026-06b displayed."
      }
    ]
  },

  // Certificate 2: Gary Polsley
  "b71d3f89-a6c0-4b2f-bf97-582e9d1e3c21": {
    token: "YjcxZDNmODlhNmMwNGIyZmJmOTc1ODJlOWQxZTNjMjEtOGE3YjU5YzhjMzQ4ZTE1YzQ5MmI5MTgyZDlhOTg4MjQ=",
    status: "verified",
    fullName: "Gary Polsley",
    firstName: "Gary",
    lastName: "Polsley",
    email: "richkelleigh@aol.com",
    phone: "5033185255",
    taxDebtAmount: "Not sure",
    certificateId: "b71d3f89-a6c0-4b2f-bf97-582e9d1e3c21",
    signedDate: "Jun 28, 2026 · 04:10 UTC",
    signedDateISO: "2026-06-28T04:10:56.000Z",
    dateOfVisit: "June 28, 2026",
    timeOfVisit: "04:10:56 UTC",
    duration: "0:48",
    ipAddress: "63.155.38.243",
    consentVersion: "v2026-07a",
    videoFile: "/videos/rec2.mp4",
    videoFormat: "Screen recording",
    historyEvents: [
      {
        date: "Jun 28, 2026",
        time: "04:10:56 UTC",
        title: "Certificate Created",
        description: "Certificate automatically generated and locked. Verification hash computed and stored immutably."
      },
      {
        date: "Jun 28, 2026",
        time: "04:10:56 UTC",
        title: "Consent Recorded",
        description: "User consent captured via form submission. IP address logged, session replay initiated."
      },
      {
        date: "Jun 28, 2026",
        time: "04:10:07 UTC",
        title: "Session Initiated",
        description: "User accessed consent form. Consent language version v2026-07a displayed."
      }
    ]
  },

  // Certificate 3: Ashley Rodriguez
  "17c9e2d5-6a3b-4127-8e9f-0ab3d65f7c98": {
    token: "MTdjOWUyZDU2YTNiNDEyNzhlOWYwYWIzZDY1ZjdjOTgtOWI4YzZhOWQ4MzU5ZTI2ZDUwM2MyOTkzZWJiYTk5MzU=",
    status: "verified",
    fullName: "Ashley Rodriguez",
    firstName: "Ashley",
    lastName: "Rodriguez",
    email: "ashley@buddingrosesphotography.com",
    phone: "9082977199",
    taxDebtAmount: "Not sure",
    certificateId: "17c9e2d5-6a3b-4127-8e9f-0ab3d65f7c98",
    signedDate: "Jun 23, 2026 · 04:11 UTC",
    signedDateISO: "2026-06-23T04:11:54.000Z",
    dateOfVisit: "June 23, 2026",
    timeOfVisit: "04:11:54 UTC",
    duration: "0:50",
    ipAddress: "68.239.224.180",
    consentVersion: "v2026-07a",
    videoFile: "/videos/rec3.mp4",
    videoFormat: "Screen recording",
    historyEvents: [
      {
        date: "Jun 23, 2026",
        time: "04:11:54 UTC",
        title: "Certificate Created",
        description: "Certificate automatically generated and locked. Verification hash computed and stored immutably."
      },
      {
        date: "Jun 23, 2026",
        time: "04:11:54 UTC",
        title: "Consent Recorded",
        description: "User consent captured via form submission. IP address logged, session replay initiated."
      },
      {
        date: "Jun 23, 2026",
        time: "04:11:04 UTC",
        title: "Session Initiated",
        description: "User accessed consent form. Consent language version v2026-07a displayed."
      }
    ]
  }
};

/**
 * Get all certificates
 * TODO: Replace with database query
 */
export function getAllCertificates(): Certificate[] {
  return Object.values(CERTIFICATES);
}

/**
 * Get certificate by ID (without token validation)
 * TODO: Replace with database query
 */
export function getCertificateById(certId: string): Certificate | null {
  return CERTIFICATES[certId] || null;
}

/**
 * Validate certificate ID and token combination
 * TODO: Replace with database query + secure token validation
 */
export function validateCertificate(certId: string, token: string): Certificate | null {
  const cert = CERTIFICATES[certId];
  if (!cert) return null;
  if (cert.token !== token) return null;
  return cert;
}

/**
 * Check if a certificate exists
 * TODO: Replace with database query
 */
export function certificateExists(certId: string): boolean {
  return CERTIFICATES.hasOwnProperty(certId);
}
