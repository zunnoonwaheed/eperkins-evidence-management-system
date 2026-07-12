/**
 * Company Types
 * Matches the Supabase companies table schema
 */

export interface Company {
  id: string;
  company_key: string;
  company_name: string;
  website: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyInput {
  company_key: string;
  company_name: string;
  website?: string;
  logo_url?: string;
  is_active?: boolean;
}

export interface UpdateCompanyInput {
  company_name?: string;
  website?: string;
  logo_url?: string;
  is_active?: boolean;
}
