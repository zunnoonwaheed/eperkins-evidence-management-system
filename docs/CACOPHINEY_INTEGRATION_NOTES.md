# Cacophiney Eperkins Integration Analysis

## App Location
`Cacophiney-app/`

## Current Execution Flow

### Entry Routes

**Single Lead Processing:**
- Route: `POST /` with `mode=single`
- Function: `home()` in `app.py:246-293`
- Flow:
  1. Collect form data from request
  2. Validate required fields
  3. Normalize tax debt amount
  4. Generate video filename: `single_entry_video.mp4`
  5. Call `fill_form_and_record(pd.Series(single_data), video_path)` _(line 285)_
  6. Call `save_video_link(video_path, video_filename)` _(line 287)_
  7. Render results page with video link

**Bulk Lead Processing:**
- Route: `POST /` with `mode=excel` or file upload
- Function: `home()` in `app.py:295-354`
- Flow:
  1. Read and normalize CSV/XLSX file
  2. Validate all rows
  3. For each row:
     - Generate video filename: `cacophinney_video_{idx+1}.mp4`
     - Call `fill_form_and_record(row, video_path)` _(line 345)_
     - Call `save_video_link(video_path, video_filename)` _(line 347)_
     - Collect video link
  4. Render results page with all video links

### Lead Data Structure

Real CSV columns (from `sample_cacophinney.csv`):
```
First Name, Last Name, Mobile Phone, Email,
Tax Debt Amount, Contact Consent, IP Address, Receipt Date
```

**Field mapping in app:**
- `First Name` → Contact info (required)
- `Last Name` → Contact info (required)
- `Mobile Phone` → Contact info (required)
- `Email` → Contact info (required)
- `Tax Debt Amount` → Survey question (normalized to debt range options)
- `Contact Consent` → Consent checkbox (default: yes)
- `IP Address` → Injected into form and footer
- `Receipt Date` → Injected into consent footer

### Tax Debt Options
From `automation.py:12-19`:
```
"Under $10,000"
"$10,000 – $24,999"
"$25,000 – $49,999"
"$50,000 – $99,999"
"$100,000+"
"Not sure"
```

### Video Generation Function

**Function:** `fill_form_and_record(data, video_path)`
- **Location:** `automation.py:1234-1523`
- **Purpose:** Recreate historical form submission with Playwright video recording
- **Process:**
  1. Extract lead data from pandas Series
  2. Launch Playwright browser with video recording enabled
  3. Navigate to `https://cacophiney.com/#qualify`
  4. Inject IP address and receipt date into page
  5. Fill all contact fields with human-like typing
  6. Select tax debt amount dropdown
  7. Check consent checkbox
  8. Submit form with retry logic
  9. Close browser (video automatically saved)
  10. Convert WebM to MP4
- **Output:** Video file saved to `video_path` (returns nothing)
- **Current Issues:** No recording ID generated

### Video Upload Function

**Function:** `save_video_link(video_path, video_filename)`
- **Location:** `app.py:28-43`
- **Purpose:** Upload video to GCS and return signed URL
- **Process:**
  1. Call `upload_video_to_gcs(video_path, video_filename)`
  2. If upload succeeds, call `generate_signed_url(video_filename)`
  3. Return signed URL if available, else return local URL `/videos/{filename}`
- **Output:** String containing video URL
- **Current Issues:**
  - Returns simple string, not dict with storage_path
  - No recording ID tracked
  - Local fallback URL is relative, not absolute

### Upload Result Structure

**Current return value:** String (URL only)

Example:
```
"https://storage.googleapis.com/bucket-name/cacophinney_video_1.mp4?..."
```

OR fallback:
```
"/videos/cacophinney_video_1.mp4"
```

**Missing data:**
- `storage_path` - GCS path (e.g., `gs://bucket/file.mp4`)
- `recording_id` - Unique recording identifier

### Final Response Structure

**Current response:** HTML template with video links only

No structured API response for certificate data.

## Certificate Integration Trigger Point

**Proposed location:** `app.py` after line 287 (single) and line 347 (bulk)

**Trigger condition:** After `save_video_link` succeeds

**Required changes:**
1. Modify `save_video_link` to return dict:
   ```python
   {
       "video_url": "https://...",
       "storage_path": "gs://bucket/file.mp4",
       "recording_id": "generated_id"
   }
   ```
2. Generate recording ID from video filename or lead data
3. Call certificate creation API after upload success
4. Store/return certificate result

## Certificate Payload Mapping

### Required top-level fields:
```python
{
  "company_key": "cacophiney",
  "website": "cacophiney.com",  # From actual site config
  "source_system": "cacophiney-video-automation",
  "lead_id": "<generated from lead data>",
  "lead_data": { ... },
  "recording_id": "<generated from video>",
  "recording_url": "<final uploaded URL>",
  "recording_storage_path": "<GCS path>",
  "lead_submitted_at": "<Receipt Date in ISO-8601>",
  "video_generated_at": "<current time in ISO-8601>",
  "recording_type": "reconstructed_historical_recording",
  "idempotency_key": "cacophiney:<lead_id>:<recording_id>"
}
```

### Lead data mapping:
```python
{
  "firstName": data.get("First Name"),
  "lastName": data.get("Last Name"),
  "email": data.get("Email"),
  "phone": data.get("Mobile Phone"),
  "form_answers": {
    "tax_debt_amount": data.get("Tax Debt Amount"),
    "contact_consent": data.get("Contact Consent"),
    "ip_address": data.get("IP Address")
  }
}
```

## Environment Variables Required

```bash
# Required for certificate integration
EPERKINS_CERTIFICATE_API_URL=http://localhost:3000/api/certificates/create
EPERKINS_CERTIFICATE_API_KEY=<secret_key>
EPERKINS_COMPANY_KEY=cacophiney
EPERKINS_WEBSITE=cacophiney.com
EPERKINS_SOURCE_SYSTEM=cacophiney-video-automation

# Existing environment
HEADLESS=true
GCS_BUCKET_NAME=<bucket>
GOOGLE_APPLICATION_CREDENTIALS=<path>
```

## Website Domain

**Current site URL:** `https://cacophiney.com/#qualify`
**Certificate website field:** `cacophiney.com`

## Idempotency Key Format

```
cacophiney:<lead_id>:<recording_id>
```

## Integration Implementation Plan

1. **Create certificate client module:**
   - `Cacophiney-app/eperkins_certificate_client.py`
   - `Cacophiney-app/certificate_payload.py`

2. **Modify `save_video_link()` to return dict:**
   - Add recording ID generation
   - Include GCS storage path
   - Return structured result

3. **Add certificate creation call in `app.py`:**
   - After successful `save_video_link()` _(lines 287, 347)_
   - Build certificate payload from lead data
   - Call Eperkins certificate API
   - Handle success/failure appropriately

4. **Update response structure:**
   - Include certificate data in results
   - Keep video success independent from certificate result

5. **Add `.env.example` entries**

6. **Create integration test**

## Notes

- No database or persistent storage exists in this app
- Certificate results can only be returned in HTTP response
- Video generation must remain successful even if certificate fails
- All existing video URLs are public GCS signed URLs (temporary)
- Receipt Date is the original form submission timestamp
- IP Address is historically accurate from original submission
- Simpler form than TheGoodNews360 (fewer survey questions)
