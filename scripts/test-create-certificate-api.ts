/**
 * Development Test Script for Certificate Creation API
 *
 * Tests the POST /api/certificates/create endpoint with:
 * - Valid authentication
 * - Proper payload validation
 * - Idempotency behavior (duplicate requests)
 *
 * Usage:
 *   npm run test:certificate-api
 *
 * IMPORTANT: Development server must be running (npm run dev)
 */

import 'dotenv/config';

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_KEY = process.env.CERT_API_KEY_MYRPMCARE;

if (!API_KEY) {
  console.error('ERROR: CERT_API_KEY_MYRPMCARE not found in environment variables');
  process.exit(1);
}

/**
 * Test payload for certificate creation
 */
const testPayload = {
  company_key: 'myrpmcare',
  source_system: 'test-script',
  lead_id: `test-lead-${Date.now()}`,
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
  recording_id: `test-recording-${Date.now()}`,
  recording_url: 'https://example.com/recordings/test-video.mp4',
  recording_storage_path: '/test/recordings/video.mp4',
  recording_type: 'reconstructed_historical_recording',
  lead_submitted_at: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
  video_generated_at: new Date().toISOString(),
  idempotency_key: `test-idempotency-${Date.now()}`,
};

/**
 * Make API request to create certificate
 */
async function createCertificate(requestNumber: number) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`REQUEST #${requestNumber}`);
  console.log('='.repeat(60));
  console.log(`Endpoint: POST ${API_URL}/api/certificates/create`);
  console.log('Headers: X-API-Key: ***[REDACTED]***');
  console.log('\nPayload:');
  console.log(JSON.stringify(testPayload, null, 2));

  try {
    const response = await fetch(`${API_URL}/api/certificates/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY!,
      },
      body: JSON.stringify(testPayload),
    });

    const data = await response.json();

    console.log('\n--- RESPONSE ---');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('\nBody:');
    console.log(JSON.stringify(data, null, 2));

    return { status: response.status, data };
  } catch (error) {
    console.error('\n--- ERROR ---');
    console.error('Failed to make request:', error);
    throw error;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('CERTIFICATE CREATION API TEST');
  console.log('='.repeat(60));
  console.log(`Testing: ${API_URL}/api/certificates/create`);
  console.log(`Company: myrpmcare`);
  console.log('='.repeat(60));

  try {
    // First request - should create new certificate
    const result1 = await createCertificate(1);

    // Second request with same idempotency_key - should return duplicate
    const result2 = await createCertificate(2);

    // Validate results
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60));

    const tests = [
      {
        name: 'Request 1: Status code is 201 (Created)',
        passed: result1.status === 201,
        expected: '201',
        actual: result1.status.toString(),
      },
      {
        name: 'Request 1: Success is true',
        passed: result1.data.success === true,
        expected: 'true',
        actual: result1.data.success?.toString() || 'undefined',
      },
      {
        name: 'Request 1: Duplicate is false',
        passed: result1.data.duplicate === false,
        expected: 'false',
        actual: result1.data.duplicate?.toString() || 'undefined',
      },
      {
        name: 'Request 1: Certificate UUID exists',
        passed: !!result1.data.certificate?.cert_uuid,
        expected: 'UUID string',
        actual: result1.data.certificate?.cert_uuid || 'undefined',
      },
      {
        name: 'Request 1: Certificate URL exists',
        passed: !!result1.data.certificate?.certificate_url,
        expected: 'URL string',
        actual: result1.data.certificate?.certificate_url || 'undefined',
      },
      {
        name: 'Request 2: Status code is 200 (OK)',
        passed: result2.status === 200,
        expected: '200',
        actual: result2.status.toString(),
      },
      {
        name: 'Request 2: Success is true',
        passed: result2.data.success === true,
        expected: 'true',
        actual: result2.data.success?.toString() || 'undefined',
      },
      {
        name: 'Request 2: Duplicate is true',
        passed: result2.data.duplicate === true,
        expected: 'true',
        actual: result2.data.duplicate?.toString() || 'undefined',
      },
      {
        name: 'Request 2: Same certificate UUID',
        passed: result1.data.certificate?.cert_uuid === result2.data.certificate?.cert_uuid,
        expected: result1.data.certificate?.cert_uuid || 'undefined',
        actual: result2.data.certificate?.cert_uuid || 'undefined',
      },
    ];

    let passedCount = 0;
    let failedCount = 0;

    tests.forEach((test, index) => {
      const icon = test.passed ? '✓' : '✗';
      const status = test.passed ? 'PASS' : 'FAIL';
      console.log(`\n${index + 1}. ${icon} ${test.name}`);
      console.log(`   Status: ${status}`);
      if (!test.passed) {
        console.log(`   Expected: ${test.expected}`);
        console.log(`   Actual: ${test.actual}`);
      }

      if (test.passed) {
        passedCount++;
      } else {
        failedCount++;
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log('='.repeat(60));

    if (failedCount === 0) {
      console.log('\n✓ ALL TESTS PASSED');
      console.log('\nCertificate created successfully!');
      console.log(`View at: ${result1.data.certificate?.certificate_url}`);
      process.exit(0);
    } else {
      console.log('\n✗ SOME TESTS FAILED');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ TEST EXECUTION FAILED');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
