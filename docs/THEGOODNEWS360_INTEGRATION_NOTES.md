# TheGoodNews360 Eperkins Integration Analysis

## App Location
`GoodNews360-app/`

## Current Execution Flow

### Entry Routes

**Single Lead Processing:**
- Route: `POST /` with `mode=single`
- Function: `home()` in `app.py:175-209`
- Flow:
  1. Collect form data from request
  2. Validate required fields
  3. Generate video filename: `single_entry_video.mp4`
  4. Call `fill_form_and_record(pd.Series(single_data), video_path)` _(line 207)_
  5. Call `save_video_link(video_path, video_filename)` _(line 208)_
  6. Render results page with video link

**Bulk Lead Processing:**
- Route: `POST /` with `mode=excel` or file upload
- Function: `home()` in `app.py:211-254`
- Flow:
  1. Read and normalize CSV/XLSX file
  2. Validate all rows
  3. For each row:
     - Generate video filename: `goodnews360_video_{idx+1}.mp4`
     - Call `fill_form_and_record(row, video_path)` _(line 250)_
     - Call `save_video_link(video_path, video_filename)` _(line 251)_
     - Collect video link
  4. Render results page with all video links

### Lead Data Structure

Real CSV columns (from `sample_goodnews360.csv`):
```
First Name, Last Name, Mobile Phone, Email, ZIP Code,
Age Range, Home Status, Household Income, Back Taxes,
Monthly Bills, Contact Consent, IP Address, Receipt Date
```

**Field mapping in app:**
- `First Name` → Contact info
- `Last Name` → Contact info
- `Mobile Phone` → Contact info (required)
- `Email` → Contact info (required)
- `ZIP Code` → Contact info (required)
- `Age Range` → Survey question (normalized to options)
- `Home Status` → Survey question (normalized to options)
- `Household Income` → Survey question (normalized to options)
- `Owe Back Taxes` or `Back Taxes` → Survey question (normalized to options)
- `Monthly Bill Reduction` or `Monthly Bills` → Survey question (normalized to options)
- `Contact Consent` → Consent checkbox (default: yes)
- `IP Address` → Injected into form and footer
- `Receipt Date` → Injected into consent footer

### Video Generation Function

**Function:** `fill_form_and_record(data, video_path)`
- **Location:** `automation.py:998-1204`
- **Purpose:** Recreate historical form submission with Playwright video recording
- **Process:**
  1. Extract lead data from pandas Series
  2. Launch Playwright browser with video recording enabled
  3. Navigate to `https://thegoodnews360.com`
  4. Inject IP address and receipt date into page
  5. Fill all contact fields with human-like typing
  6. Answer all survey questions
  7. Check consent checkbox
  8. Submit form with retry logic
  9. Close browser (video automatically saved)
  10. Convert WebM to MP4
- **Output:** Video file saved to `video_path` (returns nothing)
- **Current Issues:** No recording ID generated

### Video Upload Function

**Function:** `save_video_link(video_path, video_filename)`
- **Location:** `app.py:34-47`
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
"https://storage.googleapis.com/bucket-name/goodnews360_video_1.mp4?..."
```

OR fallback:
```
"/videos/goodnews360_video_1.mp4"
```

**Missing data:**
- `storage_path` - GCS path (e.g., `gs://bucket/file.mp4`)
- `recording_id` - Unique recording identifier

### Final Response Structure

**Current response:** HTML template with video links only

No structured API response for certificate data.

## Certificate Integration Trigger Point

**Proposed location:** `app.py` after line 208 (single) and line 251 (bulk)

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
  "company_key": "thegoodnews360",
  "website": "thegoodnews360.com",  # From actual site config
  "source_system": "goodnews360-video-automation",
  "lead_id": "<generated from lead data>",
  "lead_data": { ... },
  "recording_id": "<generated from video>",
  "recording_url": "<final uploaded URL>",
  "recording_storage_path": "<GCS path>",
  "lead_submitted_at": "<Receipt Date in ISO-8601>",
  "video_generated_at": "<current time in ISO-8601>",
  "recording_type": "reconstructed_historical_recording",
  "idempotency_key": "thegoodnews360:<lead_id>:<recording_id>"
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
    "zip_code": data.get("ZIP Code"),
    "age_range": data.get("Age Range"),
    "home_status": data.get("Home Status"),
    "household_income": data.get("Household Income"),
    "owe_back_taxes": data.get("Back Taxes") or data.get("Owe Back Taxes"),
    "monthly_bill_reduction": data.get("Monthly Bills") or data.get("Monthly Bill Reduction"),
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
EPERKINS_COMPANY_KEY=thegoodnews360
EPERKINS_WEBSITE=thegoodnews360.com
EPERKINS_SOURCE_SYSTEM=goodnews360-video-automation

# Existing environment
HEADLESS=true
GCS_BUCKET_NAME=<bucket>
GOOGLE_APPLICATION_CREDENTIALS=<path>
```

## Website Domain

**Current site URL:** `https://thegoodnews360.com`
**Certificate website field:** `thegoodnews360.com`

## Idempotency Key Format

```
thegoodnews360:<lead_id>:<recording_id>
```

## Integration Implementation Plan

1. **Create certificate client module:**
   - `GoodNews360-app/eperkins_certificate_client.py`
   - `GoodNews360-app/certificate_payload.py`

2. **Modify `save_video_link()` to return dict:**
   - Add recording ID generation
   - Include GCS storage path
   - Return structured result

3. **Add certificate creation call in `app.py`:**
   - After successful `save_video_link()` _(lines 208, 251)_
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
