# Supabase Database Setup Instructions

## Step 1: Run Migration SQL

Go to: https://supabase.com/dashboard/project/xwiosziupbgcaswegxvw/sql/new

Copy and paste the entire contents of:
`supabase/migrations/001_create_certificate_tables.sql`

Then click "Run" or press Cmd/Ctrl + Enter.

## Step 2: Run Company Seed SQL

In the same SQL Editor, create a new query.

Copy and paste the entire contents of:
`supabase/seed.sql`

Then click "Run".

You should see "Success" with 4 rows inserted (or "ON CONFLICT DO NOTHING" if re-running).

## Step 3: Seed Certificates

Back in your terminal, run:

```bash
npm run seed:certificates
```

You should see:
```
🌱 Starting certificate seeding...
✓ Found company: MyRPMCare (uuid)
✓ Created certificate: 9f4a1c72-2d8e-4f01-91b3-1c7e6a9d8b44 (Shridhar Ratnam)
✓ Created certificate: b71d3f89-a6c0-4b2f-bf97-582e9d1e3c21 (Gary Polsley)
✓ Created certificate: 17c9e2d5-6a3b-4127-8e9f-0ab3d65f7c98 (Ashley Rodriguez)

📊 Seeding Summary:
   Created: 3
   Skipped: 0
   Total: 3

✅ Certificate seeding completed!
```

## Step 4: Test the Application

```bash
npm run dev
```

Then visit:
- http://localhost:3000/certificates
- http://localhost:3000/certificates/9f4a1c72-2d8e-4f01-91b3-1c7e6a9d8b44
- http://localhost:3000/admin/certificates

All three sample certificates should load from your Supabase database!

## Verify in Supabase

You can also check your data in Supabase:
- Table Editor: https://supabase.com/dashboard/project/xwiosziupbgcaswegxvw/editor
- Companies table: Should have 4 companies
- Certificates table: Should have 3 certificates
