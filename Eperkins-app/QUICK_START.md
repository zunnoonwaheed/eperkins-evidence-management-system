# Quick Start Guide - Eperkins Certificate Integration

## 1. Install Dependencies

```bash
cd Eperkins-app
pip install -r requirements.txt
playwright install chromium
```

Install FFmpeg:
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg
```

## 2. Configure Environment

The `.env` file is already configured with the correct API key that matches your Next.js app.

**Verify `.env` contains:**
```env
EPERKINS_CERTIFICATE_API_URL=http://localhost:3000/api/certificates/create
EPERKINS_CERTIFICATE_API_KEY=dev_key_myrpmcare_12345
EPERKINS_COMPANY_KEY=myrpmcare
```

## 3. Start Both Apps

**Terminal 1 - Start Next.js (Eperkins):**
```bash
cd /Users/mac/Desktop/eperkins
npm run dev
```

**Terminal 2 - Start Python (Automation):**
```bash
cd /Users/mac/Desktop/eperkins/Eperkins-app
python app.py
```

## 4. Test the Integration

### Quick Test

```bash
cd /Users/mac/Desktop/eperkins/Eperkins-app
python test_certificate_integration.py
```

### Full Test with Real Lead

1. Navigate to http://localhost:5000
2. Fill out the single entry form:
   - First Name: Test
   - Last Name: User
   - Mobile Phone: 555-123-4567
   - State: CA
   - Has Medicare: Yes
3. Click "Generate Video"
4. Wait for video generation
5. Verify:
   - ✓ Video URL is displayed
   - ✓ Certificate UUID is shown
   - ✓ Certificate URL is displayed

### Verify in Eperkins

1. Navigate to http://localhost:3000/admin/certificates
2. Find the new certificate
3. Verify:
   - ✓ Company = "myrpmcare"
   - ✓ Lead data is correct
   - ✓ Video URL works
   - ✓ Timestamps are correct

## 5. Test Duplicate Detection

Run the same lead again and verify:
- ✓ Returns same certificate UUID
- ✓ Shows `duplicate: true`
- ✓ Only one row in database

## What Happens Now

Every time a video is generated:
1. Form is automated with Playwright
2. Video is recorded
3. Video is uploaded (or saved locally)
4. **Certificate is automatically created** via Eperkins API
5. Certificate UUID and URL are returned
6. Results are displayed with both video and certificate

## Troubleshooting

**401 Unauthorized:**
```bash
# Check API keys match
grep EPERKINS_CERTIFICATE_API_KEY Eperkins-app/.env
grep CERT_API_KEY_MYRPMCARE .env.local
```

**Certificate not created:**
```bash
# Verify Next.js is running
curl http://localhost:3000/api/certificates/create \
  -H "X-API-Key: dev_key_myrpmcare_12345" \
  -H "Content-Type: application/json" \
  -d '{"test": "ping"}'
```

**Import errors:**
```bash
cd Eperkins-app
pip install -r requirements.txt
```

## Success!

If the test passes and you see certificates in the Eperkins admin panel, the integration is working correctly.

For full documentation, see:
- `README.md` - Complete setup guide
- `CERTIFICATE_INTEGRATION_SUMMARY.md` - Technical details
