# Certificate Creation API Documentation

## Overview

The Certificate Creation API allows automation apps to create certificate records after video generation. This API is designed for server-to-server communication with robust security, validation, and idempotency features.

## Endpoint

```
POST /api/certificates/create
```

**Base URL**: Production URL will be provided separately

**Content-Type**: `application/json`

## Authentication

All requests require API key authentication via the `X-API-Key` header.

```
X-API-Key: your-secret-api-key-here
```

Each automation app has its own unique API key that maps to a specific company:

| Company Key | Description |
|------------|-------------|
| `myrpmcare` | MyRPMCare automation app |
| `cacophiney` | Cacophiney automation app |
| `thegoodnews360` | TheGoodNews360 automation app |
| `fourth_site` | Fourth site automation app |

**Important Security Notes**:
- API keys are secret credentials - never expose them in client-side code
- Store API keys securely in environment variables
- The API key must match the `company_key` in the request payload
- Use HTTPS for all production requests

## Request Payload

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `company_key` | string | Company identifier (must match API key) |
| `source_system` | string | Name of automation app making the request |
| `lead_id` | string | Unique identifier for the lead in your system |
| `lead_data` | object | Lead information (see Lead Data section) |
| `recording_id` | string | Unique identifier for the video recording |
| `recording_url` | string | Public URL where video can be accessed (must be valid URL) |
| `lead_submitted_at` | string | ISO 8601 datetime when lead was submitted |
| `video_generated_at` | string | ISO 8601 datetime when video was generated |
| `idempotency_key` | string | Unique key for idempotent requests (see Idempotency section) |

### Optional Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `website` | string | Website associated with the lead | - |
| `recording_storage_path` | string | Internal storage path for the video | - |
| `recording_type` | string | Type of recording | `"reconstructed_historical_recording"` |

### Lead Data Object

The `lead_data` object contains contact information and form answers. All fields are optional:

```json
{
  "first_name": "string",
  "last_name": "string",
  "email": "email@example.com",
  "phone": "555-0123",
  "form_answers": {
    "custom_field_1": "value",
    "custom_field_2": "value"
  }
}
```

**Notes**:
- Email must be a valid email format if provided
- `form_answers` can contain any custom fields your automation app collects
- Additional fields beyond the schema are allowed (passthrough)

### Validation Rules

- `company_key` must contain only lowercase letters, numbers, hyphens, and underscores
- `recording_url` must be a valid URL format
- `lead_submitted_at` and `video_generated_at` must be valid ISO 8601 datetime strings
- All required fields must be non-empty strings

## Example Request

```bash
curl -X POST https://your-domain.com/api/certificates/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-api-key-here" \
  -d '{
    "company_key": "myrpmcare",
    "source_system": "myrpmcare-automation",
    "lead_id": "lead-12345",
    "lead_data": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "555-0123",
      "form_answers": {
        "question_1": "Answer to question 1",
        "question_2": "Answer to question 2"
      }
    },
    "recording_id": "rec-67890",
    "recording_url": "https://storage.example.com/videos/rec-67890.mp4",
    "recording_storage_path": "/storage/videos/rec-67890.mp4",
    "recording_type": "reconstructed_historical_recording",
    "lead_submitted_at": "2025-01-15T10:30:00Z",
    "video_generated_at": "2025-01-15T10:35:00Z",
    "idempotency_key": "myrpmcare-lead-12345-rec-67890"
  }'
```

## Response Formats

### Success - New Certificate Created (201)

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
    "certificate_url": "https://your-domain.com/certificates/550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**HTTP Status**: `201 Created`

### Success - Duplicate Request (200)

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
    "certificate_url": "https://your-domain.com/certificates/550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**HTTP Status**: `200 OK`

**Note**: This response indicates the request was processed successfully but a certificate with the same `idempotency_key` already exists.

### Error - Missing or Invalid API Key (401)

```json
{
  "success": false,
  "error": "Missing API key"
}
```

```json
{
  "success": false,
  "error": "Invalid API key"
}
```

**HTTP Status**: `401 Unauthorized`

### Error - Invalid Request Payload (400)

```json
{
  "success": false,
  "error": "Invalid request payload",
  "errors": [
    {
      "field": "company_key",
      "message": "company_key is required"
    },
    {
      "field": "recording_url",
      "message": "recording_url must be a valid URL"
    }
  ]
}
```

**HTTP Status**: `400 Bad Request`

### Error - Company/API Key Mismatch (403)

```json
{
  "success": false,
  "error": "API key does not match company_key in request"
}
```

