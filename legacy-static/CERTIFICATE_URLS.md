# Certificate URL Structure

## Overview
The static recording pages (rec1.html, rec2.html, rec3.html) have been replaced with a dynamic certificate system that uses unique, permanent URLs for each certificate.

## URL Format

Each certificate now has its own permanent URL in this format:

```
certificate.html?id={certificate-id}&token={secure-token}
```

### Example URLs

**Certificate 1 - Shridhar Ratnam:**
```
certificate.html?id=9f4a1c72-2d8e-4f01-91b3-1c7e6a9d8b44&token=ZWZmMGQ4ZGUxOTk4ZTU1ZjYxZjJmMjA3YzkyMDkxZDMtN2U3YTY5YjdiMjQ5ZTE0YzM5MWI5MDgxYzg5OTc3MTM=
```

**Certificate 2 - Gary Polsley:**
```
certificate.html?id=b71d3f89-a6c0-4b2f-bf97-582e9d1e3c21&token=YjcxZDNmODlhNmMwNGIyZmJmOTc1ODJlOWQxZTNjMjEtOGE3YjU5YzhjMzQ4ZTE1YzQ5MmI5MTgyZDlhOTg4MjQ=
```

**Certificate 3 - Ashley Rodriguez:**
```
certificate.html?id=17c9e2d5-6a3b-4127-8e9f-0ab3d65f7c98&token=MTdjOWUyZDU2YTNiNDEyNzhlOWYwYWIzZDY1ZjdjOTgtOWI4YzZhOWQ4MzU5ZTI2ZDUwM2MyOTkzZWJiYTk5MzU=
```

## For Production (cert.goverifiedleads.com)

When you deploy to your production domain, the URLs will look like:

```
https://cert.goverifiedleads.com/certificate.html?id=9f4a1c72-2d8e-4f01-91b3-1c7e6a9d8b44&token=ZWZmMGQ4ZGUxOTk4ZTU1ZjYxZjJmMjA3YzkyMDkxZDMtN2U3YTY5YjdiMjQ5ZTE0YzM5MWI5MDgxYzg5OTc3MTM=
```

### Optional: Clean URL Structure with URL Rewriting

If you want URLs in the exact format specified (without query parameters):
```
https://cert.goverifiedleads.com/{certificate-id}/{secure-token}
```

You can add a URL rewrite rule on your web server:

**Apache (.htaccess):**
```apache
RewriteEngine On
RewriteRule ^([a-f0-9-]+)/([A-Za-z0-9+/=]+)$ certificate.html?id=$1&token=$2 [L,QSA]
```

**Nginx:**
```nginx
rewrite ^/([a-f0-9-]+)/([A-Za-z0-9+/=]+)$ /certificate.html?id=$1&token=$2 last;
```

## Key Features

### Security
- **Certificate ID**: Unique UUID for each certificate (predictable but requires knowledge)
- **Secure Token**: Base64-encoded token that prevents unauthorized access
- Both parameters must match exactly to view the certificate
- Invalid tokens show "Access Denied" error
- Missing certificates show "Certificate Not Found" error

### Error Handling
The system includes proper error pages for:
- **Invalid URLs**: Malformed or missing parameters
- **Invalid Tokens**: Certificate exists but token doesn't match
- **Certificate Not Found**: Certificate ID doesn't exist
- **Revoked Certificates**: Certificate has been marked as revoked (ready for future use)

## Files Created

1. **certificate.html** - Single dynamic page that displays any certificate
2. **certificates-data.js** - Database of all certificates with secure tokens
3. **CERTIFICATE_URLS.md** - This documentation file

## Migration Notes

### Old URLs (deprecated):
- ~~https://eperkinslaw.com/rec1.html~~
- ~~https://eperkinslaw.com/rec2.html~~
- ~~https://eperkinslaw.com/rec3.html~~

### New URLs:
- certificate.html?id=9f4a1c72-2d8e-4f01-91b3-1c7e6a9d8b44&token=...
- certificate.html?id=b71d3f89-a6c0-4b2f-bf97-582e9d1e3c21&token=...
- certificate.html?id=17c9e2d5-6a3b-4127-8e9f-0ab3d65f7c98&token=...

## Adding New Certificates

To add a new certificate, edit `certificates-data.js` and add a new entry:

```javascript
"new-certificate-id-uuid": {
  token: "base64-encoded-secure-token",
  status: "verified", // or "revoked"
  fullName: "Full Name",
  firstName: "First",
  lastName: "Last",
  email: "email@example.com",
  phone: "1234567890",
  taxDebtAmount: "Amount or 'Not sure'",
  certificateId: "same-as-key-uuid",
  signedDate: "Month DD, YYYY · HH:MM UTC",
  signedDateISO: "YYYY-MM-DDTHH:MM:SS.000Z",
  dateOfVisit: "Month DD, YYYY",
  timeOfVisit: "HH:MM:SS UTC",
  duration: "M:SS",
  ipAddress: "XXX.XXX.XXX.XXX",
  consentVersion: "vYYYY-MMx",
  videoFile: "videos/filename.mp4",
  videoFormat: "Screen recording",
  historyEvents: [
    // array of history events
  ]
}
```

## Old Files

The following files can now be archived or deleted (keep backups):
- rec1.html
- rec2.html
- rec3.html
- rec1_backup.html

These files are no longer used by the system but may be kept for reference.
