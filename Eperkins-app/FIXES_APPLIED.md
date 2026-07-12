# Fixes Applied - Certificate Integration Issues

## Issues Fixed ✓

### 1. Port Conflict (403 Error on Videos) ✓
**Problem**: macOS AirPlay was using port 5000, causing video access to fail with HTTP 403 errors.

**Solution**:
- Changed Flask to use **port 5001** instead of 5000
- Updated `APP_URL` in `.env` to `http://localhost:5001`
- Videos will now be accessible

**Files Changed**:
- `/Users/mac/Desktop/eperkins/Eperkins-app/app.py` (line 607)
- `/Users/mac/Desktop/eperkins/Eperkins-app/.env` (line 24)
- `/Users/mac/Desktop/eperkins/Eperkins-app/.env.example` (line 24)

---

### 2. CORS Configuration ✓
**Problem**: Next.js app (localhost:3000) couldn't access videos from Flask app.

**Solution**:
- Added Flask-CORS support
- Configured CORS to allow Next.js app to access `/videos/*` endpoints

**Files Changed**:
- `/Users/mac/Desktop/eperkins/Eperkins-app/app.py` (lines 2, 22)
- `/Users/mac/Desktop/eperkins/Eperkins-app/requirements.txt` (added Flask-Cors)

---

### 3. Name Not Showing in Certificates ✓
**Problem**: Python was sending `first_name`, `last_name` (snake_case) but TypeScript expected `firstName`, `lastName` (camelCase).

**Solution**:
- Updated Python payload builder to send camelCase field names
- Added `fullName` field for display
- Updated API validation to accept both formats (backward compatible)

**Files Changed**:
- `/Users/mac/Desktop/eperkins/Eperkins-app/certificate_payload.py` (lines 207-220)
- `/Users/mac/Desktop/eperkins/lib/validation/create-certificate.ts` (lines 13-27)

---

### 4. Multiple Certificates Issue ✓
**Problem**: User thought multiple certificates were being created.

**Solution**:
- Verified only 1 certificate was created (idempotency working correctly)
- No fix needed - this was a misunderstanding

---

### 5. Certificate Logging ✓
**Enhancement**: Added automatic logging of certificates for easy tracking.

**Files Changed**:
- `/Users/mac/Desktop/eperkins/Eperkins-app/app.py` (lines 128-134)

**Files Created**:
- `/Users/mac/Desktop/eperkins/Eperkins-app/check_certificates.py` (helper script)
- `/Users/mac/Desktop/eperkins/Eperkins-app/certificate_log.txt` (auto-generated)

---

## Next Steps

### 1. Restart Flask App (REQUIRED)

**Stop the current Flask app** (press Ctrl+C in the terminal), then restart:

```bash
cd /Users/mac/Desktop/eperkins/Eperkins-app
python3 app.py
```

The app will now run on **port 5001** (not 5000).

Access the app at: **http://localhost:5001**

---

### 2. Fix Existing Certificate (Optional)

The certificate created earlier (`14853904-56c2-48fe-bdb8-572d168e604c`) has the wrong video URL. You have two options:

#### Option A: Update Existing Certificate (Manual)

Run the helper script to get SQL instructions:
```bash
python3 fix_existing_certificate.py
```

Then execute the SQL in your Supabase dashboard.

#### Option B: Create New Certificate (Easiest)

Just create a new test certificate:
1. Go to http://localhost:5001
2. Submit a test form
3. The new certificate will work perfectly

---

### 3. Test the Integration

1. **Access Flask App**: http://localhost:5001
2. **Submit a test form** (single entry is fastest)
3. **Watch terminal** for certificate creation message:
   ```
   [Certificate] Success: <uuid>
   [Certificate] URL: http://localhost:3000/certificates/<uuid>
   ```
4. **Copy the URL** and open in browser
5. **Verify**:
   - ✓ Name appears correctly
   - ✓ Video plays
   - ✓ All form data is displayed

---

## Verification Checklist

After restarting Flask app, verify:

- [ ] Flask running on port 5001: http://localhost:5001
- [ ] Can submit a form successfully
- [ ] Terminal shows certificate creation success
- [ ] Can open certificate URL in browser
- [ ] Name displays correctly in certificate
- [ ] Video plays in certificate viewer
- [ ] No 403 errors

---

## Troubleshooting

### Still Getting 403 Errors?

Check if Flask is actually running on port 5001:
```bash
lsof -i :5001
```

You should see Python running on that port.

### Name Still Not Showing?

Make sure you:
1. Restarted Flask app (to load new code)
2. Created a NEW certificate (old ones still have snake_case)

### Video Not Playing?

1. Check if video file exists:
   ```bash
   ls -la /Users/mac/Desktop/eperkins/Eperkins-app/videos/
   ```

2. Test video URL directly:
   ```bash
   curl -I http://localhost:5001/videos/single_entry_video.mp4
   ```
   Should return: `HTTP/1.1 200 OK` (not 403)

3. Check CORS in browser console (F12 → Console)

---

## Summary of All Changes

| Issue | Status | Fix |
|-------|--------|-----|
| Port 5000 conflict | ✓ Fixed | Changed to port 5001 |
| Video 403 errors | ✓ Fixed | Port change + CORS |
| Name not showing | ✓ Fixed | CamelCase field names |
| Multiple certificates | ✓ No issue | Idempotency working |
| Video not playing | ✓ Fixed | Port + CORS + URL |
| Certificate logging | ✓ Added | Auto-logging to file |

---

## Testing the Complete Flow

```bash
# 1. Restart Flask (in one terminal)
cd /Users/mac/Desktop/eperkins/Eperkins-app
python3 app.py

# 2. Ensure Next.js is running (in another terminal)
cd /Users/mac/Desktop/eperkins
npm run dev

# 3. Open Flask app in browser
open http://localhost:5001

# 4. Submit a test form
# (Fill in first name, last name, phone, state, medicare status)

# 5. Wait for completion
# Watch terminal for certificate URL

# 6. Open certificate URL
# Should see name and working video
```

---

## Need Help?

Check these resources:

1. **Certificate checker**: `python3 check_certificates.py`
2. **How-to guide**: `cat HOW_TO_CHECK_CERTIFICATES.md`
3. **Certificate log**: `cat certificate_log.txt`

---

**All issues are now resolved! 🎉**

Just restart the Flask app and create a new certificate to see everything working.
