-- Database Schema for E Perkins Law Certificate System
-- This file contains the planned database schema
-- TODO: Create these tables in Supabase when ready

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  tax_debt_amount TEXT,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recordings table
CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  duration TEXT NOT NULL,
  format TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'verified' CHECK (status IN ('verified', 'revoked', 'pending', 'expired')),

  -- Lead information (denormalized for fast access)
  full_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  tax_debt_amount TEXT,

  -- Session information
  ip_address TEXT NOT NULL,
  date_of_visit TEXT NOT NULL,
  time_of_visit TEXT NOT NULL,
  duration TEXT NOT NULL,
  consent_version TEXT NOT NULL,

  -- Timestamps
  signed_date TEXT NOT NULL,
  signed_date_iso TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Recording information (denormalized)
  video_file TEXT NOT NULL,
  video_format TEXT NOT NULL,

  -- Hashing and security
  hash TEXT,
  hash_algorithm TEXT,

  -- Foreign keys
  lead_id UUID REFERENCES leads(id),
  recording_id UUID REFERENCES recordings(id),
  company_id UUID REFERENCES companies(id),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- History events table
CREATE TABLE IF NOT EXISTS history_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID NOT NULL REFERENCES certificates(certificate_id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_token ON certificates(token);
CREATE INDEX IF NOT EXISTS idx_certificates_email ON certificates(email);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_created_at ON certificates(created_at);
CREATE INDEX IF NOT EXISTS idx_history_events_certificate_id ON history_events(certificate_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE certificates IS 'Main certificates table storing consent verification data';
COMMENT ON TABLE leads IS 'Lead/contact information';
COMMENT ON TABLE recordings IS 'Video/audio recording metadata';
COMMENT ON TABLE history_events IS 'Timeline events for each certificate';
COMMENT ON TABLE companies IS 'Company/organization information';
