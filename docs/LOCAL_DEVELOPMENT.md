# Local Development Setup

This guide explains how to run the complete Eperkins certificate system locally, including all four applications.

## System Overview

The Eperkins project consists of four interconnected applications:

1. **Next.js Eperkins App** (Port 3000) - Main certificate management platform
2. **GoodNews360-app** (Port 5001) - Python video automation for TheGoodNews360
3. **Cacophiney-app** (Port 5002) - Python video automation for Cacophiney
4. **Eperkins-app** (Port 5003) - Python video automation for MyRPMCare

All Python apps create certificates via the Next.js certificate API after successful video generation and upload.

## Prerequisites

### Required Software

- **Node.js** 18+ and npm
- **Python** 3.8+
- **pip** (Python package manager)
- **Git** (already installed if you cloned this repo)

### Verify Prerequisites

```bash
node --version    # Should show v18.x or higher
npm --version     # Should show 9.x or higher
python3 --version # Should show Python 3.8+
pip3 --version    # Should show pip 20+
```

## Quick Start

### 1. Clone and Navigate to Project

```bash
cd /Users/mac/Desktop/eperkins
```

### 2. Start All Services (One Command)

```bash
chmod +x scripts/start-local.sh scripts/stop-local.sh
./scripts/start-local.sh
```

This script will:
- Install npm dependencies for Next.js (if needed)
- Create Python virtual environments (if needed)
- Install Python dependencies (if needed)
- Install Playwright browsers (if needed)
- Start all four services
- Display URLs and log locations

### 3. Access Applications

Once started, you can access:

- **Next.js Eperkins App**: http://localhost:3000
- **GoodNews360 Automation**: http://localhost:5001
- **Cacophiney Automation**: http://localhost:5002
- **Eperkins/MyRPMCare Automation**: http://localhost:5003

### 4. Stop All Services

```bash
./scripts/stop-local.sh
```

## Manual Setup (Step-by-Step)

If you prefer to set up each component manually:

### Step 1: Set Up Next.js Eperkins App

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The Next.js app will be available at http://localhost:3000.

**Environment Configuration**: `.env.local` (already configured)
- Contains Supabase credentials
- Contains API keys for all three Python apps
- Certificate API endpoint: http://localhost:3000/api/certificates/create

### Step 2: Set Up GoodNews360-app (Port 5001)

```bash
cd GoodNews360-app

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Start application
python app.py
```

**Environment Configuration**: `.env` (already created)
- `APP_URL=http://localhost:5001`
- `PORT=5001`
- `EPERKINS_CERTIFICATE_API_KEY=dev_key_thegoodnews360_11111`
- `EPERKINS_CERTIFICATE_API_URL=http://localhost:3000/api/certificates/create`

### Step 3: Set Up Cacophiney-app (Port 5002)

```bash
cd Cacophiney-app

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Start application
python app.py
```

**Environment Configuration**: `.env` (already created)
- `APP_URL=http://localhost:5002`
- `PORT=5002`
- `EPERKINS_CERTIFICATE_API_KEY=dev_key_cacophiney_67890`
- `EPERKINS_CERTIFICATE_API_URL=http://localhost:3000/api/certificates/create`

### Step 4: Set Up Eperkins-app (Port 5003)

```bash
cd Eperkins-app

# Create virtual environment (if doesn't exist)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium

# Start application
python app.py
```

**Environment Configuration**: `.env` (already configured)
- `APP_URL=http://localhost:5003`
- `PORT=5003`
- `EPERKINS_CERTIFICATE_API_KEY=dev_key_myrpmcare_12345`
- `EPERKINS_CERTIFICATE_API_URL=http://localhost:3000/api/certificates/create`

## Environment Variables

### Next.js App (.env.local)

Already configured with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Certificate API Keys (must match Python apps)
CERT_API_KEY_MYRPMCARE=dev_key_myrpmcare_12345
CERT_API_KEY_CACOPHINEY=dev_key_cacophiney_67890
CERT_API_KEY_THEGOODNEWS360=dev_key_thegoodnews360_11111
```

### Python Apps (.env files)

Each Python app has a `.env` file with:

**GoodNews360-app/.env**:
```bash
APP_URL=http://localhost:5001
PORT=5001
EPERKINS_CERTIFICATE_API_KEY=dev_key_thegoodnews360_11111
EPERKINS_CERTIFICATE_API_URL=http://localhost:3000/api/certificates/create
EPERKINS_COMPANY_KEY=thegoodnews360
```

**Cacophiney-app/.env**:
```bash
APP_URL=http://localhost:5002
PORT=5002
EPERKINS_CERTIFICATE_API_KEY=dev_key_cacophiney_67890
EPERKINS_CERTIFICATE_API_URL=http://localhost:3000/api/certificates/create
EPERKINS_COMPANY_KEY=cacophiney
```

**Eperkins-app/.env**:
```bash
APP_URL=http://localhost:5003
PORT=5003
EPERKINS_CERTIFICATE_API_KEY=dev_key_myrpmcare_12345
EPERKINS_CERTIFICATE_API_URL=http://localhost:3000/api/certificates/create
EPERKINS_COMPANY_KEY=myrpmcare
```

**IMPORTANT**: The API keys in each Python app's `.env` must match the corresponding keys in the Next.js `.env.local` file.

## Testing the Integration

### 1. Verify Next.js App is Running

Visit http://localhost:3000 and check:
- Homepage loads
- No console errors
- Supabase connection working

### 2. Test Certificate Creation from Python Apps

#### GoodNews360 (Port 5001)

```bash
# Visit the app
open http://localhost:5001

