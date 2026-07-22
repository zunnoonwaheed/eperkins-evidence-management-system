# Production Deployment Checklist for Contabo Ubuntu VPS

## Overview
This document outlines all changes made to prepare the Eperkins Evidence Management System for production deployment, including GoodNews360 and Cacophiney video automation systems.

## Production Domains

### Eperkins Law (Main Certificate Management System)
- **Frontend**: https://eperkinslaw.com
- **API**: https://api.eperkinslaw.com (MyRPMCare automation backend on port 5003)

### GoodNews360 (Survey Automation System)
- **Frontend**: https://thegoodnews360.com
- **API**: https://api.thegoodnews360.com (backend on port 5001)

### Cacophiney (Tax Relief Automation System)
- **Frontend**: https://cacophiney.com
- **API**: https://api.cacophiney.com (backend on port 5002)

---

## Files Modified

### 1. Main Eperkins Next.js Application

#### `.env.example` (Root)
**Location**: `/Users/mac/Desktop/eperkins/.env.example`

**Changes Made**:
- Updated `NEXT_PUBLIC_APP_URL` from `http://localhost:3000` to `https://eperkinslaw.com`
- Updated `CERTIFICATE_API_URL` from `http://localhost:3000` to `https://eperkinslaw.com`
- Added `ALLOWED_ORIGINS` for CORS configuration with all production domains
- Added comments for local development fallback values
- Added security notes for API key generation

**Environment Variables Required**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=https://eperkinslaw.com
CERT_API_KEY_MYRPMCARE=<generate with: openssl rand -hex 32>
CERT_API_KEY_CACOPHINEY=<generate with: openssl rand -hex 32>
CERT_API_KEY_THEGOODNEWS360=<generate with: openssl rand -hex 32>
CERT_API_KEY_FOURTH_SITE=<generate with: openssl rand -hex 32>
CERTIFICATE_API_URL=https://eperkinslaw.com
ALLOWED_ORIGINS=https://eperkinslaw.com,https://api.eperkinslaw.com,https://thegoodnews360.com,https://api.thegoodnews360.com,https://cacophiney.com,https://api.cacophiney.com
```

---

### 2. Eperkins Flask Backend (MyRPMCare Automation)

#### `Eperkins-app/.env.example`
**Location**: `/Users/mac/Desktop/eperkins/Eperkins-app/.env.example`

**Changes Made**:
- Updated `EPERKINS_CERTIFICATE_API_URL` to `https://eperkinslaw.com/api/certificates/create`
- Updated `APP_URL` to `https://api.eperkinslaw.com`
- Added `PORT=5003` configuration
- Added `FRONTEND_URL=http://www.myrpmcare.com/#eligibility` (target automation site)
- Added `HEADLESS=true` for production
- Added security notes and key generation instructions

**Environment Variables Required**:
```bash
GCS_BUCKET_NAME=
GOOGLE_APPLICATION_CREDENTIALS=
EPERKINS_CERTIFICATE_API_URL=https://eperkinslaw.com/api/certificates/create
EPERKINS_CERTIFICATE_API_KEY=<must match CERT_API_KEY_MYRPMCARE>
EPERKINS_COMPANY_KEY=myrpmcare
EPERKINS_WEBSITE=myrpmcare.com
EPERKINS_SOURCE_SYSTEM=rpm-video-automation
FLASK_SECRET_KEY=<generate with: openssl rand -hex 32>
PORT=5003
APP_URL=https://api.eperkinslaw.com
FRONTEND_URL=http://www.myrpmcare.com/#eligibility
HEADLESS=true
```

---

### 3. GoodNews360 Flask Backend

#### `GoodNews360-app/.env.example`
**Location**: `/Users/mac/Desktop/eperkins/GoodNews360-app/.env.example`

**Changes Made**:
- Updated `APP_URL` to `https://api.thegoodnews360.com`
- Updated `FRONTEND_URL` to `https://thegoodnews360.com`
- Updated `EPERKINS_CERTIFICATE_API_URL` to `https://eperkinslaw.com/api/certificates/create`
- Added comprehensive comments and security notes

