"""
Certificate Payload Builder for Cacophiney

Constructs certificate creation payloads from lead data.
"""

import os
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional


def get_current_utc_iso() -> str:
    """
    Get current UTC timestamp in ISO-8601 format with Z notation.

    Returns:
        ISO-8601 formatted UTC timestamp string (e.g., 2026-07-13T10:30:45.123Z)
    """
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')


def parse_or_current_timestamp(timestamp_value: Optional[str]) -> str:
    """
    Parse a timestamp string or return current UTC time.

    Args:
        timestamp_value: Timestamp string (various formats) or None

    Returns:
        ISO-8601 formatted UTC timestamp
    """

    if not timestamp_value or str(timestamp_value).strip() == "":
        return get_current_utc_iso()

    timestamp_str = str(timestamp_value).strip()

    # Already ISO-8601 format
    if "T" in timestamp_str and "Z" in timestamp_str:
        return timestamp_str

    if "T" in timestamp_str:
        return f"{timestamp_str}Z" if not timestamp_str.endswith("Z") else timestamp_str

    # Try to parse common formats
    try:
        # Try YYYY-MM-DD format
        if len(timestamp_str) == 10 and timestamp_str.count("-") == 2:
            dt = datetime.strptime(timestamp_str, "%Y-%m-%d")
            return dt.replace(tzinfo=timezone.utc).isoformat().replace('+00:00', 'Z')

        # Try YYYY-MM-DD HH:MM:SS format
        if " " in timestamp_str and ":" in timestamp_str:
            dt = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
            return dt.replace(tzinfo=timezone.utc).isoformat().replace('+00:00', 'Z')

    except ValueError:
        pass

    # Fallback to current time if parsing fails
    print(f"[Warning] Could not parse timestamp '{timestamp_str}', using current time")
    return get_current_utc_iso()


def generate_lead_id_from_data(lead_data: Dict[str, Any]) -> str:
    """
    Generate a consistent lead ID from lead data if none exists.

    Args:
        lead_data: Dictionary containing lead information

    Returns:
        Generated lead ID string
    """

    # Create a hash from key fields
    key_fields = [
        str(lead_data.get("first_name", "")),
        str(lead_data.get("last_name", "")),
        str(lead_data.get("email", "")),
        str(lead_data.get("phone", "")),
        str(lead_data.get("submitted_at", ""))
    ]

    hash_input = "|".join(key_fields).lower()
    hash_value = hashlib.sha256(hash_input.encode()).hexdigest()[:12]

    return f"lead_{hash_value}"


def generate_recording_id_from_data(
    lead_id: str,
    recording_url: str,
    video_generated_at: str
) -> str:
    """
    Generate a consistent recording ID if none exists.

    Args:
        lead_id: Lead identifier
        recording_url: URL of the recording
        video_generated_at: Timestamp of video generation

    Returns:
        Generated recording ID string
    """

    # Extract filename from URL if possible
    filename = recording_url.split("/")[-1].split("?")[0]

    hash_input = f"{lead_id}|{filename}|{video_generated_at}".lower()
    hash_value = hashlib.sha256(hash_input.encode()).hexdigest()[:12]

    return f"rec_{hash_value}"


