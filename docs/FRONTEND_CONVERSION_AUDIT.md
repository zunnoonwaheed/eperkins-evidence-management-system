# Frontend Conversion Audit Report
**Date:** July 20, 2026
**Project:** GoodNews360 & Cacophiney HTML to Next.js Conversion
**Objective:** Convert HTML frontends to standalone Next.js applications while preserving pixel-perfect designs

---

## Executive Summary

This audit documents the complete repository structure, existing applications, and conversion requirements for transforming GoodNews360 and Cacophiney HTML frontends into standalone Next.js applications that connect to their respective Python backends.

**Key Findings:**
- ✅ Both applications have partial Next.js implementations started
- ✅ All original HTML files have been located
- ✅ Python backends are fully functional with certificate integration
- ⚠️ Existing Next.js apps use Web3Forms instead of connecting to Python backends
- ⚠️ Existing Next.js apps are incomplete (missing pages, simplified designs)
- 📋 Full pixel-perfect conversion required for all pages

---

## Repository Structure

### Root Directory
**Path:** `/Users/mac/Desktop/eperkins`

This is a unified repository containing THREE complete applications:

1. **Eperkins/RPMCare** (Main Next.js app)
2. **GoodNews360** (Python backend + HTML frontend to convert)
3. **Cacophiney** (Python backend + HTML frontend to convert)

### Application Locations

#### 1. Eperkins/RPMCare (Reference Architecture)

**Next.js Frontend:** Root directory
**Python Backend:** `/Users/mac/Desktop/eperkins/Eperkins-app`

**Frontend Structure:**
```
/Users/mac/Desktop/eperkins/
├── app/
│   ├── admin/
│   ├── api/
│   ├── certificates/
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   └── page.tsx
├── components/
│   ├── admin/
│   ├── certificate/
│   ├── layout/
│   └── ui/
├── lib/
│   ├── auth/
│   ├── certificates/
│   ├── database/
│   ├── utils/
│   └── validation/
├── public/
├── types/
├── package.json
├── tsconfig.json
├── next.config.ts
└── .env.local
```

**Technology Stack:**
- Next.js: `15.1.4`
- React: `19.0.0`
- TypeScript: `5.x`
- Supabase: `2.110.2`
- App Router (not Pages Router)

**Backend Details:**
- Port: `5003`
- Framework: Flask
- Templates: Flask Jinja2
- Automation: Playwright
- Video Processing: FFmpeg
- Storage: Google Cloud Storage
- Certificate API integration

---

#### 2. GoodNews360 Application

**Python Backend Path:** `/Users/mac/Desktop/eperkins/GoodNews360-app`

**Backend Details:**
- **Port:** `5001`
- **Main File:** `app.py`
- **Framework:** Flask
- **Templates:** `templates/upload.html`, `templates/results.html`
- **Routes:**
  - `GET/POST /` - Home/upload page with single and bulk processing
  - `GET /videos/<filename>` - Serve generated videos
- **Key Files:**
  - `automation.py` - Playwright form filling automation
  - `gcs_util.py` - Google Cloud Storage utilities
  - `eperkins_certificate_client.py` - Certificate API integration
  - `certificate_payload.py` - Payload builder
- **Certificate Config:**
  - Company Key: `thegoodnews360`
  - Source System: `goodnews360-video-automation`

**Original HTML Frontend Path:** `/Users/mac/Desktop/eperkins/goodnews-frontend`

**HTML Files Found:**
1. `index (2).html` - Main survey landing page (31KB)
2. `MOCKUP_1_tax_question_tcpa_ip.html` - Tax question mockup (5.9KB)
3. `MOCKUP_2_contact_step_ip.html` - Contact step mockup (3.4KB)

**HTML Analysis - index (2).html:**
- **Page Title:** "2026 National Household Savings Survey"
- **Brand:** "Savings Check America"
- **Design Theme:**
  - Colors: Green (`#0e4d3c`), Gold (`#b98a2f`), Paper (`#f7f5ef`)
  - Typography: Segoe UI (body), Georgia (display/headings)
  - Border accent: 4px gold bottom border on header
