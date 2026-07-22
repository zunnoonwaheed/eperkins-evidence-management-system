const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

export interface TaxReliefFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  zipCode: string;
  debtAmount: string;
  debtType: string;
  unfiled: string;
  enforcement: string;
  income: string;
  tcpaConsent: boolean;
  tcpaConsentTimestamp: string;
  ipAddress: string;
}

export interface ApiResponse {
  success: boolean;
  video?: {
    url: string;
    recording_id: string;
    storage_path?: string;
  };
  certificate?: {
    cert_uuid: string;
    certificate_url: string;
    duplicate: boolean;
    status: string;
  };
  error?: string;
}

export async function submitTaxReliefForm(data: TaxReliefFormData): Promise<ApiResponse> {
  try {
    const response = await fetch(`${API_URL}/api/generate/single`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Server error: ${response.status} ${response.statusText}`,
      };
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

export async function healthCheck(): Promise<{ status: string; service?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    const data = await response.json();
    return data;
  } catch (error) {
    return { status: 'error' };
  }
}
