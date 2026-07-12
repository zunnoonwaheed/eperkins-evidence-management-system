#!/usr/bin/env python3
"""
Check Certificates in Eperkins System

This script helps you view certificates that were created through the automation system.
"""

import os
import requests
from dotenv import load_dotenv
from tabulate import tabulate

# Load environment variables
load_dotenv()


def list_recent_certificates(limit=10):
    """
    List recent certificates from the local database via API.

    Note: This requires a database query endpoint to be implemented.
    For now, this shows how to structure the query.
    """

    api_url = os.getenv("EPERKINS_CERTIFICATE_API_URL", "http://localhost:3000/api/certificates/create")
    base_url = api_url.rsplit("/api/", 1)[0]

    print("=" * 80)
    print("Eperkins Certificate Checker")
    print("=" * 80)
    print(f"\nNext.js App URL: {base_url}")
    print(f"\nTo view certificates in the browser:")
    print(f"  1. Open: {base_url}/certificates")
    print(f"  2. Or view a specific certificate: {base_url}/certificates/[cert_uuid]")

    print("\n" + "=" * 80)
    print("Database Check")
    print("=" * 80)

    # Check if we can access the certificate via the test data
    company_key = os.getenv("EPERKINS_COMPANY_KEY", "myrpmcare")

    print(f"\nCompany Key: {company_key}")
    print(f"\nTo check certificates in the database, you can:")
    print(f"  1. Use the Next.js admin interface (if available)")
    print(f"  2. Query Supabase directly")
    print(f"  3. Check the terminal output when creating certificates")

    print("\n" + "=" * 80)
    print("Recent Certificate Log")
    print("=" * 80)

    # Try to read from a log file if it exists
    log_file = os.path.join(os.path.dirname(__file__), "certificate_log.txt")

    if os.path.exists(log_file):
        print(f"\nReading from: {log_file}")
        with open(log_file, 'r') as f:
            lines = f.readlines()
            if lines:
                print("\nLast 10 certificate creations:")
                for line in lines[-10:]:
                    print(line.strip())
            else:
                print("\nNo certificates logged yet.")
    else:
        print("\nNo certificate log file found.")
        print("Certificates will be logged when created through the Flask app.")

    print("\n" + "=" * 80)


def check_specific_certificate(cert_uuid):
    """
    Check a specific certificate by UUID.
    """
    api_url = os.getenv("EPERKINS_CERTIFICATE_API_URL", "http://localhost:3000/api/certificates/create")
    base_url = api_url.rsplit("/api/", 1)[0]

    cert_url = f"{base_url}/certificates/{cert_uuid}"

    print(f"\nCertificate URL: {cert_url}")
    print(f"\nOpen this URL in your browser to view the certificate.")

    # Try to check if the certificate exists
    try:
        response = requests.get(cert_url, timeout=5)
        if response.status_code == 200:
            print(f"✓ Certificate exists and is accessible")
        elif response.status_code == 404:
            print(f"✗ Certificate not found")
        else:
            print(f"? Certificate status unknown (HTTP {response.status_code})")
    except Exception as e:
        print(f"Could not check certificate: {e}")


def main():
    import sys

    if len(sys.argv) > 1:
        cert_uuid = sys.argv[1]
        print(f"\nChecking certificate: {cert_uuid}")
        check_specific_certificate(cert_uuid)
    else:
        list_recent_certificates()


if __name__ == "__main__":
    main()
