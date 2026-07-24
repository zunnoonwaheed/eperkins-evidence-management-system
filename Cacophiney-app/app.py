from flask import Flask, render_template, request, redirect, send_from_directory, flash, jsonify
from flask_cors import CORS
from pathlib import Path
import pandas as pd
import os

from automation import fill_form_and_record, normalize_tax_debt_value
from gcs_util import upload_video_to_gcs, generate_signed_url
from eperkins_certificate_client import create_eperkins_certificate, strip_signed_url_params
from certificate_payload import build_certificate_payload, get_current_utc_iso


app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-change-in-production")

# Configure CORS for Next.js frontend
CORS(app, origins=[os.getenv("FRONTEND_URL", "http://localhost:3002")])

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
VIDEOS_FOLDER = BASE_DIR / "videos"

UPLOAD_FOLDER.mkdir(exist_ok=True)
VIDEOS_FOLDER.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {"xlsx", "csv"}

app.config["UPLOAD_FOLDER"] = str(UPLOAD_FOLDER)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_video_link(video_path, video_filename):
    """
    Upload video to GCS and return the final video URL with metadata.

    Returns:
        dict with structure:
        {
            "video_url": str,
            "storage_path": str (optional, if GCS upload succeeded),
            "recording_id": str (generated from filename)
        }
    """
    # Default to local video URL (full URL required for certificate API)
    # Use APP_URL from environment or construct from Flask request
    app_url = os.getenv("APP_URL", "http://localhost:5000")
    local_video_url = f"{app_url}/videos/{video_filename}"

    result = {
        "video_url": local_video_url,
        "storage_path": None,
        "recording_id": video_filename.replace(".mp4", "").replace(".webm", "")
    }

    try:
        gs_path = upload_video_to_gcs(str(video_path), object_name=video_filename)
        if gs_path:
            result["storage_path"] = gs_path

            try:
                signed_url = generate_signed_url(video_filename)
                if signed_url:
                    result["video_url"] = signed_url
                    return result
            except Exception as signed_error:
                print(f"[Error] Failed to generate signed URL: {signed_error}")
    except Exception as upload_error:
        print(f"[Error] Failed to upload video to GCS: {upload_error}")

    return result


def create_certificate_for_lead(lead_data, recording_id, recording_url, recording_storage_path=None):
    """
    Create an Eperkins certificate for a processed lead.

    Args:
        lead_data: Dictionary or Series with lead form data
        recording_id: Unique recording identifier
        recording_url: Final video URL
        recording_storage_path: Optional GCS storage path

    Returns:
        dict with structure:
        {
            "success": bool,
            "cert_uuid": str (if successful),
            "certificate_url": str (if successful),
            "duplicate": bool (if successful),
            "status": str (if successful),
            "error": str (if failed),
            "warning": str (if failed)
        }
    """

    # Convert Series to dict if needed
    if hasattr(lead_data, 'to_dict'):
        lead_dict = lead_data.to_dict()
    else:
        lead_dict = lead_data

    try:
        video_generated_at = get_current_utc_iso()

        payload = build_certificate_payload(
            lead=lead_dict,
            recording_id=recording_id,
            recording_url=recording_url,
            recording_storage_path=recording_storage_path,
            video_generated_at=video_generated_at
        )

        # Log safe identifiers only
        print(f"[Certificate] Creating certificate for lead_id: {payload['lead_id']}")
        print(f"[Certificate] Recording ID: {payload['recording_id']}")
        print(f"[Certificate] Video URL (safe): {strip_signed_url_params(recording_url)}")

        certificate_result = create_eperkins_certificate(payload)

        if certificate_result.get("success"):
            cert_uuid = certificate_result.get('cert_uuid')
            cert_url = certificate_result.get('certificate_url')
            print(f"[Certificate] Success: {cert_uuid}")
            print(f"[Certificate] URL: {cert_url}")
        else:
            print(f"[Certificate] Failed: {certificate_result.get('error')}")
            certificate_result["warning"] = "Video completed, but certificate creation failed."

        return certificate_result

    except Exception as error:
        print(f"[Certificate] Unexpected error: {error}")
        return {
            "success": False,
            "error": "Certificate creation failed",
            "warning": "Video completed, but certificate creation failed."
        }


