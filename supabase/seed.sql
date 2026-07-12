-- Seed: Initial Companies
-- Description: Seeds the four initial companies
-- Note: Uses INSERT ... ON CONFLICT DO NOTHING to prevent duplicates on re-runs

-- ============================================================================
-- SEED COMPANIES
-- ============================================================================

INSERT INTO companies (company_key, company_name, website, is_active)
VALUES
  ('myrpmcare', 'MyRPMCare', 'https://myrpmcare.com', TRUE),
  ('cacophiney', 'CA Cophiney', 'https://cacophiney.placeholder.com', TRUE),
  ('thegoodnews360', 'The Good News 360', 'https://thegoodnews360.placeholder.com', TRUE),
  ('fourth_site', 'Fourth Site', 'https://fourthsite.placeholder.com', TRUE)
ON CONFLICT (company_key) DO NOTHING;

-- Note: This seed can be run multiple times safely
-- Duplicate company_key entries will be ignored due to ON CONFLICT DO NOTHING