# Or use the automation script
cd /Users/mac/Desktop/eperkins
npx tsx scripts/thegoodnews360-video-automation.ts
```

#### Cacophiney (Port 5002)

```bash
# Visit the app
open http://localhost:5002

# Or use the automation script
npx tsx scripts/cacophiney-video-automation.ts
```

#### Eperkins-app/MyRPMCare (Port 5003)

```bash
# Visit the app
open http://localhost:5003

# Or use the automation script
npx tsx scripts/myrpmcare-video-automation.ts
```

### 3. Verify Certificate Creation

After running video automation:

1. Check Python app logs for certificate creation success:
   ```bash
   tail -f logs/goodnews360.log
   tail -f logs/cacophiney.log
   tail -f logs/eperkins-app.log
   ```

2. Look for log messages like:
   ```
   [Eperkins] Creating certificate for lead: lead-xyz-123
   [Certificate] SUCCESS: cert_uuid=abc123...
   [Certificate] Certificate URL: https://eperkinslaw.com/certificates/abc123
   ```

3. Check the Next.js app admin panel (if available) for new certificates

4. Test duplicate detection by running the same lead again - should see `duplicate: true`

## Viewing Logs

All services log to the `logs/` directory:

```bash
# View Next.js logs
tail -f logs/nextjs.log

# View GoodNews360 logs
tail -f logs/goodnews360.log

# View Cacophiney logs
tail -f logs/cacophiney.log

# View Eperkins-app logs
tail -f logs/eperkins-app.log

