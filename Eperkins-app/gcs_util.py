"""
Google Cloud Storage utilities for video upload.
"""

import os
from pathlib import Path
from google.cloud import storage
from datetime import timedelta


def upload_video_to_gcs(local_path, object_name=None, bucket_name=None):
    """
    Upload a video file to Google Cloud Storage.

    Args:
        local_path: Path to local video file
        object_name: Name for the object in GCS (defaults to filename)
        bucket_name: GCS bucket name (from env if not provided)

    Returns:
        gs:// path if successful, None otherwise
    """

    if bucket_name is None:
        bucket_name = os.getenv("GCS_BUCKET_NAME")

    if not bucket_name:
        print("[Error] GCS_BUCKET_NAME not configured")
        return None

    if object_name is None:
        object_name = Path(local_path).name

    try:
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(f"videos/{object_name}")

        blob.upload_from_filename(local_path)

        gs_path = f"gs://{bucket_name}/videos/{object_name}"
        print(f"[GCS] Uploaded to {gs_path}")

        return gs_path

    except Exception as error:
        print(f"[Error] GCS upload failed: {error}")
        return None


def generate_signed_url(object_name, bucket_name=None, expiration_hours=72):
    """
    Generate a signed URL for accessing a video in GCS.

    Args:
        object_name: Name of the object in GCS
        bucket_name: GCS bucket name (from env if not provided)
        expiration_hours: URL expiration time in hours

    Returns:
        Signed URL if successful, None otherwise
    """

    if bucket_name is None:
        bucket_name = os.getenv("GCS_BUCKET_NAME")

    if not bucket_name:
        print("[Error] GCS_BUCKET_NAME not configured")
        return None

    try:
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(f"videos/{object_name}")

        url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(hours=expiration_hours),
            method="GET"
        )

        return url

    except Exception as error:
        print(f"[Error] Signed URL generation failed: {error}")
        return None
