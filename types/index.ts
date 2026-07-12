// Core type definitions for the E Perkins Law certificate system

/**
 * Certificate status types
 */
export type CertificateStatus = 'verified' | 'revoked' | 'pending' | 'expired';

/**
 * Recording types
 */
export type RecordingType = 'video' | 'audio' | 'screen';

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
 * Company information
 */
export interface Company {
  id: string;
  name: string;
  domain?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Lead/Contact information
 */
export interface LeadData {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  taxDebtAmount?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Recording information
 */
export interface Recording {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  duration: string;
  format: string;
  recordedAt: string;
  recordedAtISO: string;
}

/**
 * Certificate - Main certificate entity
 */
export interface Certificate {
  // Core identification
  certificateId: string;
  token?: string; // For secure access
  status: CertificateStatus;

  // Lead information
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  taxDebtAmount: string;

  // Session information
  ipAddress: string;
  dateOfVisit: string;
  timeOfVisit: string;
  duration: string;
  consentVersion: string;

  // Timestamps
  signedDate: string;
  signedDateISO: string;
  createdAt?: string;
  updatedAt?: string;

  // Recording
  videoFile: string;
  videoFormat: string;

  // History
  historyEvents: HistoryEvent[];

  // Optional company association
  companyId?: string;
  company?: Company;

  // Future fields (prepared but not used yet)
  leadId?: string;
  recordingId?: string;
  hash?: string;
  hashAlgorithm?: string;
}

/**
 * Certificate creation input
 */
export interface CreateCertificateInput {
  lead: LeadData;
  recording: Recording;
  consentVersion: string;
  companyId?: string;
}

/**
 * Certificate update input
 */
export interface UpdateCertificateInput {
  status?: CertificateStatus;
  metadata?: Record<string, unknown>;
}

/**
 * API Response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Pagination types
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