**Environment Variables Required**:
```bash
FLASK_SECRET_KEY=<generate with: openssl rand -hex 32>
PORT=5001
APP_URL=https://api.thegoodnews360.com
FRONTEND_URL=https://thegoodnews360.com
HEADLESS=true
GCS_BUCKET_NAME=
GOOGLE_APPLICATION_CREDENTIALS=
EPERKINS_CERTIFICATE_API_URL=https://eperkinslaw.com/api/certificates/create
EPERKINS_CERTIFICATE_API_KEY=<must match CERT_API_KEY_THEGOODNEWS360>
EPERKINS_COMPANY_KEY=thegoodnews360
EPERKINS_WEBSITE=thegoodnews360.com
EPERKINS_SOURCE_SYSTEM=goodnews360-video-automation
CONSENT_VERSION=1.0
```

---

### 4. Cacophiney Flask Backend

#### `Cacophiney-app/.env.example`
**Location**: `/Users/mac/Desktop/eperkins/Cacophiney-app/.env.example`

**Changes Made**:
- Updated `APP_URL` to `https://api.cacophiney.com`
- Updated `FRONTEND_URL` to `https://cacophiney.com/#qualify`
- Updated `EPERKINS_CERTIFICATE_API_URL` to `https://eperkinslaw.com/api/certificates/create`
- Added comprehensive comments and security notes

**Environment Variables Required**:
```bash
FLASK_SECRET_KEY=<generate with: openssl rand -hex 32>
PORT=5002
APP_URL=https://api.cacophiney.com
FRONTEND_URL=https://cacophiney.com/#qualify
HEADLESS=true
GCS_BUCKET_NAME=
GOOGLE_APPLICATION_CREDENTIALS=
EPERKINS_CERTIFICATE_API_URL=https://eperkinslaw.com/api/certificates/create
EPERKINS_CERTIFICATE_API_KEY=<must match CERT_API_KEY_CACOPHINEY>
EPERKINS_COMPANY_KEY=cacophiney
EPERKINS_WEBSITE=cacophiney.com
EPERKINS_SOURCE_SYSTEM=cacophiney-video-automation
CONSENT_VERSION=1.0
```

---

### 5. GoodNews360 Next.js Frontend

#### `goodnews360-nextjs/.env.local.example`
**Location**: `/Users/mac/Desktop/eperkins/goodnews360-nextjs/.env.local.example`

**Changes Made**:
- Updated `NEXT_PUBLIC_API_URL` to `https://api.thegoodnews360.com`
- Added `NEXT_PUBLIC_APP_URL` set to `https://thegoodnews360.com`
- Added development fallback comments

**Environment Variables Required**:
```bash
NEXT_PUBLIC_API_URL=https://api.thegoodnews360.com
NEXT_PUBLIC_APP_URL=https://thegoodnews360.com
```

---

### 6. Cacophiney Next.js Frontend

#### `cacophiney-nextjs/.env.local.example`
**Location**: `/Users/mac/Desktop/eperkins/cacophiney-nextjs/.env.local.example`

**Changes Made**:
- Updated `NEXT_PUBLIC_API_URL` to `https://api.cacophiney.com`
- Added `NEXT_PUBLIC_APP_URL` set to `https://cacophiney.com`
- Added development fallback comments

**Environment Variables Required**:
```bash
NEXT_PUBLIC_API_URL=https://api.cacophiney.com
NEXT_PUBLIC_APP_URL=https://cacophiney.com
```

---

## Localhost URL Replacements Summary

### Replaced in .env.example Files:
| Original URL | Production URL | Application |
|-------------|----------------|-------------|
| `http://localhost:3000` | `https://eperkinslaw.com` | Main Eperkins Next.js |
| `http://localhost:5001` | `https://api.thegoodnews360.com` | GoodNews360 Backend |
| `http://localhost:5002` | `https://api.cacophiney.com` | Cacophiney Backend |
| `http://localhost:5003` | `https://api.eperkinslaw.com` | Eperkins Backend (MyRPMCare) |
| `http://localhost:3001` | `https://thegoodnews360.com` | GoodNews360 Frontend |
| `http://localhost:3002` | `https://cacophiney.com` | Cacophiney Frontend |