def normalize_col_name(value):
    return (
        str(value)
        .strip()
        .lower()
        .replace("_", " ")
        .replace("-", " ")
        .replace(".", " ")
    )


def normalize_yes_no_default_yes(value):
    value = str(value).strip()

    if not value:
        return "yes"

    value_lower = value.lower()

    if value_lower in {"yes", "y", "true", "1", "checked"}:
        return "yes"

    if value_lower in {"no", "n", "false", "0", "unchecked"}:
        return "no"

    return value


def _normalize_dataframe(df):
    """
    Normalizes uploaded CSV/XLSX files into the fields needed by the
    Cacophinney callback form.
    """

    if df is None or df.empty:
        return None

    original_cols = list(df.columns)

    field_aliases = {
        "First Name": [
            "first name",
            "firstname",
            "given name",
            "first",
        ],
        "Last Name": [
            "last name",
            "lastname",
            "surname",
            "family name",
            "last",
        ],
        "Mobile Phone": [
            "mobile phone",
            "mobile",
            "phone",
            "phone number",
            "mobile number",
            "contact number",
            "cell",
            "cell phone",
        ],
        "Email": [
            "email",
            "email address",
            "e mail",
        ],
        "Tax Debt Amount": [
            "tax debt amount",
            "tax debt",
            "debt amount",
            "amount owed",
            "amount of tax debt",
            "tax amount",
            "irs debt",
        ],
        "Contact Consent": [
            "contact consent",
            "tcpa",
            "tcpa consent",
            "consent",
            "cacophinney consent",
            "partner consent",
        ],
        "IP Address": [
            "ip address",
            "ip",
            "client ip",
            "lead ip",
            "visitor ip",
            "user ip",
        ],
        "Receipt Date": [
            "receipt date",
            "consent receipt date",
            "submission date",
            "submission consent date",
            "consent date",
            "demo date",
            "timestamp date",
            "signed date",
        ],
    }

    normalized_source_cols = {
        col: normalize_col_name(col)
        for col in original_cols
    }

    mapped = {}

    for target_field, aliases in field_aliases.items():
        for source_col, normalized_col in normalized_source_cols.items():
            if normalized_col in aliases:
                mapped[target_field] = source_col
                break

        if target_field not in mapped:
            for source_col, normalized_col in normalized_source_cols.items():
                if any(alias in normalized_col for alias in aliases):
                    mapped[target_field] = source_col
                    break

    output = pd.DataFrame()

    for target_field in field_aliases.keys():
        source_col = mapped.get(target_field)

        if source_col is not None and source_col in df.columns:
            output[target_field] = df[source_col]
        else:
            output[target_field] = ""

    for col in output.columns:
        output[col] = output[col].fillna("").astype(str)

    output["Tax Debt Amount"] = output["Tax Debt Amount"].apply(normalize_tax_debt_value)
    output["Contact Consent"] = output["Contact Consent"].apply(normalize_yes_no_default_yes)
    output["IP Address"] = output["IP Address"].astype(str).str.strip()
    output["Receipt Date"] = output["Receipt Date"].astype(str).str.strip()

    return output