- **Sections:**
  - Header with brand mark and navigation
  - Hero section with eyebrow, headline, CTA button
  - Stats strip (3 cards: "6 questions", "60s", "$0")
  - "How it works" section (3-step process)
  - Multi-step survey form (6 questions + contact form)
  - Progress bar with labels
  - Question cards with radio button options
  - Contact information collection
  - TCPA consent checkbox
  - Results/completion page
  - Footer with links
- **Interactions:**
  - Survey start button
  - Multi-step navigation (next/back)
  - Form validation
  - Progress tracking
  - Answer selection (radio buttons)
  - IP address detection
  - Submission handling
- **Responsive:** Mobile-first with CSS media queries

**Partially Started Next.js App Path:** `/Users/mac/Desktop/eperkins/goodnews360-nextjs`

**Current Status:**
- ✅ Basic Next.js structure created
- ✅ Package.json with dependencies
- ✅ App Router structure
- ⚠️ Only homepage implemented (`app/page.tsx`)
- ⚠️ Simplified survey (uses Web3Forms, not Python backend)
- ⚠️ Missing MOCKUP pages
- ⚠️ Incomplete visual design
- ❌ No API integration with Python backend
- ❌ No certificate flow integration

**Required Conversion:**
- Convert all 3 HTML files to Next.js routes
- Implement complete pixel-perfect design from original HTML
- Create API client for Python backend
- Implement full survey flow
- Add video result display
- Add certificate link display
- Add loading states
- Add error handling
- Migrate any assets

---

#### 3. Cacophiney Application

**Python Backend Path:** `/Users/mac/Desktop/eperkins/Cacophiney-app`

**Backend Details:**
- **Port:** `5002`
- **Main File:** `app.py`
- **Framework:** Flask
- **Templates:** `templates/upload.html`, `templates/results.html`
- **Routes:**
  - `GET/POST /` - Home/upload page with single and bulk processing
  - `GET /videos/<filename>` - Serve generated videos
- **Key Files:**
  - `automation.py` - Playwright form filling automation
  - `gcs_util.py` - Google Cloud Storage utilities
  - `eperkins_certificate_client.py` - Certificate API integration
  - `certificate_payload.py` - Payload builder
- **Certificate Config:**
  - Company Key: `cacophiney`
  - Source System: `cacophiney-video-automation`

**Original HTML Frontend Path:** `/Users/mac/Desktop/eperkins/cacophiney-frontend`

**HTML Files Found:**
1. `index (1).html` - Main landing page with eligibility check (35KB)
2. `tax_relief_survey.html` - Tax relief survey form (24KB)
3. `privacy.html` - Privacy policy page (6KB)
4. `terms.html` - Terms of service page (6.1KB)

**HTML Analysis - index (1).html:**
- **Page Title:** "Cacophinney Tax Relief — Resolve IRS & State Tax Debt"
- **Brand:** "Cacophinney"
- **Design Theme:**
  - Colors: Navy (`#122a3f`), Copper (`#c0622f`), Paper (`#f8f6f2`)
  - Typography: Segoe UI (body), Georgia (serif for headings)
  - Border accent: 3px copper bottom border on nav
- **Sections:**
  - Top bar with phone number and offer
  - Sticky navigation with logo and links
  - Hero section with 2-column grid:
    - Left: Headline, points, description
    - Right: Eligibility card (debt amount selector)
  - Trust bar with statistics (4 columns)
  - Services section (3-column grid of service cards)
  - Process section (3 steps with navy background)
  - Results/testimonials section
  - Final CTA section
  - Contact form section
  - Footer with links
- **Interactions:**
  - Debt amount button selection
  - Sticky navigation
  - Smooth scroll to sections
  - Form validation
  - TCPA consent checkbox
  - Mobile hamburger menu (implied)
- **Responsive:** Grid layouts that collapse on mobile

**HTML Analysis - tax_relief_survey.html:**
- Multi-step survey form
- Progress tracking
- Question cards
- Debt amount validation
- Contact collection

**Partially Started Next.js App Path:** `/Users/mac/Desktop/eperkins/cacophiney-nextjs`

**Current Status:**
- ✅ Basic Next.js structure created
- ✅ Package.json with dependencies
- ✅ App Router structure
- ⚠️ Only homepage implemented (`app/page.tsx`)
- ⚠️ Uses Web3Forms instead of Python backend
- ❌ Missing privacy.html, terms.html, tax_relief_survey.html routes
- ❌ Incomplete visual design
- ❌ No API integration with Python backend
- ❌ No certificate flow integration

