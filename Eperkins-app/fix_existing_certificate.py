#!/usr/bin/env python3
"""
Fix Existing Certificate Video URL

Updates the certificate with ID 14853904-56c2-48fe-bdb8-572d168e604c
to use the correct video URL (port 5001 instead of 5000)
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

def update_certificate_video_url():
    """Update the existing certificate's video URL"""

    cert_uuid = "14853904-56c2-48fe-bdb8-572d168e604c"
    old_url = "http://localhost:5000/videos/single_entry_video.mp4"
    new_url = "http://localhost:5001/videos/single_entry_video.mp4"

    print("=" * 60)
    print("Certificate Video URL Fix")
    print("=" * 60)
    print(f"\nCertificate ID: {cert_uuid}")
    print(f"Old URL: {old_url}")
    print(f"New URL: {new_url}")

    # Note: This requires an API endpoint to update certificates
    # For now, provide manual instructions

    print("\n" + "=" * 60)
    print("Manual Fix Instructions")
    print("=" * 60)

    print("\nTo fix the video URL in the database:")
    print("\n1. Go to your Supabase project dashboard")
    print("2. Navigate to SQL Editor")
    print("3. Run this SQL query:")
    print("\n```sql")
    print(f"UPDATE certificates")
    print(f"SET recording_url = '{new_url}'")
    print(f"WHERE cert_uuid = '{cert_uuid}';")
    print("```")

    print("\n4. Verify the update:")
    print("\n```sql")
    print(f"SELECT cert_uuid, recording_url")
    print(f"FROM certificates")
    print(f"WHERE cert_uuid = '{cert_uuid}';")
    print("```")

    print("\n" + "=" * 60)
    print("Alternative: Recreate Certificate")
    print("=" * 60)
    print("\nOr simply create a new certificate by:")
    print("1. Going to http://localhost:5001")
    print("2. Submitting a new form")
    print("3. The new certificate will have the correct URL")

    print("\n" + "=" * 60)


if __name__ == "__main__":
    update_certificate_video_url()
