/**
 * Mock Automation Integration Example
 *
 * This file demonstrates how an automation app should integrate with the
 * certificate creation API.
 *
 * INTEGRATION FLOW:
 *
 * 1. Lead submitted to automation app
 * 2. Video generation starts
 * 3. Video is generated successfully
 * 4. Video is uploaded to storage
 * 5. Video URL is available
 * 6. *** CALL CERTIFICATE API HERE ***
 * 7. Store certificate data (cert_uuid, certificate_url)
 * 8. Continue with automation workflow
 *
 * IMPORTANT:
 * - Do NOT call the certificate API before video upload completes
 * - Do NOT fail video generation if certificate creation fails
 * - DO log certificate errors for monitoring
 * - DO store certificate data when successful
 */

import { createCertificateSafe } from '../lib/certificate-client';
import { logCertificateResult, createCertificateWarning } from '../lib/certificate-logging';
import { getCurrentISODateTime } from '../lib/build-certificate-payload';

/**
 * Mock lead data (what the automation app collects)
 */
interface LeadData {
  lead_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  form_answers: Record<string, unknown>;
  submitted_at: string;
}

/**
 * Mock video data (after video generation and upload)
 */
interface VideoData {
  recording_id: string;
  recording_url: string;
  storage_path: string;
  generated_at: string;
}

/**
 * Mock automation app workflow
 *
 * This simulates the typical flow in an automation app:
 * 1. Receive lead
 * 2. Generate video
 * 3. Upload video
 * 4. Create certificate
 * 5. Complete workflow
 */
async function automationWorkflow(
  company_key: string,
  source_system: string,
  lead: LeadData,
  video: VideoData
) {
  console.log('\n========================================');
  console.log('AUTOMATION WORKFLOW STARTING');
  console.log('========================================');
  console.log(`Company: ${company_key}`);
  console.log(`Lead ID: ${lead.lead_id}`);
  console.log(`Recording ID: ${video.recording_id}`);
  console.log('');

  // Step 1: Video generation (already completed in this example)
  console.log('✓ Video generation completed');
  console.log('✓ Video uploaded to storage');
  console.log(`  URL: ${video.recording_url}`);
  console.log('');

  // Step 2: Create certificate
  console.log('Creating certificate...');

  try {
    const result = await createCertificateSafe(
      {
        company_key,
        source_system,
        lead_id: lead.lead_id,
        lead_data: {
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
          form_answers: lead.form_answers,
        },
        recording_id: video.recording_id,
        recording_url: video.recording_url,
        recording_storage_path: video.storage_path,
        recording_type: 'reconstructed_historical_recording',
        lead_submitted_at: lead.submitted_at,
        video_generated_at: video.generated_at,
        // Idempotency key will be auto-generated: company-lead-recording
        idempotency_key: `${company_key}-${lead.lead_id}-${video.recording_id}`,
      },
      {
        apiUrl: process.env.CERTIFICATE_API_URL!,
        apiKey: process.env.MYRPMCARE_CERT_API_KEY!,
        timeout: 30000,
        maxRetries: 3,
      }
    );

    // Log result (safe fields only)
    logCertificateResult(company_key, lead.lead_id, video.recording_id, result);

    if (result.success) {
      console.log('✓ Certificate created successfully');
      console.log(`  UUID: ${result.certificate.cert_uuid}`);
      console.log(`  URL: ${result.certificate.certificate_url}`);
      console.log(`  Duplicate: ${result.duplicate ? 'Yes' : 'No'}`);

      // Store certificate data in your database
      await storeCertificateData({
        lead_id: lead.lead_id,
        recording_id: video.recording_id,
        cert_uuid: result.certificate.cert_uuid,
        certificate_url: result.certificate.certificate_url,
        duplicate: result.duplicate,
      });

      console.log('✓ Certificate data stored');
    } else {
      // Certificate creation failed - but video generation succeeded
      console.warn('⚠ Certificate creation failed');
      console.warn(`  Error: ${result.error}`);

      // Log warning but continue
      const warning = createCertificateWarning(company_key, lead.lead_id);
      console.warn(`  ${warning}`);

      // Optionally store error state
      await storeCertificateError({
        lead_id: lead.lead_id,
        recording_id: video.recording_id,
        error: result.error,
      });
    }
  } catch (error) {
    // Unexpected error - should not happen with createCertificateSafe
    console.error('✗ Unexpected error in certificate creation');
    console.error(error);
  }

  console.log('');
  console.log('========================================');
  console.log('AUTOMATION WORKFLOW COMPLETED');
  console.log('========================================');
  console.log('Video generation: SUCCESS');
  console.log('Video upload: SUCCESS');
  console.log('Certificate creation: ' + (result.success ? 'SUCCESS' : 'FAILED (non-blocking)'));
  console.log('========================================\n');
}

