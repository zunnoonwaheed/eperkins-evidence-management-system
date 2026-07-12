"""
Integration tests for Eperkins Certificate API

Tests the certificate creation flow with the real API.
Run these tests against a local or test Eperkins instance.

Usage:
    python test_certificate_integration.py
"""

import os
import sys
from dotenv import load_dotenv
from certificate_payload import build_certificate_payload, get_current_utc_iso
from eperkins_certificate_client import create_eperkins_certificate, strip_signed_url_params

# Load environment variables
load_dotenv()


def test_environment_variables():
    """Test that all required environment variables are present."""
    print("\n=== Testing Environment Variables ===")

    required_vars = [
        "EPERKINS_CERTIFICATE_API_URL",
        "EPERKINS_CERTIFICATE_API_KEY",
        "EPERKINS_COMPANY_KEY",
        "EPERKINS_WEBSITE",
        "EPERKINS_SOURCE_SYSTEM"
    ]

    missing = []
    for var in required_vars:
        value = os.getenv(var)
        if not value:
            missing.append(var)
            print(f"❌ {var}: NOT SET")
        else:
            # Don't print the actual API key
            if "API_KEY" in var:
                print(f"✓ {var}: ***configured***")
            else:
                print(f"✓ {var}: {value}")

    if missing:
        print(f"\n⚠️  Missing variables: {', '.join(missing)}")
        return False

    print("\n✓ All environment variables are configured")
    return True


def test_payload_structure():
    """Test that payload builder creates valid structure."""
    print("\n=== Testing Payload Structure ===")

    test_lead = {
        "First Name": "Test",
        "Last Name": "Lead",
        "Mobile Phone": "555-123-4567",
        "Email": "test@example.com",
        "State": "CA",
        "Has Medicare": "Yes",
        "Ongoing Conditions": "High blood pressure",
        "Contact Consent": "yes",
        "Privacy Terms": "yes",
        "Tax Debt Consent": "yes",
        "IP Address": "192.168.1.100",
        "Receipt Date": "2024-01-15"
    }

    recording_url = "https://storage.googleapis.com/test-bucket/videos/test.mp4"
    recording_storage_path = "gs://test-bucket/videos/test.mp4"

    payload = build_certificate_payload(
        lead=test_lead,
        recording_id=None,
        recording_url=recording_url,
        recording_storage_path=recording_storage_path,
        video_generated_at=get_current_utc_iso()
    )

    # Check required fields
    required_fields = [
        "company_key",
        "website",
        "source_system",
        "lead_id",
        "lead_data",
        "recording_id",
        "recording_url",
        "lead_submitted_at",
        "video_generated_at",
        "recording_type",
        "idempotency_key"
    ]

    missing_fields = []
    for field in required_fields:
        if field not in payload:
            missing_fields.append(field)
            print(f"❌ Missing field: {field}")
        else:
            print(f"✓ {field}: present")

    # Check lead_data structure
    if "lead_data" in payload:
        lead_data = payload["lead_data"]
        lead_required = ["first_name", "last_name", "email", "phone", "form_answers"]
        for field in lead_required:
            if field not in lead_data:
                missing_fields.append(f"lead_data.{field}")
                print(f"❌ Missing lead_data field: {field}")
            else:
                print(f"✓ lead_data.{field}: present")

    if missing_fields:
        print(f"\n❌ Payload validation failed. Missing: {', '.join(missing_fields)}")
        return False

    print(f"\n✓ Payload structure is valid")
    print(f"   Lead ID: {payload['lead_id']}")
    print(f"   Recording ID: {payload['recording_id']}")
    print(f"   Idempotency Key: {payload['idempotency_key']}")

    return True


def test_certificate_creation():
    """Test creating a certificate via the API."""
    print("\n=== Testing Certificate Creation ===")

    test_lead = {
        "First Name": "Integration",
        "Last Name": "Test",
        "Mobile Phone": "555-999-0001",
        "Email": "integration-test@example.com",
        "State": "NY",
        "Has Medicare": "Yes",
        "Ongoing Conditions": "Diabetes, High blood pressure",
        "Contact Consent": "yes",
        "Privacy Terms": "yes",
        "Tax Debt Consent": "yes",
        "IP Address": "192.168.1.200",
        "Receipt Date": "2024-01-20T10:30:00Z"
    }

    recording_url = "https://storage.googleapis.com/test-bucket/videos/integration-test.mp4"
    recording_storage_path = "gs://test-bucket/videos/integration-test.mp4"

    payload = build_certificate_payload(
        lead=test_lead,
        recording_id="test-rec-001",
        recording_url=recording_url,
        recording_storage_path=recording_storage_path,
        video_generated_at=get_current_utc_iso()
    )

    print(f"Creating certificate with idempotency key: {payload['idempotency_key']}")

    result = create_eperkins_certificate(payload)

    if result.get("success"):
        print(f"✓ Certificate created successfully")
        print(f"   Certificate UUID: {result.get('cert_uuid')}")
        print(f"   Certificate URL: {result.get('certificate_url')}")
        print(f"   Status: {result.get('status')}")
        print(f"   Duplicate: {result.get('duplicate')}")

        # Store for duplicate test
        return result
    else:
        print(f"❌ Certificate creation failed")
        print(f"   Error: {result.get('error')}")
        print(f"   Error Type: {result.get('error_type')}")
        return None


