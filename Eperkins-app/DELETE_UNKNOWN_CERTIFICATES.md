# Delete Unknown Certificates

This guide shows you how to remove all certificates with "Unknown" names from the database.

---

## Method 1: Using SQL (Recommended)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New query**

### Step 2: Preview Certificates to Delete

Copy and paste this SQL to see what will be deleted:

```sql
SELECT
    cert_uuid,
    lead_data->>'firstName' as first_name,
    lead_data->>'lastName' as last_name,
    lead_data->>'fullName' as full_name,
    created_at
FROM certificates
WHERE
    (lead_data->>'firstName' IS NULL OR lead_data->>'firstName' = '')
    AND (lead_data->>'lastName' IS NULL OR lead_data->>'lastName' = '')
    AND (lead_data->>'fullName' IS NULL OR lead_data->>'fullName' = '')
    AND (lead_data->>'first_name' IS NULL OR lead_data->>'first_name' = '')
    AND (lead_data->>'last_name' IS NULL OR lead_data->>'last_name' = '')
ORDER BY created_at DESC;
```

Click **Run** to see the list.

### Step 3: Delete Unknown Certificates

If you're happy with the list, run this DELETE statement:

```sql
DELETE FROM certificates
WHERE
    (lead_data->>'firstName' IS NULL OR lead_data->>'firstName' = '')
    AND (lead_data->>'lastName' IS NULL OR lead_data->>'lastName' = '')
    AND (lead_data->>'fullName' IS NULL OR lead_data->>'fullName' = '')
    AND (lead_data->>'first_name' IS NULL OR lead_data->>'first_name' = '')
    AND (lead_data->>'last_name' IS NULL OR lead_data->>'last_name' = '');
```

### Step 4: Verify

Check remaining certificates:

```sql
SELECT COUNT(*) as remaining_certificates FROM certificates;
```

---

## Method 2: Delete Specific Certificates

If you know the exact certificate IDs to delete:

```sql
-- Replace with actual UUIDs
DELETE FROM certificates
WHERE cert_uuid IN (
    '14853904-56c2-48fe-bdb8-572d168e604c',
    'another-uuid-here'
);
```

---

## Method 3: Using the Admin Interface

If you have an admin UI in your Next.js app:

1. Go to http://localhost:3000/admin/certificates
2. Look for any certificates showing "Unknown" as the name
3. Select and delete them individually

---

## What Certificates Will Be Deleted?

The SQL will delete certificates where:
- No firstName
- No lastName
- No fullName
- No first_name (snake_case)
- No last_name (snake_case)

Basically, any certificate that shows "Unknown" in the name field.

---

## Safety Notes

⚠️ **Important**:
- Always run the SELECT query first to preview
- Deletions cannot be undone
- Make a backup if needed

---

## After Deleting

Once you've cleaned up the old certificates:

1. **Restart Flask app** to load the new certificate payload code
2. **Create a new test certificate** at http://localhost:5001
3. **Verify** the new certificate has:
   - ✓ Name displayed correctly
   - ✓ IP address shown
   - ✓ Signed date shown
   - ✓ Duration shown
   - ✓ All session information

---

## Quick Reference

**Preview unknown certificates:**
```bash
# In Supabase SQL Editor, run:
SELECT cert_uuid, created_at FROM certificates
WHERE lead_data->>'fullName' IS NULL OR lead_data->>'fullName' = '';
```

**Count unknown certificates:**
```sql
SELECT COUNT(*) FROM certificates
WHERE lead_data->>'fullName' IS NULL OR lead_data->>'fullName' = '';
```

**Delete all unknown:**
```sql
DELETE FROM certificates
WHERE lead_data->>'fullName' IS NULL OR lead_data->>'fullName' = '';
```

---

**Need help?** The SQL file is available at:
`/Users/mac/Desktop/eperkins/scripts/delete-unknown-certificates.sql`