def build_certificate_payload(
    lead: Dict[str, Any],
    recording_id: Optional[str],
    recording_url: str,
    recording_storage_path: Optional[str] = None,
    video_generated_at: Optional[str] = None
) -> Dict[str, Any]:
    """
    Build a certificate creation payload from lead data.

    Args:
        lead: Dictionary containing lead form data with keys:
            - First Name, Last Name, Mobile Phone, Email
            - Tax Debt Amount
            - Receipt Date (optional - original submission timestamp)
            - IP Address (optional)
        recording_id: Unique identifier for the recording (generated if None)
        recording_url: Final uploaded video URL
        recording_storage_path: Storage path (e.g., GCS path)
        video_generated_at: ISO-8601 timestamp when video was completed

    Returns:
        Dictionary matching Eperkins certificate API schema
    """

    company_key = os.getenv("EPERKINS_COMPANY_KEY", "cacophiney")
    website = os.getenv("EPERKINS_WEBSITE", "cacophiney.com")
    source_system = os.getenv("EPERKINS_SOURCE_SYSTEM", "cacophiney-video-automation")

    # Extract and clean lead data
    first_name = str(lead.get("First Name", "")).strip()
    last_name = str(lead.get("Last Name", "")).strip()
    email = str(lead.get("Email", "")).strip()
    phone = str(lead.get("Mobile Phone", "")).strip()

    # Parse timestamps
    lead_submitted_at = parse_or_current_timestamp(lead.get("Receipt Date"))
    video_generated_at_iso = parse_or_current_timestamp(video_generated_at)

    # Generate or use existing IDs
    lead_id = generate_lead_id_from_data({
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "phone": phone,
        "submitted_at": lead_submitted_at
    })

    if not recording_id:
        recording_id = generate_recording_id_from_data(
            lead_id,
            recording_url,
            video_generated_at_iso
        )

    # Build form answers with all available data
    form_answers = {}

    # Add Cacophiney-specific fields
    if lead.get("Tax Debt Amount"):
        form_answers["tax_debt_amount"] = str(lead.get("Tax Debt Amount")).strip()

    if lead.get("Contact Consent"):
        form_answers["contact_consent"] = str(lead.get("Contact Consent")).strip()

    # Extract IP address for both form_answers and lead_data
    ip_address = str(lead.get("IP Address", "")).strip()
    if ip_address:
        form_answers["ip_address"] = ip_address

    # Build idempotency key
    idempotency_key = f"{company_key}:{lead_id}:{recording_id}"

    # Build lead_data with only non-empty values for optional fields
    # Use camelCase for compatibility with TypeScript frontend
    lead_data = {}

    if first_name:
        lead_data["firstName"] = first_name
    if last_name:
        lead_data["lastName"] = last_name
    if email:
        lead_data["email"] = email
    if phone:
        lead_data["phone"] = phone
    if form_answers:
        lead_data["form_answers"] = form_answers

    # Add fullName for certificate display
    if first_name or last_name:
        lead_data["fullName"] = f"{first_name} {last_name}".strip()

    # Add certificate display fields (camelCase for TypeScript)
    if ip_address:
        lead_data["ipAddress"] = ip_address

    # Signed date is when the lead submitted the form
    lead_data["signedDate"] = datetime.fromisoformat(lead_submitted_at.replace('Z', '+00:00')).strftime('%b %d, %Y')
    lead_data["signedDateISO"] = lead_submitted_at

    # Date and time of visit (when form was submitted)
    visit_datetime = datetime.fromisoformat(lead_submitted_at.replace('Z', '+00:00'))
    lead_data["dateOfVisit"] = visit_datetime.strftime('%b %d, %Y')
    lead_data["timeOfVisit"] = visit_datetime.strftime('%I:%M:%S %p UTC')

    # Duration - calculate from lead_submitted_at to video_generated_at
    try:
        submitted_dt = datetime.fromisoformat(lead_submitted_at.replace('Z', '+00:00'))
        generated_dt = datetime.fromisoformat(video_generated_at_iso.replace('Z', '+00:00'))
        duration_seconds = int((generated_dt - submitted_dt).total_seconds())

        # Format duration as "X minutes, Y seconds"
        minutes = duration_seconds // 60
        seconds = duration_seconds % 60
        lead_data["duration"] = f"{minutes} minutes, {seconds} seconds"
    except Exception as duration_error:
        print(f"[Warning] Could not calculate duration: {duration_error}")
        lead_data["duration"] = "N/A"

    # Add consent version (from environment or default)
    lead_data["consentVersion"] = os.getenv("CONSENT_VERSION", "1.0")

    # Video format
    lead_data["videoFormat"] = "mp4"

    # Construct final payload
    payload = {
        "company_key": company_key,
        "website": website,
        "source_system": source_system,
        "lead_id": lead_id,
        "lead_data": lead_data,
        "recording_id": recording_id,
        "recording_url": recording_url,
        "lead_submitted_at": lead_submitted_at,
        "video_generated_at": video_generated_at_iso,
        "recording_type": "reconstructed_historical_recording",
        "idempotency_key": idempotency_key
    }

    # Add optional storage path if available
    if recording_storage_path:
        payload["recording_storage_path"] = recording_storage_path

    return payload
