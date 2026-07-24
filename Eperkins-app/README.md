# RPM Care Video Automation with Certificate Integration

This Python automation application generates videos by filling out the RPMCare eligibility form on myrpmcare.com and automatically creates certificates for each successful video generation.

## Overview

The application:
1. Accepts lead data via CSV/Excel upload or single form entry
2. Uses Playwright to automate form filling on the real website
3. Records the form filling process as a video
4. Uploads the video to Google Cloud Storage (optional)
5. **Automatically creates a certificate** via the certificate API
6. Returns both the video URL and certificate details

## Integration Flow

```
Lead Data Input
    ↓
Real Form Automation (Playwright)
    ↓
Video Generation & Recording
    ↓
Video Upload to GCS (optional)
    ↓
Final Video URL Available
    ↓
Certificate API Call ← **CERTIFICATE CREATED HERE**
    ↓
Certificate UUID & URL Returned
    ↓
Results Displayed
```

## Prerequisites

1. **Python 3.8+** installed
2. **Next.js app** running on http://localhost:3000
3. **Supabase** configured in the Next.js app
4. **Google Cloud credentials** (optional, for GCS upload)
5. **FFmpeg** installed (for video conversion)

## Installation

### 1. Install Python Dependencies

```bash
cd Eperkins-app
pip install -r requirements.txt
```

### 2. Install Playwright Browsers

```bash
playwright install chromium
```

### 3. Install FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html

### 4. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Certificate API (Central Eperkins System)
CERTIFICATE_API_URL=https://eperkinslaw.com/api/certificates/create
CERTIFICATE_API_KEY=production_key_myrpmcare_12345

# Company Configuration
COMPANY_KEY=myrpmcare
WEBSITE=myrpmcare.com
SOURCE_SYSTEM=rpm-video-automation

# Google Cloud Storage (optional)
GCS_BUCKET_NAME=your-bucket-name
```

**Important:** The `CERTIFICATE_API_KEY` must match the API key configured in your production environment.

### 5. Configure Google Cloud Storage (Optional)

If using GCS for video storage:

1. Create a GCS bucket
2. Download service account credentials JSON
3. Set the environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
   ```

If not using GCS, videos will be served locally from the `videos/` folder.

## Running the Application

### Start the Next.js App First

```bash
cd /path/to/rpmcare
npm run dev
```

The Next.js app should be running on http://localhost:3000.

### Start the Python Automation App

```bash
cd Eperkins-app
python app.py
```

The Flask app will start on http://localhost:5000.

## Usage

### Single Lead Entry

1. Navigate to http://localhost:5000
2. Fill out the form with lead details
3. Click "Generate Video"
4. The app will:
   - Automate the form filling
   - Record the video
   - Upload to GCS (if configured)
   - **Create a certificate**
   - Display results with video URL and certificate URL

### Bulk Upload (CSV/Excel)

1. Navigate to http://localhost:5000
2. Upload a CSV or Excel file with columns:
   - First Name (required)
   - Last Name (required)
   - Mobile Phone (required)
   - Email (optional)
   - State (required)
   - Has Medicare (required)
   - Ongoing Conditions (optional)
   - Contact Consent (optional)
   - Privacy Terms (optional)
   - Tax Debt Consent (optional)
   - IP Address (optional)
   - Receipt Date (optional - original lead timestamp)

3. The app will process each row and create videos + certificates

## Certificate Integration Details

### When Certificates Are Created

Certificates are created **immediately after** the video is successfully uploaded and the final video URL is available. This ensures all required data is present.

### Certificate Payload

For each lead, the following data is sent to the Certificate API:

```json
{
  "company_key": "myrpmcare",
  "website": "myrpmcare.com",
  "source_system": "rpm-video-automation",
  "lead_id": "lead_abc123",
  "lead_data": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "555-123-4567",
    "form_answers": {
      "state": "CA",
      "has_medicare": "Yes",
      "ongoing_conditions": "High blood pressure",
      "ip_address": "192.168.1.100"
    }
  },
  "recording_id": "rec_xyz789",
  "recording_url": "https://storage.googleapis.com/bucket/video.mp4",
  "recording_storage_path": "gs://bucket/videos/video.mp4",
  "lead_submitted_at": "2024-01-15T10:30:00Z",
  "video_generated_at": "2024-01-16T14:20:00Z",
  "recording_type": "reconstructed_historical_recording",
  "idempotency_key": "myrpmcare:lead_abc123:rec_xyz789"
}
```

### Certificate Response

On success:

```json
{
  "success": true,
  "cert_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "certificate_url": "http://localhost:3000/certificate/550e8400-e29b-41d4-a716-446655440000",
  "duplicate": false,
  "status": "generated"
}
```

If the same lead/recording is processed again (idempotency):

