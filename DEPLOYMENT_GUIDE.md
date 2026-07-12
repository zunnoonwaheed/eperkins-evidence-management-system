# Complete Deployment Guide - Eperkins Video Automation System

## 🏗️ Architecture Overview

Your system has 3 components:

1. **Next.js Frontend** (Certificate Viewer) → Shared Hosting or Vercel
2. **Flask Backend** (Video Automation) → Google Cloud Platform
3. **Database** (Supabase) → Already cloud-hosted ✓

---

## 📋 Pre-Deployment Checklist

### Required Accounts:
- [ ] Domain name (e.g., eperkinslaw.com)
- [ ] Shared hosting account (cPanel/Plesk)
- [ ] Google Cloud Platform account
- [ ] Supabase project (already have ✓)

### Required Information:
- [ ] Domain registrar login
- [ ] Hosting control panel access
- [ ] GCP project ID
- [ ] All environment variables documented

---

## 🎨 PART 1: Deploy Next.js Frontend (Certificate Viewer)

### Option A: Deploy to Vercel (Recommended - FREE)

**Why Vercel?**
- Built by Next.js creators
- Zero configuration
- Free tier (perfect for this)
- Automatic HTTPS
- Global CDN
- Serverless functions support

**Steps:**

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy from project root**
```bash
cd /Users/mac/Desktop/eperkins
vercel
```

Follow prompts:
- Link to existing project? → No
- Project name? → eperkins-certificates
- Directory? → `./` (current directory)
- Override settings? → No

4. **Set Environment Variables**
```bash
# In Vercel dashboard (vercel.com)
# Go to: Project Settings → Environment Variables

NEXT_PUBLIC_APP_URL=https://your-domain.com
DATABASE_URL=your_supabase_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
CERT_API_KEY_MYRPMCARE=your_cert_api_key
```

5. **Deploy to Production**
```bash
vercel --prod
```

6. **Add Custom Domain**
- Go to Vercel Dashboard → Domains
- Add: certificates.eperkinslaw.com
- Update DNS (A/CNAME records)

**Cost**: FREE ✓

---

### Option B: Deploy to Shared Hosting (cPanel)

**⚠️ Warning**: Next.js doesn't run well on shared hosting. You need to export as static HTML.

**Steps:**

1. **Update Next.js Config for Static Export**

Create/edit `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Disable features that require server
  experimental: {
    serverActions: false,
  },
}

module.exports = nextConfig
```

2. **Build Static Export**
```bash
cd /Users/mac/Desktop/eperkins
npm run build
```

This creates an `out/` folder with static HTML.

3. **Upload to Shared Hosting**

Via cPanel File Manager:
- Go to File Manager
- Navigate to `public_html/certificates/`
- Upload all files from `out/` folder
- Set permissions (755 for folders, 644 for files)

4. **Configure .htaccess**

Create `.htaccess` in `public_html/certificates/`:
```apache
# Enable HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Handle Next.js routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /certificates/$1.html [L]

# Disable directory listing
Options -Indexes

# Cache static assets
<FilesMatch "\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2)$">
Header set Cache-Control "max-age=31536000, public"
</FilesMatch>
```

**Limitations**:
- No Server-Side Rendering (SSR)
- No API routes
- No dynamic features
- Certificate data must be pre-generated

**Cost**: Included with hosting

---

## 🐍 PART 2: Deploy Flask App to Google Cloud Platform

### Option A: Google Cloud Run (Recommended)

**Why Cloud Run?**
- Only pay when running
- Auto-scaling
- Serverless
- Easy deployment

**Steps:**

1. **Install Google Cloud SDK**
```bash
# Mac
brew install --cask google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

2. **Login to GCP**
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

3. **Create Dockerfile**

Create `/Users/mac/Desktop/eperkins/Eperkins-app/Dockerfile`:
```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers
RUN playwright install chromium
RUN playwright install-deps chromium

# Copy app files
COPY . .

# Expose port
ENV PORT 8080
EXPOSE 8080

