// GoodNews360 API Client
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export interface SurveySubmission {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  zipCode: string;
  age: string;
  homeOwnership: string;
  householdIncome: string;
  taxDebt: string;
  billReduction: string;
  tcpaConsent?: boolean;
  tcpaConsentTimestamp?: string;
  ipAddress?: string;
  certUuid?: string;
}

export interface VideoResponse {
  success: boolean;
  recording_id?: string;
  video_url?: string;
  error?: string;
}

export interface CertificateResponse {
  success: boolean;
  cert_uuid?: string;
  certificate_url?: string;
  duplicate?: boolean;
  status?: string;
  warning?: string;
  error?: string;
}

export interface ApiResponse {
  success: boolean;
  video?: VideoResponse;
  certificate?: CertificateResponse;
  error?: string;
  message?: string;
}

export async function submitSurvey(data: SurveySubmission): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_URL}/api/generate/single`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}
