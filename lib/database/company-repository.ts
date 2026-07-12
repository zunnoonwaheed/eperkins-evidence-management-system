/**
 * Company Repository
 *
 * Server-side only functions for company database operations.
 * Uses supabase-admin client with service role key to bypass RLS.
 *
 * SECURITY: Never import this in client components.
 */

import { supabaseAdmin } from './supabase-admin';
import type { Company, CreateCompanyInput, UpdateCompanyInput } from '@/types/company';

/**
 * Get all companies
 * Optionally filter by active status
 */
export async function getAllCompanies(
  activeOnly: boolean = false
): Promise<Company[]> {
  try {
    let query = supabaseAdmin
      .from('companies')
      .select('*')
      .order('company_name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching companies:', error);
      throw new Error('Failed to fetch companies');
    }

    return data || [];
  } catch (error) {
    console.error('getAllCompanies error:', error);
    throw error;
  }
}

/**
 * Get company by company_key
 */
export async function getCompanyByKey(
  companyKey: string
): Promise<Company | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('company_key', companyKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching company by key:', error);
      throw new Error('Failed to fetch company');
    }

    return data || null;
  } catch (error) {
    console.error('getCompanyByKey error:', error);
    return null;
  }
}

/**
 * Get company by ID
 */
export async function getCompanyById(
  companyId: string
): Promise<Company | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching company by ID:', error);
      throw new Error('Failed to fetch company');
    }

    return data || null;
  } catch (error) {
    console.error('getCompanyById error:', error);
    return null;
  }
}

/**
 * Create a new company
 */
export async function createCompany(
  input: CreateCompanyInput
): Promise<Company> {
  try {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .insert([input])
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      throw new Error('Failed to create company');
    }

    return data;
  } catch (error) {
    console.error('createCompany error:', error);
    throw error;
  }
}

/**
 * Update an existing company
 */
export async function updateCompany(
  companyId: string,
  updates: UpdateCompanyInput
): Promise<Company | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating company:', error);
      throw new Error('Failed to update company');
    }

    return data || null;
  } catch (error) {
    console.error('updateCompany error:', error);
    throw error;
  }
}
