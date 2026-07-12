/**
 * MyRPMCare Video Automation - Local Simulation
 *
 * This script simulates the MyRPMCare video automation workflow:
 * 1. Load historical lead data
 * 2. Recreate form process
 * 3. Generate video recording
 * 4. Upload video to storage
 * 5. Get final video URL
 * 6. *** CREATE CERTIFICATE via Eperkins API ***
 * 7. Store certificate data
 *
 * Run with: npm run myrpmcare:generate-video
 */

import 'dotenv/config';
import { createCertificateSafe } from '../lib/certificate-client';
import { logCertificateResult } from '../lib/certificate-logging';
import { getCurrentISODateTime } from '../lib/certificate-client';

// ========================================================================
// CONFIGURATION
// ========================================================================

const COMPANY_KEY = 'myrpmcare';
const SOURCE_SYSTEM = 'myrpmcare-video-automation';
const WEBSITE = 'myrpmcare.com';

// Validate environment
if (!process.env.CERTIFICATE_API_URL) {
  console.error('ERROR: CERTIFICATE_API_URL not configured');
  console.error('Add to .env.local: CERTIFICATE_API_URL=http://localhost:3000');
  process.exit(1);
}

if (!process.env.MYRPMCARE_CERT_API_KEY) {
  console.error('ERROR: MYRPMCARE_CERT_API_KEY not configured');
  console.error('Add to .env.local: MYRPMCARE_CERT_API_KEY=dev_key_myrpmcare_12345');
  process.exit(1);
}

// ========================================================================
// TYPES
// ========================================================================

interface HistoricalLead {
  lead_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  tax_debt_amount?: string;
  form_answers: Record<string, unknown>;
  submitted_at: string; // ISO 8601
  ip_address?: string;
}

interface VideoRecording {
  recording_id: string;
  recording_url: string;
  storage_path: string;
  duration: string;
  format: string;
  generated_at: string; // ISO 8601
}

interface AutomationResult {
  success: boolean;
  lead: HistoricalLead;
  video?: VideoRecording;
  certificate?: {
    success: boolean;
    cert_uuid?: string;
    certificate_url?: string;
    duplicate?: boolean;
    status?: string;
    error?: string;
  };
  error?: string;
}

// ========================================================================
// HISTORICAL LEAD DATA (from MyRPMCare system)
// ========================================================================

const HISTORICAL_LEADS: HistoricalLead[] = [
  {
    lead_id: 'lead-myrpm-20260629-001',
    first_name: 'Shridhar',
    last_name: 'Ratnam',
    email: 'shridhar.ratnam@gmail.com',
    phone: '7189005959',
    tax_debt_amount: 'Not sure',
    form_answers: {
      question_1: 'How much do you owe in back taxes?',
      answer_1: 'Not sure',
      question_2: 'What state are you in?',
      answer_2: 'New York',
    },
    submitted_at: '2026-06-29T04:09:11.000Z',
    ip_address: '158.59.127.249',
  },
  {
    lead_id: 'lead-myrpm-20260628-002',
    first_name: 'Gary',
    last_name: 'Polsley',
    email: 'richkelleigh@aol.com',
    phone: '5033185255',
    tax_debt_amount: 'Not sure',
    form_answers: {
      question_1: 'How much do you owe in back taxes?',
      answer_1: 'Not sure',
      question_2: 'What state are you in?',
      answer_2: 'Oregon',
    },
    submitted_at: '2026-06-28T04:10:07.000Z',
    ip_address: '63.155.38.243',
  },
  {
    lead_id: 'lead-myrpm-20260623-003',
    first_name: 'Ashley',
    last_name: 'Rodriguez',
    email: 'ashley@buddingrosesphotography.com',
    phone: '9082977199',
    tax_debt_amount: 'Not sure',
    form_answers: {
      question_1: 'How much do you owe in back taxes?',
      answer_1: 'Not sure',
      question_2: 'What state are you in?',
      answer_2: 'New Jersey',
    },
    submitted_at: '2026-06-23T04:11:04.000Z',
    ip_address: '68.239.224.180',
  },
];

// ========================================================================
// STEP 1: LOAD HISTORICAL LEAD
// ========================================================================