```json
{
  "success": true,
  "cert_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "certificate_url": "http://localhost:3000/certificate/550e8400-e29b-41d4-a716-446655440000",
  "duplicate": true,
  "status": "generated"
}
```

### Error Handling

If certificate creation fails, the video generation is **still considered successful**. The result will include:

```json
{
  "video": {
    "url": "https://...",
    "success": true
  },
  "certificate": {
    "success": false,
    "error": "Connection failed",
    "warning": "Video completed, but certificate creation failed."
  }
}
```

This ensures that video generation failures don't block the automation pipeline.

### Retry Logic

The certificate client automatically retries:
- Connection failures
- Timeouts
- HTTP 429, 500, 502, 503, 504

It does **not** retry:
- HTTP 400 (bad request)
- HTTP 401 (unauthorized - check API key)
- HTTP 403 (forbidden)
- HTTP 404 (not found)

Maximum retry attempts: 3 with exponential backoff.

## Testing the Integration

### 1. Test Environment Configuration

```bash
cd Eperkins-app
python test_certificate_integration.py
```

This will verify:
- Environment variables are set
- Payload structure is correct
- Certificate creation works
- Duplicate detection works
- URL parameter stripping works

### 2. Test with a Single Lead

Use the single entry form at http://localhost:5000 with test data.

### 3. Verify Certificates

1. Navigate to your certificate admin dashboard
2. Verify the certificate appears with:
   - Correct company (myrpmcare)
   - Correct lead data
   - Correct video URL
   - Correct timestamps

## File Structure

```
Eperkins-app/
├── app.py                           # Main Flask application
├── automation.py                    # Playwright automation logic
├── gcs_util.py                      # Google Cloud Storage utilities
├── certificate_client.py            # Certificate API client
├── certificate_payload.py           # Payload builder
├── test_certificate_integration.py # Integration tests
├── requirements.txt                 # Python dependencies
├── .env                             # Environment configuration (create from .env.example)
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore rules
├── README.md                        # This file
├── uploads/                         # Uploaded CSV/Excel files
└── videos/                          # Generated video files
```

## Security Notes

### Never Commit to Git

- `.env` file (contains API keys)
- Google Cloud credentials JSON
- Supabase service keys
- Any generated videos

### Safe to Commit

- `.env.example` (template without secrets)
- All Python source files
- README and documentation

### API Key Management

- Development keys: Use in `.env` for local testing
- Production keys: Use secure environment variables
- Rotate keys regularly
- Never log or print API keys
- Never expose API keys in responses

## Troubleshooting

### Certificate Creation Fails with 401 Unauthorized

**Problem:** API key mismatch

**Solution:**
1. Check `CERTIFICATE_API_KEY` in Python `.env`
2. Check API key configuration in your production environment
3. Ensure they match exactly
4. Restart both applications

### Certificate Not Appearing in Database

**Problem:** Company key mismatch or database not configured

**Solution:**
1. Verify `COMPANY_KEY=myrpmcare` in `.env`
2. Check Supabase connection in Next.js app
3. Run Next.js with `npm run dev` to see API logs
4. Check the Supabase certificates table

### Video Succeeds but Certificate Shows Warning

**Problem:** Certificate API unreachable

**Solution:**
1. Verify Next.js app is running on http://localhost:3000
2. Test the API directly:
   ```bash
   curl -X POST http://localhost:3000/api/certificates/create \
     -H "Content-Type: application/json" \
     -H "X-API-Key: dev_key_myrpmcare_12345" \
     -d '{"test": "data"}'
   ```
3. Check firewall/network settings

### Playwright Browser Not Found

**Problem:** Browsers not installed

**Solution:**
```bash
playwright install chromium
```

### FFmpeg Not Found

**Problem:** FFmpeg not installed

**Solution:** Install FFmpeg (see Prerequisites section)

### GCS Upload Fails

**Problem:** Credentials not configured

**Solution:**
1. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
2. Or leave `GCS_BUCKET_NAME` empty to use local storage

## Production Deployment

### Environment Variables for Production

```env
CERTIFICATE_API_URL=https://eperkinslaw.com/api/certificates/create
CERTIFICATE_API_KEY=<secure-production-key>
COMPANY_KEY=myrpmcare
WEBSITE=myrpmcare.com
SOURCE_SYSTEM=rpm-video-automation
GCS_BUCKET_NAME=production-video-bucket
FLASK_SECRET_KEY=<secure-random-key>
```

### Security Checklist

- [ ] Generate new secure API keys
- [ ] Update Next.js `.env.local` with matching production keys
- [ ] Configure HTTPS for certificate API URL
- [ ] Set up secure GCS bucket with proper IAM
- [ ] Enable API request logging
- [ ] Monitor certificate creation failures
- [ ] Set up certificate creation alerts

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Next.js app logs
3. Check Python Flask app console output
4. Verify Supabase database state