# Run app
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 app:app
```

4. **Update requirements.txt**

Add to `/Users/mac/Desktop/eperkins/Eperkins-app/requirements.txt`:
```
Flask==3.1.0
Flask-Cors==5.0.0
pandas==2.2.3
openpyxl==3.1.5
requests==2.32.3
python-dotenv==1.0.1
playwright==1.40.0
gunicorn==21.2.0
google-cloud-storage==2.14.0
```

5. **Create .gcloudignore**
```
.git
.gitignore
__pycache__/
*.pyc
.env
.DS_Store
videos/
venv/
node_modules/
.pytest_cache/
```

6. **Deploy to Cloud Run**
```bash
cd /Users/mac/Desktop/eperkins/Eperkins-app

gcloud run deploy eperkins-automation \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 900 \
  --max-instances 10
```

7. **Set Environment Variables**
```bash
gcloud run services update eperkins-automation \
  --update-env-vars \
  FLASK_SECRET_KEY=your-production-secret-key,\
  APP_URL=https://automation.eperkinslaw.com,\
  EPERKINS_CERTIFICATE_API_URL=https://eperkinslaw.com/api/certificates/create,\
  EPERKINS_CERTIFICATE_API_KEY=your-api-key,\
  EPERKINS_COMPANY_KEY=myrpmcare,\
  EPERKINS_WEBSITE=myrpmcare.com,\
  GCS_BUCKET_NAME=eperkins-videos,\
  GOOGLE_CLOUD_PROJECT=your-project-id
```

8. **Setup Custom Domain**
```bash
gcloud run domain-mappings create \
  --service eperkins-automation \
  --domain automation.eperkinslaw.com \
  --region us-central1
```

**Cost**: ~$10-50/month (depending on usage)

---

### Option B: Google App Engine

**Steps:**

1. **Create app.yaml**
```yaml
runtime: python311
entrypoint: gunicorn -b :$PORT app:app

instance_class: F2

automatic_scaling:
  min_instances: 0
  max_instances: 10
  target_cpu_utilization: 0.65

env_variables:
  FLASK_SECRET_KEY: "your-secret-key"
  APP_URL: "https://automation.eperkinslaw.com"
  EPERKINS_CERTIFICATE_API_URL: "https://eperkinslaw.com/api/certificates/create"
