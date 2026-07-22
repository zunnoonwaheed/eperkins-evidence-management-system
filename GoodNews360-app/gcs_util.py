import os
from google.cloud import storage


def upload_video_to_gcs(local_path, object_name=None):
    bucket_name = os.getenv("GCS_BUCKET_VIDEOS", "").strip()
    if not bucket_name:
        return None

    object_name = object_name or os.path.basename(local_path)
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)
    blob.upload_from_filename(local_path, content_type="video/mp4")
    return f"gs://{bucket_name}/{object_name}"


def generate_signed_url(object_name):
    bucket_name = os.getenv("GCS_BUCKET_VIDEOS", "").strip()
    if not bucket_name:
        return None

    expires = int(os.getenv("GCS_SIGN_URL_EXP_SECONDS", "86400"))
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)
    return blob.generate_signed_url(expiration=expires, method="GET")
