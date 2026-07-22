"""
Eperkins Certificate API Client

Handles communication with the Eperkins certificate creation API.
"""

import os
import time
import requests
from typing import Dict, Any, Optional


def create_eperkins_certificate(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a certificate using the Eperkins API.

    Args:
        payload: Certificate creation payload matching the API schema

    Returns:
        dict with structure:
        {
            "success": bool,
            "cert_uuid": str (if successful),
            "certificate_url": str (if successful),
            "duplicate": bool (if successful),
            "status": str (if successful),
            "error": str (if failed),
            "error_type": str (if failed)
        }
    """

    api_url = os.getenv("EPERKINS_CERTIFICATE_API_URL")
    api_key = os.getenv("EPERKINS_CERTIFICATE_API_KEY")

    if not api_url:
        return {
            "success": False,
            "error": "EPERKINS_CERTIFICATE_API_URL not configured",
            "error_type": "configuration_error"
        }

    if not api_key:
        return {
            "success": False,
            "error": "EPERKINS_CERTIFICATE_API_KEY not configured",
            "error_type": "configuration_error"
        }

    max_attempts = 3
    attempt = 0

    while attempt < max_attempts:
        attempt += 1

        try:
            print(f"[Eperkins] Certificate creation attempt {attempt}/{max_attempts}")

            response = requests.post(
                api_url,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "X-API-Key": api_key
                },
                timeout=30
            )

            # Success: 200 (duplicate) or 201 (created)
            if response.status_code in [200, 201]:
                try:
                    data = response.json()
                    certificate = data.get("certificate", {})

                    if data.get("duplicate"):
                        print(f"[Eperkins] Duplicate certificate detected: {certificate.get('cert_uuid')}")
                    else:
                        print(f"[Eperkins] Certificate created: {certificate.get('cert_uuid')}")

                    return {
                        "success": True,
                        "cert_uuid": certificate.get("cert_uuid"),
                        "certificate_url": certificate.get("certificate_url"),
                        "duplicate": data.get("duplicate", False),
                        "status": certificate.get("status", "generated")
                    }

                except ValueError as json_error:
                    print(f"[Eperkins] Invalid JSON response: {json_error}")
                    return {
                        "success": False,
                        "error": "Invalid JSON response from API",
                        "error_type": "invalid_response"
                    }

            # Retry logic for server errors
            if response.status_code in [429, 500, 502, 503, 504]:
                if attempt < max_attempts:
                    wait_time = (2 ** attempt) * 0.5
                    print(f"[Eperkins] HTTP {response.status_code}, retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue

            # Don't retry client errors
            if response.status_code in [400, 401, 403, 404]:
                error_msg = f"HTTP {response.status_code}"
                error_details = None
                try:
                    error_data = response.json()
                    error_msg = error_data.get("error", error_msg)
                    error_details = error_data.get("errors")

                    # Log detailed validation errors if present
                    if error_details:
                        print(f"[Eperkins] Validation errors:")
                        for err in error_details:
                            print(f"  - {err.get('field')}: {err.get('message')}")
                except:
                    pass

                print(f"[Eperkins] Client error: {error_msg}")
                result = {
                    "success": False,
                    "error": error_msg,
                    "error_type": "client_error",
                    "status_code": response.status_code
                }
                if error_details:
                    result["errors"] = error_details
                return result

            # Other errors
            print(f"[Eperkins] HTTP {response.status_code}: {response.text[:200]}")
            return {
                "success": False,
                "error": f"HTTP {response.status_code}",
                "error_type": "http_error",
                "status_code": response.status_code
            }

        except requests.exceptions.Timeout:
            if attempt < max_attempts:
                wait_time = (2 ** attempt) * 0.5
                print(f"[Eperkins] Request timeout, retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            else:
                print("[Eperkins] Request timeout after all retries")
                return {
                    "success": False,
                    "error": "Request timeout",
                    "error_type": "timeout"
                }

        except requests.exceptions.ConnectionError as conn_error:
            if attempt < max_attempts:
                wait_time = (2 ** attempt) * 0.5
                print(f"[Eperkins] Connection error, retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            else:
                print(f"[Eperkins] Connection error after all retries: {conn_error}")
                return {
                    "success": False,
                    "error": "Connection failed",
                    "error_type": "connection_error"
                }

        except Exception as error:
            print(f"[Eperkins] Unexpected error: {error}")
            return {
                "success": False,
                "error": "Unexpected error",
                "error_type": "unknown_error"
            }

    return {
        "success": False,
        "error": "Max retries exceeded",
        "error_type": "max_retries"
    }


def strip_signed_url_params(url: Optional[str]) -> Optional[str]:
    """
    Strip query parameters from signed URLs for safe logging.

    Args:
        url: Video URL (potentially with signed parameters)

    Returns:
        URL with query parameters removed, or None if url is None
    """

    if not url:
        return None

    if "?" in url:
        return url.split("?")[0]

    return url