def _load_table(filepath, ext):
    """
    Reads CSV/XLSX and tries normal header mode first.
    If that fails or the important fields are empty, retries with header=None.
    """

    df = None

    try:
        if ext == "csv":
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
    except Exception as error:
        print(f"[Error] Failed to read uploaded file with headers: {error}")
        df = None

    norm = _normalize_dataframe(df) if df is not None else None

    needs_retry = (
        norm is None
        or norm.empty
        or (
            norm["First Name"].astype(str).str.strip().eq("").all()
            and norm["Mobile Phone"].astype(str).str.strip().eq("").all()
        )
    )

    if needs_retry:
        try:
            if ext == "csv":
                df2 = pd.read_csv(filepath, header=None)
            else:
                df2 = pd.read_excel(filepath, header=None)

            fallback_columns = [
                "First Name",
                "Last Name",
                "Mobile Phone",
                "Email",
                "Tax Debt Amount",
                "Contact Consent",
                "IP Address",
                "Receipt Date",
            ]

            df2.columns = fallback_columns[: len(df2.columns)]
            norm = _normalize_dataframe(df2)

        except Exception as error:
            print(f"[Error] Failed to read uploaded file without headers: {error}")

    return norm


@app.route("/", methods=["GET", "POST"])
def home():
    if request.method == "POST":
        mode = request.form.get("mode", "excel")

        if mode == "single":
            single_data = {
                "First Name": request.form.get("first_name", ""),
                "Last Name": request.form.get("last_name", ""),
                "Mobile Phone": request.form.get("mobile_phone", ""),
                "Email": request.form.get("email", ""),
                "Tax Debt Amount": request.form.get("tax_debt_amount", ""),
                "Contact Consent": request.form.get("contact_consent", "yes"),
                "IP Address": request.form.get("ip_address", ""),
                "Receipt Date": request.form.get("receipt_date", ""),
            }

            required_fields = [
                single_data["First Name"],
                single_data["Last Name"],
                single_data["Mobile Phone"],
                single_data["Email"],
                single_data["Tax Debt Amount"],

            ]

            if not all(str(field).strip() for field in required_fields):
                flash("First Name, Last Name, Mobile Phone, and Tax Debt Amount are required.")
                return redirect(request.url)

            single_data["Tax Debt Amount"] = normalize_tax_debt_value(single_data["Tax Debt Amount"])
            single_data["Contact Consent"] = normalize_yes_no_default_yes(single_data["Contact Consent"])
            single_data["IP Address"] = str(single_data["IP Address"]).strip()
            single_data["Receipt Date"] = str(single_data["Receipt Date"]).strip()

            video_filename = "single_entry_video.mp4"
            video_path = VIDEOS_FOLDER / video_filename

            single_row = pd.Series(single_data)
            fill_form_and_record(single_row, video_path)

            # Upload video and get final URL
            upload_result = save_video_link(video_path, video_filename)
            video_url = upload_result["video_url"]
            recording_id = upload_result["recording_id"]
            storage_path = upload_result.get("storage_path")

            # Create certificate after successful video upload
            certificate_result = create_certificate_for_lead(
                lead_data=single_row,
                recording_id=recording_id,
                recording_url=video_url,
                recording_storage_path=storage_path
            )

            # Prepare result data
            result_data = {
                "video": {
                    "url": video_url,
                    "success": True
                },
                "certificate": certificate_result
            }

            return render_template(
                "results.html",
                video_links=[video_url],
                results=[result_data],
                mode="single",
            )

        if "file" not in request.files:
            flash("No file uploaded.")
            return redirect(request.url)

        file = request.files["file"]

        if file.filename == "":
            flash("No selected file.")
            return redirect(request.url)

        if not allowed_file(file.filename):
            flash("Please upload a valid CSV or XLSX file.")
            return redirect(request.url)

        filepath = UPLOAD_FOLDER / file.filename
        file.save(filepath)

        ext = file.filename.rsplit(".", 1)[1].lower()
        df = _load_table(filepath, ext)

        if df is None or df.empty:
            flash("Could not read the spreadsheet. Please check the file and try again.")
            return redirect(request.url)

        required_columns = ["First Name", "Last Name", "Mobile Phone", "Tax Debt Amount"]

        missing_required_rows = []

        for idx, row in df.iterrows():
            missing = [
                col for col in required_columns
                if not str(row.get(col, "")).strip()
            ]

            if missing:
                missing_required_rows.append((idx + 1, missing))

        if missing_required_rows:
            first_bad_row, missing_cols = missing_required_rows[0]
            flash(
                f"Row {first_bad_row} is missing required fields: {', '.join(missing_cols)}."
            )
            return redirect(request.url)

        video_links = []
        results = []

        for idx, row in df.iterrows():
            video_filename = f"cacophinney_video_{idx + 1}.mp4"
            video_path = VIDEOS_FOLDER / video_filename

            fill_form_and_record(row, video_path)

            # Upload video and get final URL
            upload_result = save_video_link(video_path, video_filename)
            video_url = upload_result["video_url"]
            recording_id = upload_result["recording_id"]
            storage_path = upload_result.get("storage_path")

            video_links.append(video_url)

            # Create certificate after successful video upload
            certificate_result = create_certificate_for_lead(
                lead_data=row,
                recording_id=recording_id,
                recording_url=video_url,
                recording_storage_path=storage_path
            )

            # Store result data
            result_data = {
                "video": {
                    "url": video_url,
                    "success": True
                },
                "certificate": certificate_result
            }
            results.append(result_data)

        return render_template(
            "results.html",
            video_links=video_links,
            results=results,
            mode="excel",
        )

    return render_template("upload.html")


