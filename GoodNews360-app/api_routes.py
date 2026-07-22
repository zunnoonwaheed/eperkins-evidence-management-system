# GoodNews360 JSON API Routes
# Add these routes to app.py

from flask import jsonify

# Add CORS support
from flask_cors import CORS

# In app.py after app creation, add:
# CORS(app, origins=[os.getenv("FRONTEND_URL", "http://localhost:3001")])

@app.route("/api/health", methods=["GET"])
def api_health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "goodnews360"}), 200


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
            "Age Range": data.get("age", ""),
            "Home Status": data.get("homeOwnership", ""),
            "Household Income": data.get("householdIncome", ""),
            "Owe Back Taxes": data.get("taxDebt", ""),
            "Monthly Bill Reduction": data.get("billReduction", ""),
            "Contact Consent": "yes" if data.get("tcpaConsent") else "no",
            "IP Address": data.get("ipAddress", ""),
            "Receipt Date": data.get("tcpaConsentTimestamp", ""),
        }

        # Normalize data
        lead_data["Age Range"] = normalize_age(lead_data.get("Age Range", ""))
        lead_data["Home Status"] = normalize_home(lead_data.get("Home Status", ""))
        lead_data["Household Income"] = normalize_income(lead_data.get("Household Income", ""))
        lead_data["Owe Back Taxes"] = normalize_owe_back_taxes(lead_data.get("Owe Back Taxes", ""))
        lead_data["Monthly Bill Reduction"] = normalize_monthly_bill(lead_data.get("Monthly Bill Reduction", ""))

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
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