**Required Conversion:**
- Convert all 4 HTML files to Next.js routes
- Implement complete pixel-perfect design from original HTML
- Create API client for Python backend
- Implement survey flow
- Add video result display
- Add certificate link display
- Add loading states
- Add error handling
- Migrate any assets

---

## Python Backend API Structure

Both GoodNews360 and Cacophiney backends follow similar patterns:

### Current Flask Routes

**GoodNews360 Backend (Port 5001):**
```
GET  /                    - Renders upload.html (Flask template)
POST /                    - Processes form (single or bulk mode)
  - mode=single          - Single lead processing
  - mode=excel (default) - Bulk CSV/XLSX processing
GET  /videos/<filename>  - Serves video files
```

**Cacophiney Backend (Port 5002):**
```
GET  /                    - Renders upload.html (Flask template)
POST /                    - Processes form (single or bulk mode)
  - mode=single          - Single lead processing
  - mode=excel (default) - Bulk CSV/XLSX processing
GET  /videos/<filename>  - Serves video files
```

### Required API Endpoints for Next.js

To support the Next.js frontends, we need to add JSON API endpoints:

**Recommended Structure (both backends):**
```
GET  /api/health                - Health check
POST /api/generate/single       - Single lead video generation
POST /api/generate/bulk         - Bulk upload processing
GET  /api/videos/<filename>     - Serve video (already exists)
GET  /api/jobs/<job_id>         - Check bulk job status (optional)
```

**Single Lead Request Example:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "mobilePhone": "555-1234",
  "email": "john@example.com",
  "zipCode": "12345",
  "ageRange": "35-44",
  "homeStatus": "own",
  "householdIncome": "$50,000-$74,999",
  "oweBackTaxes": "$10,000-$24,999",
  "monthlyBillReduction": "credit_cards",
  "contactConsent": "yes",
  "ipAddress": "192.168.1.1",
  "receiptDate": "2026-07-20T10:30:00Z"
}
```

**Response Format:**
```json
{
  "success": true,
  "video": {
    "success": true,
    "recording_id": "goodnews360_video_1",
    "video_url": "https://storage.googleapis.com/bucket/video.mp4"
  },
  "certificate": {
    "success": true,
    "cert_uuid": "abc-123-def-456",
    "certificate_url": "https://eperkins.com/certificates/abc-123",
    "duplicate": false,
    "status": "generated"
  }
}
```

---

## Frontend Conversion Requirements

### Design Preservation Rules

**Critical:** The converted Next.js applications must be **pixel-perfect** recreations of the original HTML files.

**Must Preserve:**
- ✅ All page sections
- ✅ All form fields and labels
- ✅ All buttons and CTAs
- ✅ All headings and text content
- ✅ All colors (CSS custom properties)
- ✅ All typography (fonts, sizes, weights, line-heights)
- ✅ All spacing (margins, padding)
- ✅ All borders and shadows
- ✅ All border-radius values
- ✅ All transitions and animations
- ✅ All hover states
- ✅ All focus states
- ✅ All responsive breakpoints
- ✅ All media queries
- ✅ All grid layouts
- ✅ All flex layouts
- ✅ Original brand identity

**Must NOT:**
- ❌ Redesign or "improve" the UI
- ❌ Change colors or branding
- ❌ Merge designs into one shared template
- ❌ Use generic dashboard templates
- ❌ Simplify or remove sections
- ❌ Change wording or copy

### Conversion Mapping

**GoodNews360:**
```
goodnews-frontend/index (2).html           → goodnews360-nextjs/app/page.tsx
goodnews-frontend/MOCKUP_1_*.html          → goodnews360-nextjs/app/mockup-1/page.tsx
goodnews-frontend/MOCKUP_2_*.html          → goodnews360-nextjs/app/mockup-2/page.tsx
+ New results page                          → goodnews360-nextjs/app/results/page.tsx
```

**Cacophiney:**
```
cacophiney-frontend/index (1).html         → cacophiney-nextjs/app/page.tsx
cacophiney-frontend/tax_relief_survey.html → cacophiney-nextjs/app/survey/page.tsx
cacophiney-frontend/privacy.html           → cacophiney-nextjs/app/privacy/page.tsx
cacophiney-frontend/terms.html             → cacophiney-nextjs/app/terms/page.tsx
+ New results page                          → cacophiney-nextjs/app/results/page.tsx
```

---

## Technical Architecture Reference

### Eperkins Next.js Stack (Use as Reference)

**Package.json Dependencies:**
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.110.2",
    "dotenv": "^17.4.2",
    "next": "^15.1.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tsx": "^4.23.0",
    "zod": "^4.4.3"
  }
}
```