@app.route("/videos/<filename>")
def videos(filename):
    return send_from_directory(VIDEOS_FOLDER, filename)


# ========================================
# JSON API Routes for Next.js Frontend
# ========================================

@app.route("/api/health", methods=["GET"])
def api_health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "cacophiney"}), 200


@app.route("/api/generate/single", methods=["POST"])
def api_generate_single():
    """
    JSON API endpoint for single lead video generation.
    Expects JSON payload with lead data.
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400

        # Map JSON field names to expected format
        lead_data = {
            "First Name": data.get("firstName", ""),
            "Last Name": data.get("lastName", ""),
            "Mobile Phone": data.get("phone", ""),
            "Email": data.get("email", ""),
            "ZIP Code": data.get("zipCode", ""),
            "Tax Debt": normalize_tax_debt_value(data.get("debtAmount", "")),
            "Debt Type": data.get("debtType", ""),
            "Unfiled Returns": data.get("unfiled", ""),
            "Enforcement Status": data.get("enforcement", ""),
            "Income Type": data.get("income", ""),
            "Contact Consent": "yes" if data.get("tcpaConsent") else "no",
            "IP Address": data.get("ipAddress", ""),
            "Receipt Date": data.get("tcpaConsentTimestamp", ""),
        }

        # Validate required fields
        required_fields = [
            lead_data["First Name"], lead_data["Last Name"], lead_data["Mobile Phone"],
            lead_data["Email"], lead_data["ZIP Code"],
        ]
        if not all(str(field).strip() for field in required_fields):
            return jsonify({
                "success": False,
                "error": "First Name, Last Name, Mobile Phone, Email, and ZIP Code are required"
            }), 400

        # Generate video
        print(f"[API] Processing single lead: {lead_data.get('First Name')} {lead_data.get('Last Name')}")

        video_path = fill_form_and_record(lead_data)

        if not video_path:
            return jsonify({
                "success": False,
                "error": "Video generation failed"
            }), 500

        video_filename = Path(video_path).name
        video_info = save_video_link(video_path, video_filename)

        # Create certificate
        certificate_result = create_certificate_for_lead(
            lead_data=lead_data,
            recording_id=video_info["recording_id"],
            recording_url=video_info["video_url"],
            recording_storage_path=video_info.get("storage_path")
        )

        response = {
            "success": True,
            "video": {
                "success": True,
                "recording_id": video_info["recording_id"],
                "video_url": video_info["video_url"]
            },
            "certificate": certificate_result
        }

        return jsonify(response), 200

    except Exception as e:
        print(f"[API Error] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5002))
    app.run(debug=True, threaded=True, port=port)