/**
 * Store certificate data in automation app database
 *
 * This is where you would save the certificate UUID and URL
 * to your automation app's database.
 */
async function storeCertificateData(data: {
  lead_id: string;
  recording_id: string;
  cert_uuid: string;
  certificate_url: string;
  duplicate: boolean;
}): Promise<void> {
  // Mock implementation - replace with actual database storage
  console.log('  Storing certificate data in database:', {
    lead_id: data.lead_id,
    recording_id: data.recording_id,
    cert_uuid: data.cert_uuid,
    certificate_url: data.certificate_url,
    duplicate: data.duplicate,
  });

  // Example: await db.leads.update({ lead_id: data.lead_id }, {
  //   cert_uuid: data.cert_uuid,
  //   certificate_url: data.certificate_url,
  // });
}

/**
 * Store certificate error in automation app database
 *
 * Optional: Store error state for monitoring and debugging.
 */
async function storeCertificateError(data: {
  lead_id: string;
  recording_id: string;
  error: string;
}): Promise<void> {
  // Mock implementation - replace with actual error logging
  console.warn('  Storing certificate error:', {
    lead_id: data.lead_id,
    recording_id: data.recording_id,
    error: data.error,
  });

  // Example: await db.certificate_errors.create({
  //   lead_id: data.lead_id,
  //   recording_id: data.recording_id,
  //   error: data.error,
  //   created_at: new Date(),
  // });
}

/**
 * Example: MyRPMCare integration
 */
export async function myrpmcareIntegrationExample() {
  // Simulate lead and video data
  const lead: LeadData = {
    lead_id: 'lead-' + Date.now(),
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0123',
    form_answers: {
      question_1: 'Answer 1',
      question_2: 'Answer 2',
    },
    submitted_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
  };

  const video: VideoData = {
    recording_id: 'rec-' + Date.now(),
    recording_url: 'https://storage.example.com/videos/rec-12345.mp4',
    storage_path: '/videos/rec-12345.mp4',
    generated_at: getCurrentISODateTime(),
  };

  await automationWorkflow('myrpmcare', 'myrpmcare-automation', lead, video);
}

/**
 * Example: Cacophiney integration
 */
export async function cacophineIntegrationExample() {
  const lead: LeadData = {
    lead_id: 'lead-' + Date.now(),
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
    phone: '555-0456',
    form_answers: {
      service_interest: 'Product Demo',
      company_size: '50-100',
    },
    submitted_at: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
  };

  const video: VideoData = {
    recording_id: 'rec-' + Date.now(),
    recording_url: 'https://storage.example.com/videos/rec-67890.mp4',
    storage_path: '/videos/rec-67890.mp4',
    generated_at: getCurrentISODateTime(),
  };

  await automationWorkflow('cacophiney', 'cacophiney-automation', lead, video);
}

/**
 * Main function - run examples
 */
export async function runExamples() {
  console.log('\n\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  AUTOMATION INTEGRATION EXAMPLES');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  // Run MyRPMCare example
  await myrpmcareIntegrationExample();

  console.log('\n');

  // Run Cacophiney example
  await cacophineIntegrationExample();

  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ALL EXAMPLES COMPLETED');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n\n');
}

// Export for use in other files
export { automationWorkflow, storeCertificateData, storeCertificateError };
