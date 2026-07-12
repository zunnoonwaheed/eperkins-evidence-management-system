-- Migration: Create Certificate Tables
-- Description: Creates companies and certificates tables with proper constraints and indexes
-- Version: 001
-- Date: 2026-07-11

-- ============================================================================
-- COMPANIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_key TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment
COMMENT ON TABLE companies IS 'Companies/organizations that generate consent certificates';
COMMENT ON COLUMN companies.company_key IS 'Unique identifier key for API and routing (e.g., myrpmcare)';
COMMENT ON COLUMN companies.is_active IS 'Whether the company account is active';

-- ============================================================================
-- CERTIFICATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS certificates (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),

  -- Company association
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,

  -- Source system tracking
  source_system TEXT,
  lead_id TEXT NOT NULL,

  -- Lead data (flexible JSON storage)
  lead_data JSONB DEFAULT '{}',

  -- Recording information
  recording_id TEXT,
  recording_url TEXT NOT NULL,
  recording_storage_path TEXT,
  recording_type TEXT DEFAULT 'reconstructed_historical_recording',

  -- Timestamps
  lead_submitted_at TIMESTAMPTZ,
  video_generated_at TIMESTAMPTZ,
  completed_at_utc TIMESTAMPTZ,

  -- Security and verification
  recording_sha256 TEXT,
  hmac_signature TEXT,

  -- Public access
  public_token TEXT,
  public_url TEXT,

  -- Idempotency and deduplication
  idempotency_key TEXT UNIQUE,

  -- PDF generation
  pdf_url TEXT,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'generated', 'failed', 'revoked')),
  error_message TEXT,

  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE certificates IS 'Consent verification certificates with recording metadata';
COMMENT ON COLUMN certificates.cert_uuid IS 'Public-facing certificate UUID used in URLs';
COMMENT ON COLUMN certificates.lead_id IS 'External lead ID from source system';
COMMENT ON COLUMN certificates.lead_data IS 'Flexible JSON storage for lead information (name, email, phone, etc.)';
COMMENT ON COLUMN certificates.recording_type IS 'Type of recording (reconstructed_historical_recording, live_consent_capture, etc.)';
COMMENT ON COLUMN certificates.idempotency_key IS 'Unique key to prevent duplicate certificate creation';
COMMENT ON COLUMN certificates.status IS 'Current certificate status (pending, processing, generated, failed, revoked)';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Certificate lookup indexes
CREATE INDEX IF NOT EXISTS idx_certificates_cert_uuid ON certificates(cert_uuid);
CREATE INDEX IF NOT EXISTS idx_certificates_company_id ON certificates(company_id);
CREATE INDEX IF NOT EXISTS idx_certificates_lead_id ON certificates(lead_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_created_at ON certificates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_certificates_video_generated_at ON certificates(video_generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_certificates_idempotency_key ON certificates(idempotency_key);

-- Company lookup indexes
CREATE INDEX IF NOT EXISTS idx_companies_company_key ON companies(company_key);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(is_active);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_certificates_company_status ON certificates(company_id, status);
CREATE INDEX IF NOT EXISTS idx_certificates_company_created ON certificates(company_id, created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to companies table
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to certificates table
DROP TRIGGER IF EXISTS update_certificates_updated_at ON certificates;
CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "No public access to companies" ON companies;
DROP POLICY IF EXISTS "No public access to certificates" ON certificates;

-- Restrict all public access
-- Only service role (server-side) can access these tables
CREATE POLICY "No public access to companies"
  ON companies
  FOR ALL
  USING (false);

CREATE POLICY "No public access to certificates"
  ON certificates
  FOR ALL
  USING (false);

-- Note: All data access must go through server-side repository functions
-- using the service role key (supabase-admin.ts)
