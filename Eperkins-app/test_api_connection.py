"""
Quick test to verify Next.js Eperkins app is running
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

def test_nextjs_running():
    """Check if Next.js app is running"""
    print("\n=== Testing Next.js Connection ===")

    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✓ Next.js app is running on http://localhost:3000")
            return True
        else:
            print(f"⚠️  Next.js responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to http://localhost:3000")
        print("   Please start the Next.js app with: npm run dev")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_certificate_api():
    """Test certificate API endpoint"""
    print("\n=== Testing Certificate API ===")

    api_url = os.getenv("EPERKINS_CERTIFICATE_API_URL")
    api_key = os.getenv("EPERKINS_CERTIFICATE_API_KEY")

    if not api_url or not api_key:
        print("❌ Environment variables not configured")
        return False

    print(f"API URL: {api_url}")
    print(f"API Key: ***{api_key[-6:]}")

    # Minimal valid payload
    payload = {
        "company_key": "myrpmcare",
        "website": "myrpmcare.com",
        "source_system": "test",
        "lead_id": "test_connection",
        "lead_data": {
            "first_name": "Test",
            "last_name": "Connection",
            "email": "test@example.com",
            "phone": "555-0000",
            "form_answers": {}
        },
        "recording_id": "test_rec_001",
        "recording_url": "https://example.com/test.mp4",
        "lead_submitted_at": "2024-01-01T00:00:00Z",
        "video_generated_at": "2024-01-01T00:00:00Z",
        "recording_type": "test",
        "idempotency_key": "test:connection:001"
    }

    try:
        response = requests.post(
            api_url,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "X-API-Key": api_key
            },
            timeout=10
        )

        print(f"Response Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print("✓ Certificate API is working!")
            print(f"  Certificate UUID: {data.get('cert_uuid')}")
            print(f"  Certificate URL: {data.get('certificate_url')}")
            return True
        else:
            print(f"❌ API returned {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to certificate API")
        print(f"   Check that Next.js is running on http://localhost:3000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Eperkins API Connection Test")
    print("=" * 60)

    nextjs_ok = test_nextjs_running()

    if nextjs_ok:
        api_ok = test_certificate_api()

        if api_ok:
            print("\n✅ All connections working!")
            print("\nYou can now:")
            print("  1. Start the Python app: python3 app.py")
            print("  2. Navigate to http://localhost:5000")
            print("  3. Generate videos with certificates")
        else:
            print("\n⚠️  Next.js is running but certificate API has issues")
            print("\nPossible fixes:")
            print("  1. Check API key in .env.local: CERT_API_KEY_MYRPMCARE")
            print("  2. Verify Supabase is configured")
            print("  3. Check Next.js console for errors")
    else:
        print("\n❌ Next.js app is not running")
        print("\nTo start Next.js:")
        print("  cd /Users/mac/Desktop/eperkins")
        print("  npm run dev")