# View all logs simultaneously
tail -f logs/*.log
```

## Troubleshooting

### Port Already in Use

If you see "Port already in use" errors:

```bash
# Check what's using the port
lsof -i :3000   # Next.js
lsof -i :5001   # GoodNews360
lsof -i :5002   # Cacophiney
lsof -i :5003   # Eperkins-app

# Kill process on specific port
kill -9 $(lsof -ti:3000)
```

**Note**: Port 5000 is used by macOS AirPlay, which is why Python apps start at 5001.

### Certificate Creation Fails with 401 Unauthorized

**Cause**: API key mismatch between Python app and Next.js app

**Fix**:
1. Check Python app `.env` file for `EPERKINS_CERTIFICATE_API_KEY`
2. Check Next.js `.env.local` for corresponding `CERT_API_KEY_*`
3. Ensure they match exactly
4. Restart both services

### Certificate Creation Fails with 400 Bad Request

**Cause**: Invalid payload structure or missing required fields

**Fix**:
1. Check Python app logs for payload details
2. Run integration tests:
   ```bash
   cd GoodNews360-app
   python test_certificate_integration.py
   ```
3. Verify lead data has: firstName, lastName, email, phone

### Connection Refused to localhost:3000

**Cause**: Next.js app not running

**Fix**:
1. Start Next.js app: `npm run dev`
2. Wait for "Ready in X seconds" message
3. Verify it's accessible: `curl http://localhost:3000`

### Python Virtual Environment Issues

If you see "command not found" or import errors:

```bash
# Make sure venv is activated
source GoodNews360-app/venv/bin/activate  # Check for (venv) in prompt

# Reinstall dependencies
pip install -r requirements.txt

# Reinstall Playwright
playwright install chromium
```

### Playwright Browser Not Found

```bash
# Install Playwright browsers manually
cd GoodNews360-app
source venv/bin/activate
playwright install chromium
```

### Next.js Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Run build to check for errors
npm run build
```

## Development Workflow

### Making Changes to Python Apps

1. Modify code in Python app
2. No need to restart - Flask auto-reloads in debug mode
3. Test changes by triggering video generation
4. Check logs for any errors

### Making Changes to Next.js App

1. Modify code in Next.js app
2. Changes auto-reload via Next.js Fast Refresh
3. Check browser console for errors
4. Test certificate API endpoint: http://localhost:3000/api/certificates/create

### Running Tests

#### Next.js Tests

```bash
# Lint
npm run lint

# Build (validates TypeScript)
npm run build

# Certificate API tests
npm run test:certificate-api
```

#### Python Integration Tests

```bash
# GoodNews360
cd GoodNews360-app
source venv/bin/activate
python test_certificate_integration.py

# Cacophiney
cd Cacophiney-app
source venv/bin/activate
python test_certificate_integration.py
```

## Scripts Reference

### Startup Script

`./scripts/start-local.sh` - Starts all four services

**What it does**:
- Checks if ports are available
- Installs dependencies if needed
- Creates Python venvs if needed
- Starts all services in background
- Saves PIDs to `.local-pids` file
- Creates logs in `logs/` directory

### Stop Script

`./scripts/stop-local.sh` - Stops all services

**What it does**:
- Reads PIDs from `.local-pids`
- Kills each service gracefully
- Removes PID file
- Verifies all ports are free

### Automation Scripts

Located in `scripts/` directory:

- `myrpmcare-video-automation.ts` - Simulate MyRPMCare video automation
- `cacophiney-video-automation.ts` - Simulate Cacophiney video automation (if exists)
- `thegoodnews360-video-automation.ts` - Simulate TheGoodNews360 video automation (if exists)

Run with: `npx tsx scripts/<script-name>.ts`

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Next.js Eperkins | 3000 | http://localhost:3000 |
| GoodNews360 | 5001 | http://localhost:5001 |
| Cacophiney | 5002 | http://localhost:5002 |
| Eperkins-app (MyRPMCare) | 5003 | http://localhost:5003 |

**Note**: Port 5000 is avoided because macOS AirPlay uses it by default.

## API Keys Reference

| App | Environment Variable | Value (Local Dev) |
|-----|---------------------|-------------------|
| Next.js | CERT_API_KEY_MYRPMCARE | dev_key_myrpmcare_12345 |
| Next.js | CERT_API_KEY_CACOPHINEY | dev_key_cacophiney_67890 |
| Next.js | CERT_API_KEY_THEGOODNEWS360 | dev_key_thegoodnews360_11111 |
| Eperkins-app | EPERKINS_CERTIFICATE_API_KEY | dev_key_myrpmcare_12345 |
| Cacophiney-app | EPERKINS_CERTIFICATE_API_KEY | dev_key_cacophiney_67890 |
| GoodNews360-app | EPERKINS_CERTIFICATE_API_KEY | dev_key_thegoodnews360_11111 |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Eperkins App                     │
│                      (Port 3000)                            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Certificate API (/api/certificates/create)          │  │
│  │  - Validates API key                                 │  │
│  │  - Creates certificate record                        │  │
│  │  - Returns cert_uuid and certificate_url             │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▲                                  │
│                          │ HTTP POST                        │
└──────────────────────────┼──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        │                  │                  │
   ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐
   │GoodNews  │      │Cacophiney│      │ Eperkins │
   │360-app   │      │   -app   │      │   -app   │
   │(Port     │      │(Port     │      │(Port     │
   │ 5001)    │      │ 5002)    │      │ 5003)    │
   └──────────┘      └──────────┘      └──────────┘

   Each Python app:
   1. Loads historical lead data
   2. Recreates form process with Playwright
   3. Generates video recording
   4. Uploads to Google Cloud Storage
   5. Calls certificate API with lead + video data
   6. Receives cert_uuid and certificate_url
   7. Returns result to user
```

## Integration Flow

```
Historical Lead Data
       ↓
Form Recreation (Playwright)
       ↓
Video Generation
       ↓
Upload to GCS → Final Video URL
       ↓
Build Certificate Payload
       ↓
POST /api/certificates/create
(with X-API-Key header)
       ↓
Certificate Created in Next.js/Supabase
       ↓
Return cert_uuid and certificate_url
       ↓
Store in Python app response
```

## Support

### Documentation

- Certificate integration docs:
  - `docs/CACOPHINEY_EPERKINS_INTEGRATION.md`
  - `docs/THEGOODNEWS360_EPERKINS_INTEGRATION.md`
  - `docs/EPERKINS_APP_INTEGRATION.md` (if exists)

### Common Issues

1. **"Cannot find module"** - Run `npm install` or `pip install -r requirements.txt`
2. **"Port already in use"** - Stop services with `./scripts/stop-local.sh` or kill manually
3. **"401 Unauthorized"** - Check API key matching between .env files
4. **"Connection refused"** - Ensure Next.js app is running first
5. **"Playwright browser not found"** - Run `playwright install chromium`

### Getting Help

1. Check application logs in `logs/` directory
2. Search for `[Eperkins]` and `[Certificate]` in logs
3. Verify all environment variables are set correctly
4. Run integration tests to validate setup
5. Check that all services are running: `lsof -i :3000,:5001,:5002,:5003`

## Next Steps

After setting up local development:

1. ✅ Test certificate creation from each Python app
2. ✅ Verify certificates appear in Next.js admin
3. ✅ Test duplicate detection (run same lead twice)
4. ✅ Monitor logs for any errors
5. ✅ Review certificate data in Supabase

For production deployment, see deployment documentation (TBD).
