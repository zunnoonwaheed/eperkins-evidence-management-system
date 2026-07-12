/**
 * Delete Unknown Certificates
 *
 * This script removes all certificates where the name is "Unknown"
 * Run with: npx tsx scripts/delete-unknown-certificates.ts
 */

import { supabaseAdmin } from '../lib/database/supabase-admin';

async function deleteUnknownCertificates() {
  console.log('🗑️  Deleting Unknown Certificates...\n');

  try {
    // Find all certificates where lead_data doesn't have firstName or lastName
    const { data: certificates, error: fetchError } = await supabaseAdmin
      .from('certificates')
      .select('id, cert_uuid, lead_data, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching certificates:', fetchError);
      process.exit(1);
    }

    console.log(`📋 Total certificates found: ${certificates?.length || 0}\n`);

    // Filter certificates with unknown names
    const unknownCerts = certificates?.filter(cert => {
      const leadData = cert.lead_data || {};
      const firstName = leadData.firstName || leadData.first_name || '';
      const lastName = leadData.lastName || leadData.last_name || '';
      const fullName = leadData.fullName || '';

      // Certificate is "unknown" if it has no name fields
      return !firstName && !lastName && !fullName;
    }) || [];

    console.log(`🔍 Found ${unknownCerts.length} certificates with unknown names:\n`);

    if (unknownCerts.length === 0) {
      console.log('✨ No unknown certificates to delete. All good!');
      return;
    }

    // Display certificates to be deleted
    unknownCerts.forEach((cert, index) => {
      console.log(`${index + 1}. Certificate ID: ${cert.cert_uuid}`);
      console.log(`   Created: ${new Date(cert.created_at).toLocaleString()}`);
      console.log(`   Lead Data:`, JSON.stringify(cert.lead_data, null, 2));
      console.log('');
    });

    // Ask for confirmation (in production, you'd want actual user input)
    console.log(`⚠️  WARNING: About to delete ${unknownCerts.length} certificates`);
    console.log('This action cannot be undone!\n');

    // Delete the certificates
    const certIds = unknownCerts.map(cert => cert.id);

    const { error: deleteError } = await supabaseAdmin
      .from('certificates')
      .delete()
      .in('id', certIds);

    if (deleteError) {
      console.error('❌ Error deleting certificates:', deleteError);
      process.exit(1);
    }

    console.log(`✅ Successfully deleted ${unknownCerts.length} unknown certificates!`);
    console.log('\n📊 Remaining certificates:');

    // Show remaining count
    const { count, error: countError } = await supabaseAdmin
      .from('certificates')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`   Total: ${count} certificates`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
deleteUnknownCertificates()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
