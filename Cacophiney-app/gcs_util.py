import os
import datetime
from google.cloud import storage


def _get_bucket_client():
    bucket_name = os.getenv("GCS_BUCKET_VIDEOS")

    if not bucket_name:
        return None, None

    client = storage.Client()
    bucket = client.bucket(bucket_name)

    return client, bucket


def upload_video_to_gcs(local_path: str, object_name: str | None = None) -> str | None:
    _, bucket = _get_bucket_client()

    if not bucket:
        return None

    blob_name = object_name or os.path.basename(local_path)
    blob = bucket.blob(blob_name)
    blob.upload_from_filename(local_path, content_type="video/mp4")

    return f"gs://{bucket.name}/{blob_name}"


def generate_signed_url(object_name: str, expires_seconds: int | None = None) -> str | None:
    import google.auth
    from google.auth.transport.requests import Request

    client, bucket = _get_bucket_client()

    if not bucket:
        return None

    blob = bucket.blob(object_name)
    exp_seconds = expires_seconds or int(os.getenv("GCS_SIGN_URL_EXP_SECONDS", "86400"))

    credentials, _ = google.auth.default(
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )
    credentials.refresh(Request())

    service_account_email = getattr(credentials, "service_account_email", None)

    if not service_account_email:
        service_account_email = os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "")

    return blob.generate_signed_url(
        expiration=datetime.timedelta(seconds=exp_seconds),
        method="GET",
        version="v4",
        service_account_email=service_account_email,
        access_token=credentials.token,
        response_disposition=f"attachment; filename={os.path.basename(object_name)}",
    )
