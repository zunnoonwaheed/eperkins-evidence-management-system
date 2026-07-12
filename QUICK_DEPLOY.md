# 🚀 Quick Deployment Guide

## Choose Your Path:

### ⚡ FASTEST & EASIEST (Recommended)
**Next.js → Vercel | Flask → Google Cloud Run**
- Cost: ~$15-30/month
- Time: 30 minutes
- Difficulty: Easy

### 💰 CHEAPEST
**Both → Shared Hosting**
- Cost: $5-10/month (hosting only)
- Time: 2 hours
- Difficulty: Medium
- ⚠️ Limited features (no SSR)

### 🏢 ENTERPRISE
**Next.js → Vercel | Flask → GCP App Engine**
- Cost: ~$50-100/month
- Time: 1 hour
- Difficulty: Medium

---

## ⚡ OPTION 1: Fastest Deployment (30 min)

### Step 1: Deploy Next.js to Vercel (10 min)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd /Users/mac/Desktop/eperkins
vercel --prod
```

**Environment Variables in Vercel:**
Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add:
- `DATABASE_URL` = your Supabase connection string
- `SUPABASE_URL` = your Supabase URL
- `SUPABASE_ANON_KEY` = your Supabase anon key
- `CERT_API_KEY_MYRPMCARE` = your certificate API key
- `NEXT_PUBLIC_APP_URL` = https://your-vercel-domain.vercel.app

**Add Custom Domain** (optional):
- Vercel Dashboard → Domains → Add certificates.yourdomain.com

---

### Step 2: Deploy Flask to Google Cloud Run (15 min)

```bash
# Install gcloud
brew install --cask google-cloud-sdk

# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Deploy
cd /Users/mac/Desktop/eperkins/Eperkins-app
gcloud run deploy eperkins-automation \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 900
```

**Set Environment Variables:**
```bash
gcloud run services update eperkins-automation \
  --update-env-vars \
  FLASK_SECRET_KEY=change-this-to-random-string,\
  APP_URL=https://eperkins-automation-xxx-uc.a.run.app,\
  EPERKINS_CERTIFICATE_API_URL=https://your-vercel-app.vercel.app/api/certificates/create,\
  EPERKINS_CERTIFICATE_API_KEY=same-as-nextjs,\
  EPERKINS_COMPANY_KEY=myrpmcare,\
  EPERKINS_WEBSITE=myrpmcare.com
```

---

### Step 3: Create Google Cloud Storage Bucket (5 min)

```bash
# Create bucket
gsutil mb -l us-central1 gs://YOUR-BUCKET-NAME

# Make public
gsutil iam ch allUsers:objectViewer gs://YOUR-BUCKET-NAME

# Set CORS
echo '[{"origin":["*"],"method":["GET"],"responseHeader":["Content-Type"],"maxAgeSeconds":3600}]' > cors.json
gsutil cors set cors.json gs://YOUR-BUCKET-NAME
```

**Add to Flask env vars:**
```bash
gcloud run services update eperkins-automation \
  --update-env-vars GCS_BUCKET_NAME=YOUR-BUCKET-NAME
```

---

### ✅ Done! Test Your Deployment

**Next.js Certificate Viewer:**
https://your-app.vercel.app/certificates

**Flask Automation:**
https://eperkins-automation-xxx-uc.a.run.app

**Generate test video:**
1. Go to Flask URL
2. Upload CSV or single entry
3. Video generates
4. Certificate appears on Next.js site!

---

## 📋 Post-Deployment Checklist

- [ ] Next.js site loads
- [ ] Can view certificates
- [ ] Flask app loads
- [ ] Can generate video
- [ ] Certificate created in database
- [ ] Video stored in GCS bucket
- [ ] Footer links work between apps
- [ ] HTTPS working on both
- [ ] Environment variables set correctly

---

## 🌐 Setup Custom Domains (Optional)

### Vercel:
1. Go to Dashboard → Domains
2. Add: certificates.eperkinslaw.com
3. Add DNS records from Vercel

### Cloud Run:
```bash
gcloud run domain-mappings create \
  --service eperkins-automation \
  --domain automation.eperkinslaw.com \
  --region us-central1
```

Add DNS records shown in output.

---

## 💰 Monthly Costs

| Service | Free Tier | Estimated Cost |
|---------|-----------|----------------|
| Vercel | ✅ 100GB bandwidth | $0 |
| Cloud Run | ✅ 2M requests | $10-20 |
| Cloud Storage | ✅ 5GB | $1-5 |
| Supabase | ✅ 500MB DB | $0 |
| **Total** | | **~$15-30/mo** |

---

## 🆘 Troubleshooting

### "Error: No project selected"
```bash
gcloud config set project YOUR_PROJECT_ID
```

### "Dockerfile build failed"
Check Docker is installed:
```bash
docker --version
```

### "Permission denied"
Enable Cloud Run API:
```bash
gcloud services enable run.googleapis.com
```

### Environment variables not working
Re-deploy after setting:
```bash
vercel --prod  # or
gcloud run deploy eperkins-automation --source .
```

---

## 📞 Need Help?

**Read full guide:**
```bash
cat /Users/mac/Desktop/eperkins/DEPLOYMENT_GUIDE.md
```

**View logs:**
```bash
# Vercel
vercel logs

# Cloud Run
gcloud run services logs read eperkins-automation --limit 50
```

---

## 🎯 Next: Production Checklist

After deploying, update:

1. **Flask templates** - Change localhost URLs to production
2. **Next.js footer** - Update automation URL
3. **API keys** - Generate new secure keys for production
4. **Database** - Backup Supabase regularly
5. **Monitoring** - Set up alerts
6. **SSL** - Verify HTTPS on all URLs

**All files ready in your project!**
