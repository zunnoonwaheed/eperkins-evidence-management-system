-- Delete Unknown Certificates
-- Run this in your Supabase SQL Editor to remove all certificates with unknown names

-- First, let's see what we're deleting (PREVIEW ONLY - comment out when ready to delete)
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

-- Once you've reviewed the above, uncomment the DELETE statement below to actually delete them

/*
DELETE FROM certificates
WHERE
    (lead_data->>'firstName' IS NULL OR lead_data->>'firstName' = '')
    AND (lead_data->>'lastName' IS NULL OR lead_data->>'lastName' = '')
    AND (lead_data->>'fullName' IS NULL OR lead_data->>'fullName' = '')
    AND (lead_data->>'first_name' IS NULL OR lead_data->>'first_name' = '')
    AND (lead_data->>'last_name' IS NULL OR lead_data->>'last_name' = '');
*/

-- After deleting, verify what's left
-- SELECT COUNT(*) as remaining_certificates FROM certificates;