**Use for GoodNews360 & Cacophiney:**
- Same Next.js version (15.1.4)
- Same React version (19.0.0)
- Same TypeScript setup
- App Router (not Pages Router)
- Server Components where possible
- Client Components only when needed (forms, interactions)

### Required Environment Variables

**GoodNews360 Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:5001
```

**GoodNews360 Backend (.env):**
```
PORT=5001
APP_URL=http://localhost:5001
FRONTEND_URL=http://localhost:3001
EPERKINS_CERTIFICATE_API_URL=http://localhost:3000/api/certificates/create
EPERKINS_COMPANY_KEY=thegoodnews360
EPERKINS_SOURCE_SYSTEM=goodnews360-video-automation
EPERKINS_CERTIFICATE_API_KEY=<from Eperkins>
GOOGLE_CLOUD_PROJECT=<project>
GCS_BUCKET_NAME=<bucket>
GOOGLE_APPLICATION_CREDENTIALS=<path>
```

**Cacophiney Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:5002
```

**Cacophiney Backend (.env):**
```
PORT=5002
APP_URL=http://localhost:5002
FRONTEND_URL=http://localhost:3002
EPERKINS_CERTIFICATE_API_URL=http://localhost:3000/api/certificates/create
EPERKINS_COMPANY_KEY=cacophiney
EPERKINS_SOURCE_SYSTEM=cacophiney-video-automation
EPERKINS_CERTIFICATE_API_KEY=<from Eperkins>
GOOGLE_CLOUD_PROJECT=<project>
GCS_BUCKET_NAME=<bucket>
GOOGLE_APPLICATION_CREDENTIALS=<path>
```

---

## Port Allocation

**Frontends:**
- Eperkins/RPMCare: `3000`
- GoodNews360: `3001`
- Cacophiney: `3002`

**Backends:**
- GoodNews360: `5001`
- Cacophiney: `5002`
- Eperkins/RPMCare: `5003`

**Certificate API:**
- `http://localhost:3000/api/certificates/create`

**Admin Dashboard:**
- `http://localhost:3000/admin/certificates`

---

## Asset Migration Plan

**GoodNews360:**
- No images found in current HTML files (self-contained CSS)
- Brand mark is CSS-generated (border box with "S")
- No external fonts (uses system fonts)
- Consider adding favicon

**Cacophiney:**
- No images found in current HTML files (self-contained CSS)
- Brand mark is CSS-generated (copper box with "C")
- No external fonts (uses system fonts)
- Consider adding favicon

**Migration Steps:**
1. Create `public/` directory in each Next.js app
2. Add favicons if needed
3. Verify all CSS is inline or in globals.css
4. Ensure no broken asset references

---

## JavaScript Behavior to Convert

### GoodNews360 Interactions
1. **Survey Start** - Button click shows survey, hides homepage
2. **Multi-step Navigation** - Next/Back buttons between questions
3. **Progress Bar** - Visual progress indicator
4. **Answer Selection** - Radio button selection with visual feedback
5. **Form Validation** - Required field checking
6. **Contact Form** - Input validation for email, phone, zip
7. **IP Detection** - Fetch user IP address
8. **UUID Generation** - Generate certificate UUID
9. **Submission** - POST to backend API
10. **Results Display** - Show completion message

**React Implementation:**
- `useState` for form state, current step, answers
- `useEffect` for IP detection, UUID generation
- Event handlers for navigation, selection
- Conditional rendering for steps
- Form validation before submission
- API client for backend calls

### Cacophiney Interactions
1. **Debt Amount Selection** - Button group with active state
2. **Smooth Scroll** - Navigate to page sections
3. **Sticky Navigation** - Nav bar sticks on scroll
4. **Form Validation** - Required field and consent checking
5. **TCPA Checkbox** - Enable/disable submit button
6. **IP Detection** - Fetch user IP address
7. **UUID Generation** - Generate certificate UUID
8. **Submission** - POST to backend API
9. **Results Display** - Show video and certificate