function loadHistoricalLead(leadId?: string): HistoricalLead {
  if (leadId) {
    const lead = HISTORICAL_LEADS.find((l) => l.lead_id === leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${leadId}`);
    }
    return lead;
  }

  // Use first lead by default
  return HISTORICAL_LEADS[0];
}

// ========================================================================
// STEP 2: RECREATE FORM PROCESS (SIMULATION)
// ========================================================================

async function recreateFormProcess(lead: HistoricalLead): Promise<void> {
  console.log('📝 Recreating form submission process...');
  console.log(`   Lead ID: ${lead.lead_id}`);
  console.log(`   Name: ${lead.first_name} ${lead.last_name}`);
  console.log(`   Email: ${lead.email}`);
  console.log(`   Phone: ${lead.phone}`);
  console.log(`   Original submission: ${lead.submitted_at}`);

  // Simulate form replay
  await sleep(500);
  console.log('   ✓ Form process recreated');
}

// ========================================================================
// STEP 3: GENERATE VIDEO RECORDING (SIMULATION)
// ========================================================================

async function generateVideoRecording(lead: HistoricalLead): Promise<VideoRecording> {
  console.log('\n🎬 Generating video recording...');

  // Simulate video generation
  await sleep(1000);

  const timestamp = Date.now();
  const recording: VideoRecording = {
    recording_id: `rec-myrpm-${timestamp}`,
    recording_url: '', // Will be set after upload
    storage_path: '',  // Will be set after upload
    duration: '0:49',
    format: 'screen_recording',
    generated_at: getCurrentISODateTime(),
  };

  console.log(`   ✓ Video generated`);
  console.log(`   Recording ID: ${recording.recording_id}`);
  console.log(`   Duration: ${recording.duration}`);
  console.log(`   Generated at: ${recording.generated_at}`);

  return recording;
}

// ========================================================================
// STEP 4: UPLOAD VIDEO TO STORAGE (SIMULATION)
// ========================================================================

async function uploadVideoToStorage(
  lead: HistoricalLead,
  recording: VideoRecording
): Promise<VideoRecording> {
  console.log('\n☁️  Uploading video to cloud storage...');

  // Simulate upload
  await sleep(800);

  // Simulate GCP Storage URL
  const storagePath = `/myrpmcare/recordings/${recording.recording_id}.mp4`;
  const publicUrl = `https://storage.googleapis.com/myrpmcare-videos${storagePath}`;

  recording.storage_path = storagePath;
  recording.recording_url = publicUrl;

  console.log('   ✓ Upload complete');
  console.log(`   Storage path: ${storagePath}`);
  console.log(`   Public URL: ${publicUrl}`);

  return recording;
}

// ========================================================================
// STEP 5: CREATE CERTIFICATE (EPERKINS API INTEGRATION)
// ========================================================================

async function createCertificate(
  lead: HistoricalLead,
  recording: VideoRecording
): Promise<AutomationResult['certificate']> {
  console.log('\n📜 Creating certificate via Eperkins API...');
  console.log(`   API URL: ${process.env.CERTIFICATE_API_URL}`);
  console.log(`   Company: ${COMPANY_KEY}`);

  // Build idempotency key (stable across retries)
  const idempotency_key = `${COMPANY_KEY}-${lead.lead_id}-${recording.recording_id}`;

  // Call certificate API
  const result = await createCertificateSafe(
    {
      company_key: COMPANY_KEY,
      source_system: SOURCE_SYSTEM,
      website: WEBSITE,
      lead_id: lead.lead_id,
      lead_data: {
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        tax_debt_amount: lead.tax_debt_amount,
        form_answers: lead.form_answers,
        ip_address: lead.ip_address,
      },
      recording_id: recording.recording_id,
      recording_url: recording.recording_url,
      recording_storage_path: recording.storage_path,
      recording_type: 'reconstructed_historical_recording',
      lead_submitted_at: lead.submitted_at,
      video_generated_at: recording.generated_at,
      idempotency_key,
    },
    {
      apiUrl: process.env.CERTIFICATE_API_URL!,
      apiKey: process.env.MYRPMCARE_CERT_API_KEY!,
      timeout: 30000,
      maxRetries: 3,
    }
  );

  // Log result (safe fields only)
  logCertificateResult(COMPANY_KEY, lead.lead_id, recording.recording_id, result);

  if (result.success) {
    console.log('   ✓ Certificate created successfully');
    console.log(`   UUID: ${result.certificate.cert_uuid}`);
    console.log(`   URL: ${result.certificate.certificate_url}`);
    console.log(`   Status: ${result.certificate.status}`);
    console.log(`   Duplicate: ${result.duplicate ? 'Yes' : 'No'}`);

    return {
      success: true,
      cert_uuid: result.certificate.cert_uuid,
      certificate_url: result.certificate.certificate_url,
      duplicate: result.duplicate,
      status: result.certificate.status,
    };
  } else {
    console.warn('   ⚠ Certificate creation failed');
    console.warn(`   Error: ${result.error}`);

    return {
      success: false,
      error: result.error,
    };
  }
}

// ========================================================================
// STEP 6: STORE CERTIFICATE DATA (SIMULATION)
// ========================================================================

async function storeCertificateData(
  lead: HistoricalLead,
  recording: VideoRecording,
  certificate: AutomationResult['certificate']
): Promise<void> {
  console.log('\n💾 Storing certificate data...');

  if (certificate?.success) {
    // In real implementation, store to MyRPMCare database
    console.log('   ✓ Certificate data stored');
    console.log(`   Lead ID: ${lead.lead_id}`);
    console.log(`   Recording ID: ${recording.recording_id}`);
    console.log(`   Certificate UUID: ${certificate.cert_uuid}`);
    console.log(`   Certificate URL: ${certificate.certificate_url}`);
  } else {
    console.log('   ⚠ Certificate creation failed - storing error state');
    console.log(`   Lead ID: ${lead.lead_id}`);
    console.log(`   Recording ID: ${recording.recording_id}`);
    console.log(`   Error: ${certificate?.error || 'Unknown error'}`);
  }
}

// ========================================================================
// MAIN WORKFLOW
// ========================================================================

async function runMyRPMCareAutomation(leadId?: string): Promise<AutomationResult> {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  MyRPMCare Video Automation                                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Load historical lead
    console.log('📋 Step 1: Load Historical Lead');
    console.log('─────────────────────────────────────────────────────────────────');
    const lead = loadHistoricalLead(leadId);
    console.log('   ✓ Lead loaded from MyRPMCare system\n');

    // Step 2: Recreate form process
    console.log('📝 Step 2: Recreate Form Process');
    console.log('─────────────────────────────────────────────────────────────────');
    await recreateFormProcess(lead);

    // Step 3: Generate video
    console.log('\n🎬 Step 3: Generate Video Recording');
    console.log('─────────────────────────────────────────────────────────────────');
    const recording = await generateVideoRecording(lead);

    // Step 4: Upload video
    console.log('\n☁️  Step 4: Upload Video to Storage');
    console.log('─────────────────────────────────────────────────────────────────');
    await uploadVideoToStorage(lead, recording);

    // Step 5: Create certificate (INTEGRATION POINT)
    console.log('\n📜 Step 5: Create Certificate (Eperkins API)');
    console.log('─────────────────────────────────────────────────────────────────');
    const certificate = await createCertificate(lead, recording);

    // Step 6: Store certificate data
    console.log('\n💾 Step 6: Store Certificate Data');
    console.log('─────────────────────────────────────────────────────────────────');
    await storeCertificateData(lead, recording, certificate);

    // Success
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  WORKFLOW COMPLETED SUCCESSFULLY                              ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('✅ Video generated and uploaded');
    console.log(`   Recording ID: ${recording.recording_id}`);
    console.log(`   Video URL: ${recording.recording_url}`);
    console.log('');

    if (certificate?.success) {
      console.log('✅ Certificate created');
      console.log(`   Certificate UUID: ${certificate.cert_uuid}`);
      console.log(`   Certificate URL: ${certificate.certificate_url}`);
      console.log(`   Duplicate: ${certificate.duplicate ? 'Yes (already exists)' : 'No (newly created)'}`);
      console.log('');
      console.log('🌐 View certificate:');
      console.log(`   ${certificate.certificate_url}`);
    } else {
      console.log('⚠️  Certificate creation failed (non-blocking)');
      console.log(`   Video succeeded, but certificate pending`);
      console.log(`   Error: ${certificate?.error || 'Unknown error'}`);
    }

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    return {
      success: true,
      lead,
      video: recording,
      certificate,
    };
  } catch (error) {
    console.error('\n❌ WORKFLOW FAILED');
    console.error(error);

    return {
      success: false,
      lead: loadHistoricalLead(leadId),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCurrentISODateTime(): string {
  return new Date().toISOString();
}

// ========================================================================
// CLI INTERFACE
// ========================================================================

async function main() {
  const leadId = process.argv[2]; // Optional: specify lead ID

  if (leadId && !HISTORICAL_LEADS.find((l) => l.lead_id === leadId)) {
    console.error(`Error: Lead not found: ${leadId}`);
    console.error('\nAvailable leads:');
    HISTORICAL_LEADS.forEach((lead) => {
      console.error(`  - ${lead.lead_id} (${lead.first_name} ${lead.last_name})`);
    });
    process.exit(1);
  }

  const result = await runMyRPMCareAutomation(leadId);

  if (!result.success) {
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ FATAL ERROR');
    console.error(error);
    process.exit(1);
  });
}

// Export for testing
export {
  runMyRPMCareAutomation,
  loadHistoricalLead,
  recreateFormProcess,
  generateVideoRecording,
  uploadVideoToStorage,
  createCertificate,
  storeCertificateData,
  HISTORICAL_LEADS,
};