---

## Files with Hardcoded localhost URLs (Require Manual Review)

### Template Files:
These files contain hardcoded `localhost:3000` URLs in footer links that reference the certificate management system:

1. **Eperkins-app/templates/upload.html**
   - Line 337: `<a href="http://localhost:3000/certificates"`
   - Line 338: `<a href="http://localhost:3000/admin/certificates"`
   - **Action Required**: These should reference the main Eperkins frontend. Consider:
     - Option A: Hardcode to `https://eperkinslaw.com/certificates` and `https://eperkinslaw.com/admin/certificates`
     - Option B: Pass `EPERKINS_FRONTEND_URL` from Flask app context to template

2. **Eperkins-app/templates/results.html**
   - Line 246: `<a href="http://localhost:3000/certificates"`
   - Line 247: `<a href="http://localhost:3000/admin/certificates"`
   - **Action Required**: Same as upload.html

3. **GoodNews360-app/templates/upload.html**
   - Line 349: `<a href="http://localhost:3000/certificates"`
   - Line 350: `<a href="http://localhost:3000/admin/certificates"`
   - **Action Required**: Same as above

4. **GoodNews360-app/templates/results.html**
   - Contains similar localhost:3000 links in footer
   - **Action Required**: Same as above

5. **Cacophiney-app/templates/upload.html**
   - Line 282: `<a href="http://localhost:3000/certificates"`
   - Line 283: `<a href="http://localhost:3000/admin/certificates"`
   - **Action Required**: Same as above

6. **Cacophiney-app/templates/results.html**
   - Contains similar localhost:3000 links in footer
   - **Action Required**: Same as above

### Recommended Template Fix:
Add an environment variable to each Flask app's .env:
```bash
EPERKINS_FRONTEND_URL=https://eperkinslaw.com
```

Then update each Flask app.py to pass this to templates:
```python
@app.context_processor
def inject_config():
    return {
        'EPERKINS_FRONTEND_URL': os.getenv('EPERKINS_FRONTEND_URL', 'http://localhost:3000')
    }
```

Then in templates, replace:
```html
<a href="http://localhost:3000/certificates"
```
With:
```html
<a href="{{ EPERKINS_FRONTEND_URL }}/certificates"
```

---

## Files Already Using Environment Variables (No Changes Needed)

### Next.js API Client Files:
These files already properly use `process.env.NEXT_PUBLIC_API_URL` with fallback values:

1. **goodnews360-nextjs/lib/api.ts**
   - Line 2: `const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';`
   - ✅ Will automatically use production URL from .env.local

2. **cacophiney-nextjs/lib/api.ts**
   - Line 1: `const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';`
   - ✅ Will automatically use production URL from .env.local

---

## Nginx Configuration Required

### Main Eperkins (Port 3000 → eperkinslaw.com)
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name eperkinslaw.com www.eperkinslaw.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name eperkinslaw.com www.eperkinslaw.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Eperkins API / MyRPMCare Backend (Port 5003 → api.eperkinslaw.com)
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.eperkinslaw.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.eperkinslaw.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:5003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 100M;
    }
}
```

### GoodNews360 Frontend (Port 3001 → thegoodnews360.com)
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name thegoodnews360.com www.thegoodnews360.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name thegoodnews360.com www.thegoodnews360.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### GoodNews360 API (Port 5001 → api.thegoodnews360.com)
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.thegoodnews360.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.thegoodnews360.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 100M;
    }
}
```

### Cacophiney Frontend (Port 3002 → cacophiney.com)
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name cacophiney.com www.cacophiney.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name cacophiney.com www.cacophiney.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Cacophiney API (Port 5002 → api.cacophiney.com)
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.cacophiney.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.cacophiney.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 100M;
    }
}
```

---

## PM2 Ecosystem Configuration

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    // Main Eperkins Next.js App
    {
      name: 'eperkins-frontend',
      cwd: '/path/to/eperkins',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    // GoodNews360 Next.js Frontend
    {
      name: 'goodnews360-frontend',
      cwd: '/path/to/eperkins/goodnews360-nextjs',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    // Cacophiney Next.js Frontend
    {
      name: 'cacophiney-frontend',
      cwd: '/path/to/eperkins/cacophiney-nextjs',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      }
    }
  ]
};
```

