# How to Check Certificates

This guide shows you how to view and verify certificates created by the automation system.

## Quick Summary

After you create a video through the Flask app, certificates are automatically created in the Eperkins system. Here's how to view them:

---

## Method 1: Using the Certificate Checker Script

Run the helper script to see recent certificates:

```bash
cd /Users/mac/Desktop/eperkins/Eperkins-app
python3 check_certificates.py
```

To check a specific certificate:

```bash
python3 check_certificates.py <cert_uuid>
```

Example:
```bash
python3 check_certificates.py e94cddf8-a790-430f-90a0-ad09a1960e57
```

---

## Method 2: View in Browser (Next.js App)

The certificates are stored in the Next.js application database. You can view them at:

**View all certificates:**
```
http://localhost:3000/certificates
```

**View specific certificate:**
```
http://localhost:3000/certificates/<cert_uuid>
```

Example:
```
http://localhost:3000/certificates/e94cddf8-a790-430f-90a0-ad09a1960e57
```

---

## Method 3: Check the Certificate Log File

When certificates are created, they're automatically logged to:
```
/Users/mac/Desktop/eperkins/Eperkins-app/certificate_log.txt
```

View the log:
```bash
cat certificate_log.txt
```

Or view the last 10 certificates:
```bash
tail -10 certificate_log.txt
```

Each line contains:
```
TIMESTAMP | CERTIFICATE_UUID | CERTIFICATE_URL
```

---

## Method 4: Watch Terminal Output

When you submit a form in the Flask app, watch the terminal for output like:

```
[Certificate] Success: e94cddf8-a790-430f-90a0-ad09a1960e57
[Certificate] URL: http://localhost:3000/certificates/e94cddf8-a790-430f-90a0-ad09a1960e57
```

Simply copy the URL and paste it in your browser.

---

## Method 5: Check the Database Directly (Supabase)

If you have access to Supabase, you can query the database:

1. Go to your Supabase project dashboard
2. Navigate to Table Editor
3. Select the `certificates` table
4. Filter by `company_id` or search for recent entries

---

## Understanding Certificate URLs

Each certificate has a unique UUID. The URL format is:
```
http://localhost:3000/certificates/<cert_uuid>
```

**In production**, this would be:
```
https://eperkinslaw.com/certificates/<cert_uuid>
```

---

## Troubleshooting

### "Certificate creation failed"

If you see this error, check:

1. **Next.js app is running**
   ```bash
   # In the main Eperkins-app directory
   npm run dev
   ```

2. **Environment variables are set**
   ```bash
   cat .env | grep EPERKINS
   ```

3. **API URL is correct**
   - Should be: `http://localhost:3000/api/certificates/create`

4. **API key matches**
   - Flask `.env`: `EPERKINS_CERTIFICATE_API_KEY`
   - Next.js `.env.local`: `CERT_API_KEY_MYRPMCARE`
   - These must match!

### "Video URL must be a valid URL"

Make sure `APP_URL` is set in your Flask `.env` file:
```bash
APP_URL=http://localhost:5000
```

Then restart the Flask app:
```bash
cd /Users/mac/Desktop/eperkins/Eperkins-app
python3 app.py
```

---

## Next Steps

1. **Restart Flask App** - The fixes have been applied, restart the app to apply them
2. **Submit a Test Form** - Go to http://localhost:5000 and submit a test entry
3. **Watch Terminal** - Look for the certificate URL in the terminal output
4. **Open Certificate** - Copy the URL and open it in your browser

That's it! Your certificates will now be created successfully.
