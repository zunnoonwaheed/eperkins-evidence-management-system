/**
 * Seed Certificates Script
 *
 * This script seeds the database with the three sample certificates
 * using the existing dummy data from data/certificates.ts
 *
 * Usage:
 *   npm run seed:certificates
 *
 * Prerequisites:
 *   - Supabase project created
 *   - Environment variables configured in .env.local
 *   - Migration 001_create_certificate_tables.sql executed
 *   - seed.sql executed (companies seeded)
 *
 * Note: Environment variables are loaded by dotenv-cli
 */

import { createCertificate } from '../lib/database/certificate-repository';
import { getCompanyByKey } from '../lib/database/company-repository';
import type { CreateCertificateInput } from '../types/certificate';

// Import the original dummy data
const DUMMY_CERTIFICATES = [
  {
    cert_uuid: '9f4a1c72-2d8e-4f01-91b3-1c7e6a9d8b44',
    lead_id: 'lead_001',
    recording_url: '/videos/rec1.mp4',
    idempotency_key: 'seed_cert_rec1',
    lead_data: {
      fullName: 'Shridhar Ratnam',
      firstName: 'Shridhar',
      lastName: 'Ratnam',
      email: 'shridhar.ratnam@gmail.com',
      phone: '7189005959',
      taxDebtAmount: 'Not sure',
      signedDate: 'Jun 29, 2026 · 04:10 UTC',
      signedDateISO: '2026-06-29T04:10:00.794Z',
      dateOfVisit: 'June 29, 2026',
      timeOfVisit: '04:10:00 UTC',
      duration: '0:49',
      ipAddress: '158.59.127.249',
      consentVersion: 'v2026-06b',
      videoFormat: 'Screen recording',
    },
    lead_submitted_at: '2026-06-29T04:10:00.794Z',
    video_generated_at: '2026-06-29T04:10:00.794Z',
    completed_at_utc: '2026-06-29T04:10:00.794Z',
    status: 'generated' as const,
  },
  {
    cert_uuid: 'b71d3f89-a6c0-4b2f-bf97-582e9d1e3c21',
    lead_id: 'lead_002',
    recording_url: '/videos/rec2.mp4',
    idempotency_key: 'seed_cert_rec2',
    lead_data: {
      fullName: 'Gary Polsley',
      firstName: 'Gary',
      lastName: 'Polsley',
      email: 'richkelleigh@aol.com',
      phone: '5033185255',
      taxDebtAmount: 'Not sure',
      signedDate: 'Jun 28, 2026 · 04:10 UTC',
      signedDateISO: '2026-06-28T04:10:56.000Z',
      dateOfVisit: 'June 28, 2026',
      timeOfVisit: '04:10:56 UTC',
      duration: '0:48',
      ipAddress: '63.155.38.243',
      consentVersion: 'v2026-07a',
      videoFormat: 'Screen recording',
    },
    lead_submitted_at: '2026-06-28T04:10:56.000Z',
    video_generated_at: '2026-06-28T04:10:56.000Z',
    completed_at_utc: '2026-06-28T04:10:56.000Z',
    status: 'generated' as const,
  },
  {
    cert_uuid: '17c9e2d5-6a3b-4127-8e9f-0ab3d65f7c98',
    lead_id: 'lead_003',
    recording_url: '/videos/rec3.mp4',
    idempotency_key: 'seed_cert_rec3',
    lead_data: {
      fullName: 'Ashley Rodriguez',
      firstName: 'Ashley',
      lastName: 'Rodriguez',
      email: 'ashley@buddingrosesphotography.com',
      phone: '9082977199',
      taxDebtAmount: 'Not sure',
      signedDate: 'Jun 23, 2026 · 04:11 UTC',
      signedDateISO: '2026-06-23T04:11:54.000Z',
      dateOfVisit: 'June 23, 2026',
      timeOfVisit: '04:11:54 UTC',
      duration: '0:50',
      ipAddress: '68.239.224.180',
      consentVersion: 'v2026-07a',
      videoFormat: 'Screen recording',
    },
    lead_submitted_at: '2026-06-23T04:11:54.000Z',
    video_generated_at: '2026-06-23T04:11:54.000Z',
    completed_at_utc: '2026-06-23T04:11:54.000Z',
    status: 'generated' as const,
  },
];

async function seedCertificates() {
  console.log('🌱 Starting certificate seeding...\n');

  try {
    // Get the first company (myrpmcare) as the default company
    const company = await getCompanyByKey('myrpmcare');

    if (!company) {
      console.error('❌ Error: Company "myrpmcare" not found.');
      console.error('   Please run the company seed SQL first:');
      console.error('   Execute supabase/seed.sql in your Supabase dashboard\n');
      process.exit(1);
    }

    console.log(`✓ Found company: ${company.company_name} (${company.id})\n`);

    let created = 0;
    let skipped = 0;

    for (const cert of DUMMY_CERTIFICATES) {
      try {
        const input: CreateCertificateInput = {
          cert_uuid: cert.cert_uuid,
          company_id: company.id,
          source_system: 'manual_seed',
          lead_id: cert.lead_id,
          lead_data: cert.lead_data,
          recording_url: cert.recording_url,
          recording_type: 'reconstructed_historical_recording',
          lead_submitted_at: cert.lead_submitted_at,
          video_generated_at: cert.video_generated_at,
          completed_at_utc: cert.completed_at_utc,
          idempotency_key: cert.idempotency_key,
          status: cert.status,
        };

        const result = await createCertificate(input);
        console.log(`✓ Created certificate: ${result.cert_uuid} (${cert.lead_data.fullName})`);
        created++;
      } catch (error: any) {
        if (error.message?.includes('duplicate') || error.code === '23505') {
          console.log(`⊘ Skipped certificate: ${cert.cert_uuid} (already exists)`);
          skipped++;
        } else {
          console.error(`✗ Failed to create certificate ${cert.cert_uuid}:`, error.message);
        }
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${DUMMY_CERTIFICATES.length}`);
    console.log('\n✅ Certificate seeding completed!\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seed function
seedCertificates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
