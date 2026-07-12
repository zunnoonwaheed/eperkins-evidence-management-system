# All URLs - Eperkins Video Automation System

## Flask App URLs (Port 5001)

### Main Pages:
- **Home/Upload Form**: http://localhost:5001/
  - Upload CSV/Excel or submit single entry
  - Generate videos with certificates

- **Form Page**: http://localhost:5001/form
  - Alternative form interface

- **Submitted Page**: http://localhost:5001/submitted
  - Shows after form submission

- **Video Files**: http://localhost:5001/videos/[filename]
  - Example: http://localhost:5001/videos/single_entry_video.mp4
  - Serves generated video files

---

## Next.js App URLs (Port 3000)

### Certificate Pages:
- **All Certificates**: http://localhost:3000/certificates
  - Browse all generated certificates

- **Specific Certificate**: http://localhost:3000/certificates/[cert_uuid]
  - View individual certificate with video
  - Example: http://localhost:3000/certificates/d75f2c75-b8d2-4ff7-83b5-d6bcb349072a

- **Admin Certificates**: http://localhost:3000/admin/certificates
  - Admin view of all certificates

---

## API Endpoints

### Certificate Creation:
- **Create Certificate API**: http://localhost:3000/api/certificates/create
  - POST endpoint for creating certificates
  - Used by Flask automation

---

## Quick Access Links

### Development:
```
Flask App:    http://localhost:5001
Next.js App:  http://localhost:3000
```

### Most Used:
1. Generate Videos: http://localhost:5001/
2. View Certificates: http://localhost:3000/certificates
3. Watch Video: http://localhost:5001/videos/single_entry_video.mp4

---

## Production URLs (Future)

When deployed to production:

### Flask App:
- Main: https://automation.yourdomain.com/
- Videos: https://automation.yourdomain.com/videos/[filename]

### Next.js App:
- Certificates: https://eperkinslaw.com/certificates
- Specific: https://eperkinslaw.com/certificates/[uuid]
- Admin: https://eperkinslaw.com/admin/certificates
