/**
 * Automation Integration Test Script
 *
 * Simulates the full automation app integration flow:
 * 1. Lead submitted
 * 2. Video generated
 * 3. Video uploaded
 * 4. Certificate created
 * 5. Certificate stored
 * 6. Duplicate request (idempotency test)
 *
 * Usage:
 *   npm run test:automation-integration
 */

import 'dotenv/config';
import { createCertificateSafe } from '../lib/certificate-client';
import { logCertificateResult } from '../lib/certificate-logging';
import { getCurrentISODateTime } from '../lib/build-certificate-payload';

// Validate environment
if (!process.env.CERTIFICATE_API_URL) {
  console.error('ERROR: CERTIFICATE_API_URL not found in environment');
  process.exit(1);
}

if (!process.env.MYRPMCARE_CERT_API_KEY) {
  console.error('ERROR: MYRPMCARE_CERT_API_KEY not found in environment');
  process.exit(1);
}

/**
 * Simulate video generation workflow
 */
async function simulateAutomationWorkflow() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  AUTOMATION INTEGRATION TEST                                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const timestamp = Date.now();
  const company_key = 'myrpmcare';
  const lead_id = `test-lead-${timestamp}`;
  const recording_id = `test-rec-${timestamp}`;

  // Step 1: Simulate lead submission
  console.log('📝 Step 1: Lead Submitted');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(`Lead ID: ${lead_id}`);
  console.log('Lead Data:');
  console.log('  Name: John Doe');
  console.log('  Email: john.doe@example.com');
  console.log('  Phone: 555-0123');
  console.log('');

  // Step 2: Simulate video generation
  console.log('🎬 Step 2: Video Generation');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('Generating video from lead data...');
  await sleep(500);
  console.log('✓ Video generated successfully');
  console.log(`  Recording ID: ${recording_id}`);
  console.log('');

  // Step 3: Simulate video upload
  console.log('☁️  Step 3: Video Upload');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('Uploading video to storage...');
  await sleep(500);
  const videoUrl = `https://storage.example.com/videos/${recording_id}.mp4`;
  console.log('✓ Video uploaded successfully');
  console.log(`  URL: ${videoUrl}`);
  console.log('');

  // Step 4: Create certificate (FIRST REQUEST)
  console.log('📜 Step 4: Certificate Creation (FIRST REQUEST)');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('Calling certificate API...');

  const leadSubmittedAt = new Date(timestamp - 300000).toISOString(); // 5 min ago
  const videoGeneratedAt = getCurrentISODateTime();

  const result1 = await createCertificateSafe(
    {
      company_key,
      source_system: 'myrpmcare-automation-test',
      lead_id,
      lead_data: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0123',
        form_answers: {
          question_1: 'Test answer 1',
          question_2: 'Test answer 2',
        },
      },
      recording_id,
      recording_url: videoUrl,
      recording_storage_path: `/videos/${recording_id}.mp4`,
      recording_type: 'reconstructed_historical_recording',
      lead_submitted_at: leadSubmittedAt,
      video_generated_at: videoGeneratedAt,
      idempotency_key: `${company_key}-${lead_id}-${recording_id}`,
    },
    {
      apiUrl: process.env.CERTIFICATE_API_URL!,
      apiKey: process.env.MYRPMCARE_CERT_API_KEY!,
      timeout: 30000,
      maxRetries: 3,
    }
  );

  // Log result (safe fields only)
  logCertificateResult(company_key, lead_id, recording_id, result1);

  if (result1.success) {
    console.log('✓ Certificate created successfully');
    console.log(`  UUID: ${result1.certificate.cert_uuid}`);
    console.log(`  URL: ${result1.certificate.certificate_url}`);
    console.log(`  Status: ${result1.certificate.status}`);
    console.log(`  Duplicate: ${result1.duplicate}`);
  } else {
    console.error('✗ Certificate creation failed');
    console.error(`  Error: ${result1.error}`);
    if (result1.details) {
      console.error('  Details:', result1.details);
    }
  }
  console.log('');

  // Step 5: Store certificate data
  console.log('💾 Step 5: Store Certificate Data');
  console.log('─────────────────────────────────────────────────────────────────');
  if (result1.success) {
    console.log('Storing certificate data in automation app database...');
    await sleep(200);
    console.log('✓ Certificate data stored');
    console.log(`  Lead ID: ${lead_id}`);
    console.log(`  Cert UUID: ${result1.certificate.cert_uuid}`);
    console.log(`  Cert URL: ${result1.certificate.certificate_url}`);
  } else {
    console.log('⚠ Certificate creation failed - storing error state');
    await sleep(200);
    console.log('✓ Error state logged');
  }
  console.log('');

  // Step 6: Test idempotency (DUPLICATE REQUEST)
  console.log('🔁 Step 6: Test Idempotency (DUPLICATE REQUEST)');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('Sending same request again (simulating retry)...');

  const result2 = await createCertificateSafe(
    {
      company_key,
      source_system: 'myrpmcare-automation-test',
      lead_id,
      lead_data: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0123',
        form_answers: {
          question_1: 'Test answer 1',
          question_2: 'Test answer 2',
        },
      },
      recording_id,
      recording_url: videoUrl,
      recording_storage_path: `/videos/${recording_id}.mp4`,
      recording_type: 'reconstructed_historical_recording',
      lead_submitted_at: leadSubmittedAt,
      video_generated_at: videoGeneratedAt,
      idempotency_key: `${company_key}-${lead_id}-${recording_id}`,
    },
    {
      apiUrl: process.env.CERTIFICATE_API_URL!,
      apiKey: process.env.MYRPMCARE_CERT_API_KEY!,
      timeout: 30000,
      maxRetries: 3,
    }
  );

  // Log result
  logCertificateResult(company_key, lead_id, recording_id, result2);

  if (result2.success) {
    console.log('✓ Duplicate request handled successfully');
    console.log(`  UUID: ${result2.certificate.cert_uuid}`);
    console.log(`  URL: ${result2.certificate.certificate_url}`);
    console.log(`  Duplicate: ${result2.duplicate}`);
  } else {
    console.error('✗ Duplicate request failed');
    console.error(`  Error: ${result2.error}`);
  }
  console.log('');

  // Step 7: Validation
  console.log('✅ Step 7: Validation');
  console.log('─────────────────────────────────────────────────────────────────');

  const tests = [
    {
      name: 'First request succeeded',
      passed: result1.success === true,
    },
    {
      name: 'First request created new certificate',
      passed: result1.success && result1.duplicate === false,
    },
    {
      name: 'First request returned cert_uuid',
      passed: result1.success && !!result1.certificate.cert_uuid,
    },
    {
      name: 'First request returned certificate_url',
      passed: result1.success && !!result1.certificate.certificate_url,
    },
    {
      name: 'Second request succeeded',
      passed: result2.success === true,
    },
    {
      name: 'Second request marked as duplicate',
      passed: result2.success && result2.duplicate === true,
    },
    {
      name: 'Both requests returned same cert_uuid',
      passed:
        result1.success &&
        result2.success &&
        result1.certificate.cert_uuid === result2.certificate.cert_uuid,
    },
    {
      name: 'Both requests returned same certificate_url',
      passed:
        result1.success &&
        result2.success &&
        result1.certificate.certificate_url === result2.certificate.certificate_url,
    },
  ];

  let passedCount = 0;
  let failedCount = 0;

  tests.forEach((test, index) => {
    const icon = test.passed ? '✓' : '✗';
    const status = test.passed ? 'PASS' : 'FAIL';
    console.log(`${index + 1}. ${icon} ${test.name} - ${status}`);

    if (test.passed) {
      passedCount++;
    } else {
      failedCount++;
    }
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);

  if (result1.success) {
    console.log('');
    console.log('Certificate Details:');
    console.log(`  UUID: ${result1.certificate.cert_uuid}`);
    console.log(`  URL: ${result1.certificate.certificate_url}`);
    console.log(`  View: ${result1.certificate.certificate_url}`);
  }

  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failedCount === 0) {
    console.log('✅ ALL TESTS PASSED - Integration successful!\n');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED - Review errors above\n');
    process.exit(1);
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run test
simulateAutomationWorkflow().catch(error => {
  console.error('\n❌ TEST FAILED WITH EXCEPTION\n');
  console.error(error);
  process.exit(1);
});