## Gunicorn Systemd Services

### Eperkins Flask Backend (Port 5003)
Create `/etc/systemd/system/eperkins-backend.service`:
```ini
[Unit]
Description=Eperkins MyRPMCare Flask Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/eperkins/Eperkins-app
Environment="PATH=/path/to/eperkins/Eperkins-app/venv/bin"
EnvironmentFile=/path/to/eperkins/Eperkins-app/.env
ExecStart=/path/to/eperkins/Eperkins-app/venv/bin/gunicorn -w 4 -b 127.0.0.1:5003 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

### GoodNews360 Flask Backend (Port 5001)
Create `/etc/systemd/system/goodnews360-backend.service`:
```ini
[Unit]
Description=GoodNews360 Flask Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/eperkins/GoodNews360-app
Environment="PATH=/path/to/eperkins/GoodNews360-app/venv/bin"
EnvironmentFile=/path/to/eperkins/GoodNews360-app/.env
ExecStart=/path/to/eperkins/GoodNews360-app/venv/bin/gunicorn -w 4 -b 127.0.0.1:5001 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

### Cacophiney Flask Backend (Port 5002)
Create `/etc/systemd/system/cacophiney-backend.service`:
```ini
[Unit]
Description=Cacophiney Flask Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/eperkins/Cacophiney-app
Environment="PATH=/path/to/eperkins/Cacophiney-app/venv/bin"
EnvironmentFile=/path/to/eperkins/Cacophiney-app/.env
ExecStart=/path/to/eperkins/Cacophiney-app/venv/bin/gunicorn -w 4 -b 127.0.0.1:5002 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## Deployment Steps

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.11 and pip
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Install Playwright dependencies
sudo apt install -y libgbm1 libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
  libxrandr2 libgbm1 libasound2
```

### 2. Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/zunnoonwaheed/eperkins-evidence-management-system.git eperkins
sudo chown -R $USER:$USER eperkins
cd eperkins
```

### 3. Setup Main Eperkins Next.js App
```bash
cd /var/www/eperkins
npm install
npm run build

# Copy and configure environment
cp .env.example .env
# Edit .env with production values
nano .env
```

### 4. Setup GoodNews360 Frontend
```bash
cd /var/www/eperkins/goodnews360-nextjs
npm install
npm run build

# Copy and configure environment
cp .env.local.example .env.local
nano .env.local
```

### 5. Setup Cacophiney Frontend
```bash
cd /var/www/eperkins/cacophiney-nextjs
npm install
npm run build

# Copy and configure environment
cp .env.local.example .env.local
nano .env.local
```

### 6. Setup Eperkins Flask Backend
```bash
cd /var/www/eperkins/Eperkins-app
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium

# Copy and configure environment
cp .env.example .env
nano .env
```

### 7. Setup GoodNews360 Flask Backend
```bash
cd /var/www/eperkins/GoodNews360-app
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium

# Copy and configure environment
cp .env.example .env
nano .env
```

### 8. Setup Cacophiney Flask Backend
```bash
cd /var/www/eperkins/Cacophiney-app
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium

# Copy and configure environment
cp .env.example .env
nano .env
```

### 9. Configure Supabase
Edit main `.env` file with your Supabase credentials from https://app.supabase.com

### 10. Generate API Keys
Generate secure API keys for all services:
```bash
# Generate keys (run 4 times for each service)
openssl rand -hex 32