**HTTP Status**: `403 Forbidden`

**Note**: This occurs when the API key belongs to one company but the request payload specifies a different `company_key`.

### Error - Company Not Found (404)

```json
{
  "success": false,
  "error": "Company not found"
}
```

**HTTP Status**: `404 Not Found`

### Error - Company Inactive (403)

```json
{
  "success": false,
  "error": "Company is not active"
}
```

**HTTP Status**: `403 Forbidden`

### Error - Duplicate Key Conflict (409)

```json
{
  "success": false,
  "error": "Certificate already exists"
}
```

**HTTP Status**: `409 Conflict`

**Note**: This rare error occurs when a duplicate idempotency key is detected but the existing record cannot be retrieved (should not happen in normal operation).

### Error - Internal Server Error (500)

```json
{
  "success": false,
  "error": "Internal server error"
}
```

**HTTP Status**: `500 Internal Server Error`

## Idempotency

The API implements idempotency to prevent duplicate certificate creation when requests are retried.

### How It Works

1. Include a unique `idempotency_key` in your request
2. If the request succeeds, the certificate is created
3. If you retry with the same `idempotency_key`, you'll receive the existing certificate
4. The second response will have `duplicate: true` and status `200 OK` instead of `201 Created`

### Idempotency Key Guidelines

**Best Practices**:
- Use a deterministic key based on your data: `${company_key}-${lead_id}-${recording_id}`
- The key should uniquely identify the lead/recording combination
- Reuse the same key when retrying failed requests
- Use a new key for genuinely new certificates

**Example Keys**:
```
myrpmcare-lead-12345-rec-67890
cacophiney-lead-abc-rec-xyz
thegoodnews360-lead-999-rec-888
```

**What Happens**:
- If network fails or times out, retry with the same key
- If the first request succeeded, the retry returns the existing certificate
- No duplicate certificates are created
- You always get a valid certificate back

### Race Condition Handling

The API handles concurrent requests with the same idempotency key:
- First request creates the certificate
- Second concurrent request receives the duplicate response
- Both requests succeed without creating duplicates

## Security Features

1. **Timing-Safe Comparison**: API key validation uses timing-safe comparison to prevent timing attacks

2. **No Secret Exposure**: Error messages never expose configured API keys or internal details

3. **Company Validation**:
   - Company must exist in database
   - Company must be active (`is_active = true`)
   - API key must match the company in the request

4. **Safe Logging**: Server logs only safe fields (company_key, lead_id, recording_id, result)
   - PII data (email, phone, full lead_data) is never logged
   - API keys are never logged

5. **HTTPS Required**: Use HTTPS for all production requests

## Rate Limiting

Currently no rate limiting is implemented. This may be added in future versions.

## Certificate Viewing

After creation, certificates are immediately viewable at:

```
{certificate_url}
```

Example: `https://your-domain.com/certificates/550e8400-e29b-41d4-a716-446655440000`

The certificate page displays:
- Lead contact information (if provided)
- Video recording player
- Company branding
- Completion details

## Testing

### Development Script

A test script is provided for development testing:

```bash
npm run test:certificate-api
```

This script:
- Sends two requests with the same idempotency key
- Verifies the first creates a certificate (201)
- Verifies the second returns duplicate (200)
- Displays detailed test results

### Manual Testing

1. Start the development server:
```bash
npm run dev
```

2. Use curl or Postman to send test requests:
```bash
curl -X POST http://localhost:3000/api/certificates/create \
  -H "Content-Type: application/json" \
  -H "X-API-Key: dev_key_myrpmcare_12345" \
  -d @test-payload.json
```

### Test Checklist

- [ ] Valid request creates certificate (201)
- [ ] Duplicate idempotency_key returns existing certificate (200)
- [ ] Missing API key returns 401
- [ ] Invalid API key returns 401
- [ ] Mismatched company_key returns 403
- [ ] Invalid payload returns 400 with field errors
- [ ] Missing required fields returns 400
- [ ] Invalid URL format returns 400
- [ ] Invalid datetime format returns 400
- [ ] Inactive company returns 403
- [ ] Non-existent company returns 404
- [ ] Certificate appears on viewer page immediately

## Support

For API issues or questions:
- Check this documentation first
- Review error messages for specific validation errors
- Verify API key configuration
- Ensure company exists and is active in the database

## Changelog

### Version 1.0 (Initial Release)
- Certificate creation endpoint
- API key authentication
- Payload validation with Zod
- Idempotency support
- Company validation
- Safe error handling and logging