def test_duplicate_detection(first_result):
    """Test that sending the same request returns duplicate=true."""
    print("\n=== Testing Duplicate Detection ===")

    if not first_result:
        print("⚠️  Skipping duplicate test (first request failed)")
        return False

    test_lead = {
        "First Name": "Integration",
        "Last Name": "Test",
        "Mobile Phone": "555-999-0001",
        "Email": "integration-test@example.com",
        "State": "NY",
        "Has Medicare": "Yes",
        "Ongoing Conditions": "Diabetes, High blood pressure",
        "Contact Consent": "yes",
        "Privacy Terms": "yes",
        "Tax Debt Consent": "yes",
        "IP Address": "192.168.1.200",
        "Receipt Date": "2024-01-20T10:30:00Z"
    }

    recording_url = "https://storage.googleapis.com/test-bucket/videos/integration-test.mp4"
    recording_storage_path = "gs://test-bucket/videos/integration-test.mp4"

    payload = build_certificate_payload(
        lead=test_lead,
        recording_id="test-rec-001",
        recording_url=recording_url,
        recording_storage_path=recording_storage_path,
        video_generated_at=get_current_utc_iso()
    )

    print(f"Sending duplicate request with same idempotency key: {payload['idempotency_key']}")

    result = create_eperkins_certificate(payload)

    if not result.get("success"):
        print(f"❌ Duplicate request failed")
        print(f"   Error: {result.get('error')}")
        return False

    if result.get("duplicate") != True:
        print(f"❌ Response should have duplicate=true, got: {result.get('duplicate')}")
        return False

    if result.get("cert_uuid") != first_result.get("cert_uuid"):
        print(f"❌ Certificate UUID mismatch")
        print(f"   First: {first_result.get('cert_uuid')}")
        print(f"   Second: {result.get('cert_uuid')}")
        return False

    print(f"✓ Duplicate detection working correctly")
    print(f"   Certificate UUID matches: {result.get('cert_uuid')}")
    print(f"   Duplicate flag: {result.get('duplicate')}")

    return True


def test_url_stripping():
    """Test that signed URL parameters are stripped for logging."""
    print("\n=== Testing URL Parameter Stripping ===")

    test_cases = [
        {
            "input": "https://storage.googleapis.com/bucket/video.mp4?X-Goog-Signature=abc123&Expires=123456",
            "expected": "https://storage.googleapis.com/bucket/video.mp4"
        },
        {
            "input": "https://example.com/video.mp4",
            "expected": "https://example.com/video.mp4"
        },
        {
            "input": None,
            "expected": None
        }
    ]

    all_passed = True
    for i, test in enumerate(test_cases):
        result = strip_signed_url_params(test["input"])
        if result == test["expected"]:
            print(f"✓ Test {i+1}: PASS")
        else:
            print(f"❌ Test {i+1}: FAIL")
            print(f"   Expected: {test['expected']}")
            print(f"   Got: {result}")
            all_passed = False

    return all_passed


def run_all_tests():
    """Run all integration tests."""
    print("=" * 60)
    print("Eperkins Certificate Integration Tests")
    print("=" * 60)

    tests_passed = 0
    tests_failed = 0

    # Test 1: Environment
    if test_environment_variables():
        tests_passed += 1
    else:
        tests_failed += 1
        print("\n⚠️  Cannot continue without environment variables")
        return

    # Test 2: Payload structure
    if test_payload_structure():
        tests_passed += 1
    else:
        tests_failed += 1

    # Test 3: URL stripping
    if test_url_stripping():
        tests_passed += 1
    else:
        tests_failed += 1

    # Test 4: Certificate creation
    first_result = test_certificate_creation()
    if first_result:
        tests_passed += 1
    else:
        tests_failed += 1

    # Test 5: Duplicate detection
    if test_duplicate_detection(first_result):
        tests_passed += 1
    else:
        tests_failed += 1

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    print(f"Tests passed: {tests_passed}")
    print(f"Tests failed: {tests_failed}")

    if tests_failed == 0:
        print("\n✓ All tests passed!")
        return 0
    else:
        print(f"\n❌ {tests_failed} test(s) failed")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