**React Implementation:**
- `useState` for form state, selected amount
- `useEffect` for IP detection, UUID generation
- Click handlers for debt selection
- CSS `position: sticky` for nav
- Form validation before submission
- API client for backend calls

---

## CORS Configuration

Both Python backends must add CORS support for their Next.js frontends.

**Install:**
```bash
pip install flask-cors
```

**Add to app.py (GoodNews360):**
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=[os.getenv("FRONTEND_URL", "http://localhost:3001")])
```

**Add to app.py (Cacophiney):**
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=[os.getenv("FRONTEND_URL", "http://localhost:3002")])
```

---

## Testing Checklist

### Visual Verification
- [ ] GoodNews360 homepage matches original HTML at 1440px
- [ ] GoodNews360 homepage matches original HTML at 768px
- [ ] GoodNews360 homepage matches original HTML at 390px
- [ ] GoodNews360 survey flow matches original at all breakpoints
- [ ] Cacophiney homepage matches original HTML at 1440px
- [ ] Cacophiney homepage matches original HTML at 768px
- [ ] Cacophiney homepage matches original HTML at 390px
- [ ] Cacophiney privacy page renders correctly
- [ ] Cacophiney terms page renders correctly
- [ ] Cacophiney survey matches original at all breakpoints

### Functional Verification
- [ ] GoodNews360 survey navigation works
- [ ] GoodNews360 form validation works
- [ ] GoodNews360 single lead submission works
- [ ] GoodNews360 video displays after generation
- [ ] GoodNews360 certificate link displays
- [ ] Cacophiney debt selector works
- [ ] Cacophiney navigation links work
- [ ] Cacophiney form validation works
- [ ] Cacophiney single lead submission works
- [ ] Cacophiney video displays after generation
- [ ] Cacophiney certificate link displays
- [ ] All backend APIs respond correctly
- [ ] CORS is configured properly
- [ ] Error states display correctly
- [ ] Loading states display correctly

### Build Verification
- [ ] GoodNews360 Next.js: `npm run lint` passes
- [ ] GoodNews360 Next.js: `npm run build` succeeds
- [ ] Cacophiney Next.js: `npm run lint` passes
- [ ] Cacophiney Next.js: `npm run build` succeeds
- [ ] Eperkins Next.js: Still builds successfully
- [ ] GoodNews360 Python: `python3 -m compileall .` passes
- [ ] Cacophiney Python: `python3 -m compileall .` passes
- [ ] Eperkins Python: Still compiles successfully

---

## Startup Scripts Required

Create `/Users/mac/Desktop/eperkins/scripts/start-all-local.sh`:
- Start all 3 frontends in background
- Start all 3 backends in background
- Log all output to separate files
- Provide URLs when ready

Create `/Users/mac/Desktop/eperkins/scripts/stop-all-local.sh`:
- Stop all running processes
- Clean up PID files

---

## Success Criteria

✅ **Conversion Complete When:**
1. All HTML pages converted to Next.js routes
2. Pixel-perfect visual match at desktop, tablet, mobile
3. All interactions work identically to original
4. All forms connect to Python backends (not Web3Forms)
5. Video generation works end-to-end
6. Certificate creation works end-to-end
7. All 6 services run locally without conflicts
8. All lint and build checks pass
9. All URLs documented and verified
10. Visual verification doc created

---

## Next Steps

1. ✅ **Audit Complete** - This document
2. 🔄 **Study Eperkins architecture in detail**
3. 🔄 **Convert GoodNews360 HTML to Next.js (pixel-perfect)**
4. 🔄 **Convert Cacophiney HTML to Next.js (pixel-perfect)**
5. 🔄 **Add API endpoints to Python backends**
6. 🔄 **Create API clients in Next.js apps**
7. 🔄 **Configure CORS and environment variables**
8. 🔄 **Create startup/shutdown scripts**
9. 🔄 **Test all flows end-to-end**
10. 🔄 **Document all URLs and create visual verification report**

---

**Audit Completed By:** Claude Code
**Date:** July 20, 2026
**Status:** Ready for conversion