```

2. **Deploy**
```bash
cd /Users/mac/Desktop/eperkins/Eperkins-app
gcloud app deploy
```

**Cost**: ~$20-100/month

---

## 🗄️ PART 3: Setup Google Cloud Storage (Videos)

1. **Create Storage Bucket**
```bash
gsutil mb -l us-central1 gs://eperkins-videos
```

2. **Set CORS Configuration**

Create `cors.json`:
```json
[
  {
    "origin": ["https://eperkinslaw.com", "https://www.eperkinslaw.com"],
    "method": ["GET"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

Apply:
```bash
gsutil cors set cors.json gs://eperkins-videos
```

3. **Set Public Access** (for videos)
```bash
gsutil iam ch allUsers:objectViewer gs://eperkins-videos
```

---

## 🌐 PART 4: Configure Domains & DNS

### DNS Records to Add:

**For Next.js (Vercel):**
```
Type: CNAME
Name: certificates (or @)
Value: cname.vercel-dns.com
```

**For Flask (Cloud Run):**
```
Type: A
Name: automation
Value: [Cloud Run IP]

Type: AAAA
Name: automation
Value: [Cloud Run IPv6]
```

**For Email:**
```
Type: MX
Priority: 10
Value: mail.yourdomain.com
```

---

## 🔐 PART 5: Environment Variables Summary

### Next.js (.env.production)
```bash
# Database
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Certificate API
CERT_API_KEY_MYRPMCARE=your-secure-api-key-here

# App URLs
NEXT_PUBLIC_APP_URL=https://eperkinslaw.com
```

### Flask (.env.production)
```bash
# Flask
FLASK_SECRET_KEY=your-super-secret-production-key-change-this
APP_URL=https://automation.eperkinslaw.com

# Certificate API
EPERKINS_CERTIFICATE_API_URL=https://eperkinslaw.com/api/certificates/create
EPERKINS_CERTIFICATE_API_KEY=same-as-nextjs-cert-api-key
EPERKINS_COMPANY_KEY=myrpmcare
EPERKINS_WEBSITE=myrpmcare.com
EPERKINS_SOURCE_SYSTEM=rpm-video-automation

# Google Cloud
GCS_BUCKET_NAME=eperkins-videos
GOOGLE_CLOUD_PROJECT=your-project-id
```

---

## 📱 PART 6: Update URLs in Code

### Update Flask Templates

Edit `/Users/mac/Desktop/eperkins/Eperkins-app/templates/upload.html`:
```html
<a href="https://eperkinslaw.com/certificates" target="_blank" class="footer-link">📜 View Certificates</a>
<a href="https://eperkinslaw.com/admin/certificates" target="_blank" class="footer-link">⚙️ Admin</a>
```

### Update Next.js Footer

Edit `/Users/mac/Desktop/eperkins/components/layout/Footer.tsx`:
```typescript
<a
  href="https://automation.eperkinslaw.com"
  target="_blank"
  rel="noopener noreferrer"
>
  🎬 Video Automation
</a>
```

---

## ✅ PART 7: Testing Checklist

### Test Next.js:
- [ ] Visit https://eperkinslaw.com/certificates
- [ ] Click on a certificate
- [ ] Verify video plays
- [ ] Check footer links work

### Test Flask:
- [ ] Visit https://automation.eperkinslaw.com
- [ ] Upload test CSV
- [ ] Generate video
- [ ] Verify certificate created
- [ ] Check video stored in GCS

### Test Integration:
- [ ] Flask creates certificate in Next.js DB
- [ ] Certificate appears on Next.js site
- [ ] Video URL points to GCS
- [ ] All CORS headers correct

---

## 💰 Cost Estimate

| Service | Cost/Month |
|---------|------------|
| Vercel (Next.js) | **$0** (Free tier) |
| GCP Cloud Run (Flask) | **$10-30** (pay per use) |
| Google Cloud Storage | **$1-5** (per GB) |
| Supabase | **$0-25** (Free tier → Pro) |
| Domain | **$12/year** |
| **Total** | **~$15-50/month** |

---

## 🚀 Quick Start Deployment

```bash
# 1. Deploy Next.js to Vercel
cd /Users/mac/Desktop/eperkins
vercel --prod

# 2. Deploy Flask to Cloud Run
cd /Users/mac/Desktop/eperkins/Eperkins-app
gcloud run deploy eperkins-automation --source .

# 3. Create GCS bucket
gsutil mb gs://eperkins-videos

# 4. Update environment variables
# - Vercel: vercel.com → Project → Settings → Environment Variables
# - Cloud Run: Cloud Console → Cloud Run → Service → Variables

# 5. Configure custom domains
# - Vercel: Dashboard → Domains
# - Cloud Run: Cloud Console → Domain Mappings
```

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Google Cloud Run**: https://cloud.google.com/run/docs
- **Supabase**: https://supabase.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

## 🔒 Security Checklist

- [ ] All API keys in environment variables (not code)
- [ ] HTTPS enabled on all domains
- [ ] CORS properly configured
- [ ] Database connection over SSL
- [ ] Flask secret key is random and secure
- [ ] GCS bucket has proper IAM permissions
- [ ] Rate limiting enabled (Cloud Armor/Vercel)
- [ ] Monitoring and alerts configured

---

## 📊 Monitoring Setup

### Vercel Analytics:
```bash
npm install @vercel/analytics
```

### GCP Monitoring:
```bash
# Enable Cloud Monitoring
gcloud services enable monitoring.googleapis.com

# View logs
gcloud run services logs read eperkins-automation
```

---

## 🎯 Next Steps After Deployment

1. Test all functionality thoroughly
2. Set up monitoring and alerts
3. Configure backups for Supabase
4. Set up error tracking (Sentry)
5. Document admin procedures
6. Create runbook for common issues
7. Set up CI/CD pipeline (GitHub Actions)

---

**Need help?** Choose your deployment path:
- **Easiest**: Vercel (Next.js) + Cloud Run (Flask)
- **Cheapest**: Shared hosting (both) with static export
- **Most Scalable**: Vercel + Cloud Run + GCS