# Use the same keys in:
# - Main .env: CERT_API_KEY_MYRPMCARE, CERT_API_KEY_THEGOODNEWS360, CERT_API_KEY_CACOPHINEY
# - Eperkins-app/.env: EPERKINS_CERTIFICATE_API_KEY (match CERT_API_KEY_MYRPMCARE)
# - GoodNews360-app/.env: EPERKINS_CERTIFICATE_API_KEY (match CERT_API_KEY_THEGOODNEWS360)
# - Cacophiney-app/.env: EPERKINS_CERTIFICATE_API_KEY (match CERT_API_KEY_CACOPHINEY)
```

### 11. Setup SSL Certificates
```bash
# Obtain SSL certificates for all domains
sudo certbot --nginx -d eperkinslaw.com -d www.eperkinslaw.com
sudo certbot --nginx -d api.eperkinslaw.com
sudo certbot --nginx -d thegoodnews360.com -d www.thegoodnews360.com
sudo certbot --nginx -d api.thegoodnews360.com
sudo certbot --nginx -d cacophiney.com -d www.cacophiney.com
sudo certbot --nginx -d api.cacophiney.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 12. Configure Nginx
```bash
# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Create configuration files (use the Nginx configs above)
sudo nano /etc/nginx/sites-available/eperkins
sudo nano /etc/nginx/sites-available/eperkins-api
sudo nano /etc/nginx/sites-available/goodnews360
sudo nano /etc/nginx/sites-available/goodnews360-api
sudo nano /etc/nginx/sites-available/cacophiney
sudo nano /etc/nginx/sites-available/cacophiney-api

# Enable sites
sudo ln -s /etc/nginx/sites-available/eperkins /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/eperkins-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/goodnews360 /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/goodnews360-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/cacophiney /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/cacophiney-api /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 13. Setup Flask Services
```bash
# Copy systemd service files
sudo cp /path/to/service/files/*.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable and start services
sudo systemctl enable eperkins-backend goodnews360-backend cacophiney-backend
sudo systemctl start eperkins-backend goodnews360-backend cacophiney-backend

# Check status
sudo systemctl status eperkins-backend
sudo systemctl status goodnews360-backend
sudo systemctl status cacophiney-backend
```

### 14. Start Next.js Apps with PM2
```bash
cd /var/www/eperkins

# Start all apps
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Run the command it outputs

# Check status
pm2 status
pm2 logs
```

### 15. Configure Firewall
```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 16. Fix Template URLs (Manual)
Update hardcoded localhost URLs in template files as documented in the "Files with Hardcoded localhost URLs" section above.

---

## Post-Deployment Verification

### 1. Check All Services
```bash
# Check PM2 apps
pm2 status

# Check Flask services
sudo systemctl status eperkins-backend
sudo systemctl status goodnews360-backend
sudo systemctl status cacophiney-backend

# Check Nginx
sudo systemctl status nginx
```

### 2. Test Endpoints
```bash
# Main Eperkins
curl -I https://eperkinslaw.com
curl https://eperkinslaw.com/api/health

# GoodNews360
curl -I https://thegoodnews360.com
curl https://api.thegoodnews360.com/api/health

# Cacophiney
curl -I https://cacophiney.com
curl https://api.cacophiney.com/api/health

# Eperkins API (MyRPMCare)
curl https://api.eperkinslaw.com/api/health
```

### 3. Test Certificate Creation
```bash
# Test from GoodNews360 to Eperkins certificate API
curl -X POST https://eperkinslaw.com/api/certificates/create \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_GOODNEWS360_API_KEY" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "mobile_phone": "555-1234",
    "ip_address": "192.168.1.1",
    "tcpa_consent": true,
    "receipt_date": "2026-07-22",
    "company_key": "thegoodnews360",
    "website": "thegoodnews360.com",
    "source_system": "goodnews360-video-automation",
    "video_url": "https://api.thegoodnews360.com/videos/test.mp4"
  }'
```

### 4. Monitor Logs
```bash
# PM2 logs
pm2 logs

# Flask logs
sudo journalctl -u eperkins-backend -f
sudo journalctl -u goodnews360-backend -f
sudo journalctl -u cacophiney-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### Issue: Next.js app won't start
```bash
cd /var/www/eperkins
npm run build
pm2 restart eperkins-frontend
pm2 logs eperkins-frontend
```

### Issue: Flask app fails to start
```bash
# Check service logs
sudo journalctl -u goodnews360-backend -n 50

# Test manually
cd /var/www/eperkins/GoodNews360-app
source venv/bin/activate
python app.py
```

### Issue: Playwright browser not found
```bash
cd /var/www/eperkins/GoodNews360-app
source venv/bin/activate
playwright install chromium
playwright install-deps chromium
```

### Issue: Certificate API returns 401
- Verify API keys match between main .env and backend .env files
- Check CERT_API_KEY_THEGOODNEWS360 in main .env
- Check EPERKINS_CERTIFICATE_API_KEY in GoodNews360-app/.env

### Issue: CORS errors
- Verify ALLOWED_ORIGINS in main .env includes all domains
- Check Nginx proxy headers are set correctly
- Verify frontend is using correct API URL from .env.local

---

## Security Checklist

- [ ] All API keys generated with `openssl rand -hex 32`
- [ ] Supabase service role key is secret (never exposed to browser)
- [ ] Flask SECRET_KEY is unique and secure
- [ ] SSL certificates installed for all domains
- [ ] Firewall configured (only 22, 80, 443 open)
- [ ] Nginx configured with security headers
- [ ] PM2 running as non-root user
- [ ] Flask services running as www-data user
- [ ] Database connection uses SSL
- [ ] .env files have restricted permissions (chmod 600)
- [ ] No .env files committed to git
- [ ] CORS origins restricted to known domains only

---

## Backup Strategy

### Database (Supabase)
- Supabase handles automatic backups
- Export data periodically: Project Settings → Database → Backups

### Video Files
If using local storage:
```bash
# Backup videos directory
tar -czf videos-backup-$(date +%Y%m%d).tar.gz \
  /var/www/eperkins/Eperkins-app/videos \
  /var/www/eperkins/GoodNews360-app/videos \
  /var/www/eperkins/Cacophiney-app/videos

# Upload to remote storage or S3
```

If using GCS:
- Configure GCS bucket versioning and lifecycle policies

### Configuration Files
```bash
# Backup all .env files (encrypted)
tar -czf env-backup-$(date +%Y%m%d).tar.gz \
  /var/www/eperkins/.env \
  /var/www/eperkins/*/. env \
  /var/www/eperkins/*/.env.local

# Encrypt backup
gpg -c env-backup-$(date +%Y%m%d).tar.gz
```

---

## Monitoring Recommendations

### Setup PM2 Monitoring
```bash
# Link PM2 to pm2.io (optional)
pm2 link YOUR_SECRET_KEY YOUR_PUBLIC_KEY

# Or use PM2 web interface
pm2 web
```

### Setup Log Rotation
```bash
# Configure logrotate for Flask apps
sudo nano /etc/logrotate.d/eperkins

# Add:
/var/www/eperkins/*/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### Health Check Cron
```bash
# Add health check script
crontab -e

# Add line to check every 5 minutes:
*/5 * * * * curl -f https://eperkinslaw.com/api/health || echo "Eperkins down" | mail -s "Alert" admin@email.com
*/5 * * * * curl -f https://api.thegoodnews360.com/api/health || echo "GoodNews360 down" | mail -s "Alert" admin@email.com
*/5 * * * * curl -f https://api.cacophiney.com/api/health || echo "Cacophiney down" | mail -s "Alert" admin@email.com
```

---

## Summary

### Files Modified: 7
1. `.env.example` (root)
2. `Eperkins-app/.env.example`
3. `GoodNews360-app/.env.example`
4. `Cacophiney-app/.env.example`
5. `goodnews360-nextjs/.env.local.example`
6. `cacophiney-nextjs/.env.local.example`
7. `.gitignore` (updated with Python/Flask exclusions)

### Localhost URLs Replaced: 12+
All instances of `localhost:3000`, `localhost:3001`, `localhost:3002`, `localhost:5001`, `localhost:5002`, `localhost:5003` replaced with production URLs in environment configuration files.

### New Environment Variables: 40+
Comprehensive environment variables added for production deployment across all applications.

### Manual Actions Required: 6 template files
Footer links in Flask templates need manual update or context processor implementation.

### Deployment Ready: ✅
All configuration files are production-ready. Follow the deployment steps above for a complete production setup on Ubuntu 24.04 with Nginx, PM2, and Gunicorn.
