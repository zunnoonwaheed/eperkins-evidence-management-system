# Automation App Integration Guide

This guide explains how to integrate video automation applications with the E Perkins certificate creation system.

## Table of Contents

1. [Overview](#overview)
2. [When to Trigger Certificate Creation](#when-to-trigger-certificate-creation)
3. [Integration Flow](#integration-flow)
4. [Setup and Configuration](#setup-and-configuration)
5. [Using the Certificate Client](#using-the-certificate-client)
6. [Payload Structure](#payload-structure)
7. [Response Handling](#response-handling)
8. [Error Handling](#error-handling)
9. [Logging](#logging)
10. [Testing](#testing)
11. [Production Checklist](#production-checklist)

## Overview

The certificate creation system allows automation apps to create certificate records immediately after video generation and upload completion.

**Supported Automation Apps:**
- MyRPMCare
- Cacophiney
- TheGoodNews360
- Fourth Site

**Key Features:**
- Simple HTTP POST integration
- Automatic retry with exponential backoff
- Idempotency (duplicate requests return same certificate)
- Non-blocking (video generation succeeds even if certificate fails)
- Safe error handling
- Structured logging

## When to Trigger Certificate Creation

Certificate creation should be triggered at a specific point in your automation workflow:

```
Lead Submitted
    ↓
Video Generation Starts
    ↓
Video Generated Successfully
    ↓
Video Uploaded to Storage
    ↓
Video URL Available
    ↓
*** CALL CERTIFICATE API HERE ***
    ↓
Store Certificate Data
    ↓
Continue Automation Workflow
```

**IMPORTANT:**
- ✓ DO call the API after video upload completes
- ✓ DO ensure video URL is available
- ✗ DO NOT call the API before video upload
- ✗ DO NOT call the API if video generation failed

## Integration Flow

### High-Level Flow

```typescript
async function processLead(lead, video) {
  // 1. Video already generated and uploaded
  // 2. Create certificate
  const result = await createCertificate(/* ... */);

  // 3. Handle result
  if (result.success) {
    // Store certificate data
    await storeCertificateData({
      cert_uuid: result.certificate.cert_uuid,
      certificate_url: result.certificate.certificate_url,
    });
  } else {
    // Log error but don't fail the workflow
    logError(result.error);
  }

  // 4. Continue with automation
}
```

### Detailed Flow Diagram

```
┌─────────────────────────────────────────┐
│ Automation App                          │
├─────────────────────────────────────────┤
│ 1. Lead received                        │
│ 2. Video generation started             │
│ 3. Video generated ✓                    │
│ 4. Video uploaded ✓                     │
│ 5. Video URL available ✓                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Certificate Client                      │
├─────────────────────────────────────────┤
│ • Build payload                         │
│ • Add API key header                    │
│ • POST to /api/certificates/create      │
│ • Retry on failure (max 3 times)        │
│ • Parse response                        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Certificate API                         │
├─────────────────────────────────────────┤
│ • Authenticate API key                  │
│ • Validate payload                      │
│ • Check idempotency                     │
│ • Create/return certificate             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Response                                │
├─────────────────────────────────────────┤
│ SUCCESS (201 or 200)                    │
│ {                                       │
│   success: true,                        │
│   duplicate: false,                     │
│   certificate: {                        │
│     cert_uuid: "...",                   │
│     certificate_url: "..."              │
│   }                                     │
│ }                                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Automation App                          │
├─────────────────────────────────────────┤
│ • Store cert_uuid                       │
│ • Store certificate_url                 │
│ • Log success                           │
│ • Continue workflow                     │
└─────────────────────────────────────────┘
```

## Setup and Configuration

### 1. Install Dependencies

If using the provided client library:

```bash
# No additional dependencies needed - uses built-in fetch
```

### 2. Environment Variables

Add these to your automation app's `.env` file:

```bash
# Certificate API URL
CERTIFICATE_API_URL=https://your-domain.com

# API Key (use the correct one for your app)
MYRPMCARE_CERT_API_KEY=your-secret-api-key
# OR
CACOPHINEY_CERT_API_KEY=your-secret-api-key
# OR
THEGOODNEWS360_CERT_API_KEY=your-secret-api-key
# OR
FOURTHSITE_CERT_API_KEY=your-secret-api-key
```

**Development:**
```bash
CERTIFICATE_API_URL=http://localhost:3000
MYRPMCARE_CERT_API_KEY=dev_key_myrpmcare_12345
```

**Production:**
```bash
CERTIFICATE_API_URL=https://eperkins-production.com
MYRPMCARE_CERT_API_KEY=prod_key_myrpmcare_secure_random_string
```

### 3. Import Certificate Client

If using TypeScript/Node.js and the provided client library:

```typescript
import { createCertificateSafe } from '@/lib/certificate-client';
import { logCertificateResult } from '@/lib/certificate-logging';
```

If using Python or other languages, see [Custom Implementation](#custom-implementation) below.

## Using the Certificate Client

### Basic Usage

```typescript
import { createCertificateSafe } from '@/lib/certificate-client';

async function createCertificateForLead(lead, video) {
  const result = await createCertificateSafe(
    {
      company_key: 'myrpmcare',
      source_system: 'myrpmcare-automation',
      lead_id: lead.id,
      lead_data: {
        first_name: lead.firstName,
        last_name: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        form_answers: lead.formAnswers,
      },
      recording_id: video.id,
      recording_url: video.url,
      recording_storage_path: video.storagePath,
      recording_type: 'reconstructed_historical_recording',
      lead_submitted_at: lead.submittedAt.toISOString(),
      video_generated_at: video.generatedAt.toISOString(),
      idempotency_key: `myrpmcare-${lead.id}-${video.id}`,
    },
    {
      apiUrl: process.env.CERTIFICATE_API_URL!,
      apiKey: process.env.MYRPMCARE_CERT_API_KEY!,
      timeout: 30000,    // 30 seconds
      maxRetries: 3,     // Retry up to 3 times
    }
  );

  return result;
}
```

### Complete Integration Example

```typescript
async function videoGenerationWorkflow(lead) {
  try {
    // 1. Generate video
    const video = await generateVideo(lead);

    // 2. Upload video
    const uploadedVideo = await uploadVideo(video);

    // 3. Create certificate
    const certificateResult = await createCertificateSafe(
      {
        company_key: 'myrpmcare',
        source_system: 'myrpmcare-automation',
        lead_id: lead.id,
        lead_data: {
          first_name: lead.firstName,
          last_name: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          form_answers: lead.formAnswers,
        },
        recording_id: uploadedVideo.id,
        recording_url: uploadedVideo.url,
        recording_storage_path: uploadedVideo.path,
        recording_type: 'reconstructed_historical_recording',
        lead_submitted_at: lead.submittedAt.toISOString(),
        video_generated_at: new Date().toISOString(),
        idempotency_key: `myrpmcare-${lead.id}-${uploadedVideo.id}`,
      },
      {
        apiUrl: process.env.CERTIFICATE_API_URL!,
        apiKey: process.env.MYRPMCARE_CERT_API_KEY!,
      }
    );

    // 4. Handle certificate result
    if (certificateResult.success) {
      // Store certificate data
      await updateLeadWithCertificate(lead.id, {
        certUuid: certificateResult.certificate.cert_uuid,
        certificateUrl: certificateResult.certificate.certificate_url,
        duplicate: certificateResult.duplicate,
      });

      console.log(`Certificate created: ${certificateResult.certificate.certificate_url}`);
    } else {
      // Log error but don't fail the workflow
      console.warn(`Certificate creation failed: ${certificateResult.error}`);

      // Optionally store error for monitoring
      await logCertificateFailure(lead.id, certificateResult.error);
    }

    // 5. Continue with workflow
    return {
      success: true,
      video: uploadedVideo,
      certificate: certificateResult.success ? certificateResult.certificate : null,
    };

  } catch (error) {
    // Video generation/upload failed - don't create certificate
    console.error('Video workflow failed:', error);
    throw error;
  }
}
```

## Payload Structure

### Required Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `company_key` | string | Company identifier | `"myrpmcare"` |
| `source_system` | string | Automation app name | `"myrpmcare-automation"` |
| `lead_id` | string | Lead identifier | `"lead-12345"` |
| `lead_data` | object | Lead information | `{ first_name: "John", ... }` |
| `recording_id` | string | Video identifier | `"rec-67890"` |
| `recording_url` | string | Public video URL | `"https://storage.../video.mp4"` |
| `lead_submitted_at` | string | Lead submission time (ISO 8601) | `"2025-01-01T10:30:00Z"` |
| `video_generated_at` | string | Video generation time (ISO 8601) | `"2025-01-01T10:35:00Z"` |
| `idempotency_key` | string | Unique request key | `"myrpmcare-lead-12345-rec-67890"` |

### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `website` | string | Lead website | - |
| `recording_storage_path` | string | Internal storage path | - |
| `recording_type` | string | Type of recording | `"reconstructed_historical_recording"` |

### Lead Data Structure

```typescript
{
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  form_answers?: Record<string, unknown>;
  // Additional custom fields allowed
}
```

### Example Payload

```json
{
  "company_key": "myrpmcare",
  "source_system": "myrpmcare-automation",
  "lead_id": "lead-12345",
  "lead_data": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "555-0123",
    "form_answers": {
      "question_1": "Answer 1",
      "question_2": "Answer 2"
    }
  },
  "recording_id": "rec-67890",
  "recording_url": "https://storage.example.com/videos/rec-67890.mp4",
  "recording_storage_path": "/videos/rec-67890.mp4",
  "recording_type": "reconstructed_historical_recording",
  "lead_submitted_at": "2025-01-15T10:30:00Z",
  "video_generated_at": "2025-01-15T10:35:00Z",
  "idempotency_key": "myrpmcare-lead-12345-rec-67890"
}
```

## Response Handling

### Success Response (New Certificate)

**HTTP Status:** `201 Created`

```json
{
  "success": true,
  "duplicate": false,
  "certificate": {
    "cert_uuid": "550e8400-e29b-41d4-a716-446655440000",
    "company_key": "myrpmcare",
    "lead_id": "lead-12345",
    "recording_id": "rec-67890",
    "status": "generated",
    "certificate_url": "https://eperkins.com/certificates/550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Success Response (Duplicate Request)

**HTTP Status:** `200 OK`

```json
{
  "success": true,
  "duplicate": true,
  "certificate": {
    "cert_uuid": "550e8400-e29b-41d4-a716-446655440000",
    "company_key": "myrpmcare",
    "lead_id": "lead-12345",
    "recording_id": "rec-67890",
    "status": "generated",
    "certificate_url": "https://eperkins.com/certificates/550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**What to do:**
- Store the `cert_uuid` and `certificate_url` if not already stored
- Both responses are considered successful
- The `duplicate` flag indicates if this was the first request or a retry

### Error Responses

See [Error Handling](#error-handling) section below.

## Error Handling

### Principles

1. **Video generation NEVER fails due to certificate errors**
2. **Log all certificate errors for monitoring**
3. **Use safe error handling (createCertificateSafe)**
4. **Retry automatically on transient errors**

### Handling Certificate Failures

```typescript
const result = await createCertificateSafe(/* ... */);

if (result.success) {
  // Store certificate data
  await storeCertificateData(result.certificate);
} else {
  // Certificate failed - but video succeeded
  console.warn('Certificate creation failed:', result.error);

  // Log for monitoring
  logCertificateError(lead.id, result.error);

  // Optionally notify team
  await notifyTeam(`Certificate creation failed for lead ${lead.id}`);

  // Continue with workflow - don't throw error
}

// Video workflow continues regardless of certificate result
return { videoSuccess: true, certificateSuccess: result.success };
```

### Common Error Scenarios

| Error | HTTP Status | Cause | Solution |
|-------|-------------|-------|----------|
| Missing API key | 401 | X-API-Key header missing | Check environment variable |
| Invalid API key | 401 | API key doesn't match any company | Verify API key configuration |
| Company mismatch | 403 | API key doesn't match company_key in payload | Ensure API key and company_key match |
| Invalid payload | 400 | Missing or invalid fields | Check payload structure |
| Company not found | 404 | Company doesn't exist in database | Contact E Perkins support |
| Company inactive | 403 | Company is_active = false | Contact E Perkins support |
| Timeout | Timeout | Request took > 30 seconds | Automatic retry |
| Network error | Network | Connection failed | Automatic retry |
| Server error | 500 | Internal server error | Automatic retry |

### Retry Logic

The client automatically retries on these errors:
- Network errors (connection failed, DNS failure, etc.)
- Timeouts (408)
- Rate limiting (429)
- Server errors (500, 502, 503, 504)

**Retry behavior:**
- Max retries: 3 (configurable)
- Exponential backoff: 1s, 2s, 4s, 8s
- Total max time: ~15 seconds (3 retries + delays)

**Non-retryable errors** (fail immediately):
- Authentication errors (401, 403)
- Validation errors (400)
- Not found errors (404)

## Logging

### Safe Logging

**DO log these fields:**
- company_key
- lead_id
- recording_id
- cert_uuid
- duplicate (true/false)
- status (success/error)
- error_type (network, timeout, auth, etc.)
- timestamp

**DO NOT log these fields:**
- email
- phone
- lead_data
- API keys
- Full error messages (may contain sensitive data)

### Using the Logging Helper

```typescript
import { logCertificateResult } from '@/lib/certificate-logging';

const result = await createCertificateSafe(/* ... */);

// Automatically logs safe fields only
logCertificateResult('myrpmcare', lead.id, video.id, result);

// Output:
// [Certificate Integration] {
//   company_key: 'myrpmcare',
//   lead_id: 'lead-12345',
//   recording_id: 'rec-67890',
//   cert_uuid: '550e8400-...',
//   duplicate: false,
//   status: 'success',
//   timestamp: '2025-01-15T10:35:00Z'
// }
```

## Testing

### Local Testing

1. Start the certificate API:
```bash
cd /path/to/eperkins
npm run dev
```

2. Run the integration test:
```bash
npm run test:automation-integration
```

3. Check the output for:
   - ✓ Certificate created successfully
   - ✓ Duplicate request returns same certificate
   - ✓ Video workflow continues on certificate failure

### Manual Testing

```bash
# Test with curl
curl -X POST http://localhost:3000/api/certificates/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev_key_myrpmcare_12345" \
  -d @test-payload.json
```

### Test Checklist

- [ ] Certificate created successfully (201)
- [ ] Duplicate request returns existing certificate (200)
- [ ] cert_uuid and certificate_url are stored
- [ ] Video workflow continues on certificate failure
- [ ] Errors are logged (not thrown)
- [ ] Retry logic works on network errors
- [ ] API key authentication works
- [ ] Payload validation works

## Production Checklist

Before deploying to production:

### Configuration

- [ ] Set production CERTIFICATE_API_URL
- [ ] Set production API keys (secure random strings)
- [ ] Verify API keys match on both sides
- [ ] Test with production API endpoint
- [ ] Verify SSL/TLS certificate valid

### Integration

- [ ] Certificate creation triggered after video upload
- [ ] Video URL is always available before certificate creation
- [ ] Idempotency keys are unique per lead/video
- [ ] Certificate data is stored in automation app database
- [ ] Video workflow never fails due to certificate errors

### Monitoring

- [ ] Certificate success/failure is logged
- [ ] Errors are monitored and alerted
- [ ] Safe fields only in logs (no PII)
- [ ] API keys never logged
- [ ] Certificate URLs are accessible

### Security

- [ ] API keys stored in environment variables
- [ ] API keys never exposed in code
- [ ] API keys never logged
- [ ] HTTPS used in production
- [ ] Payload doesn't contain sensitive data beyond what's needed

## Custom Implementation

If you're not using Node.js/TypeScript, you can implement the certificate client in your language:

### Python Example

```python
import os
import requests
import time

def create_certificate(payload, api_url, api_key, max_retries=3):
    url = f"{api_url}/api/certificates/create"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": api_key
    }

    for attempt in range(max_retries + 1):
        try:
            if attempt > 0:
                # Exponential backoff
                delay = 2 ** (attempt - 1)
                time.sleep(delay)

            response = requests.post(
                url,
                json=payload,
                headers=headers,
                timeout=30
            )

            data = response.json()

            # Success
            if data.get("success"):
                return {
                    "success": True,
                    "duplicate": data.get("duplicate"),
                    "certificate": data.get("certificate")
                }

            # Non-retryable error
            if response.status_code in [400, 401, 403, 404]:
                return {
                    "success": False,
                    "error": data.get("error", "Unknown error")
                }

            # Retryable error - continue loop
            last_error = data.get("error", "Unknown error")

        except requests.exceptions.Timeout:
            last_error = "Request timeout"
        except requests.exceptions.RequestException as e:
            last_error = str(e)

    # All retries exhausted
    return {
        "success": False,
        "error": f"Failed after {max_retries} retries: {last_error}"
    }

# Usage
payload = {
    "company_key": "myrpmcare",
    "source_system": "myrpmcare-automation",
    # ... other fields
}

result = create_certificate(
    payload,
    os.environ["CERTIFICATE_API_URL"],
    os.environ["MYRPMCARE_CERT_API_KEY"]
)

if result["success"]:
    cert_uuid = result["certificate"]["cert_uuid"]
    certificate_url = result["certificate"]["certificate_url"]
    print(f"Certificate created: {certificate_url}")
else:
    print(f"Certificate failed: {result['error']}")
```

## Support

For integration support:
- Review this documentation
- Check the example code in `examples/automation-integration-example.ts`
- Review the certificate API documentation in `docs/CERTIFICATE_API.md`
- Contact the E Perkins development team

## Appendix

### Idempotency Key Format

**Recommended format:**
```
{company_key}-{lead_id}-{recording_id}
```

**Examples:**
- `myrpmcare-lead-12345-rec-67890`
- `cacophiney-lead-abc123-rec-xyz456`
- `thegoodnews360-lead-999-rec-888`

This ensures:
- Uniqueness per lead and recording
- Same key on retries
- Easy debugging

### Company Keys

| Automation App | company_key |
|---------------|-------------|
| MyRPMCare | `myrpmcare` |
| Cacophiney | `cacophiney` |
| TheGoodNews360 | `thegoodnews360` |
| Fourth Site | `fourth_site` |

### Source System Values

Use descriptive names for your automation apps:
- `myrpmcare-automation`
- `cacophiney-automation`
- `thegoodnews360-automation`
- `fourth-site-automation`
