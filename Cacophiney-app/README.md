# Cacophinney Automation

Local Flask + Playwright automation for `https://cacophiney.com/#qualify`.

## Fields

CSV/XLSX columns:

- First Name
- Last Name
- Mobile Phone
- Email
- Tax Debt Amount
- Contact Consent
- IP Address
- Receipt Date

Required:

- First Name
- Last Name
- Mobile Phone
- Tax Debt Amount

Optional:

- Email
- Contact Consent, defaults to yes
- IP Address, blank detects real public IP
- Receipt Date, blank keeps current site timestamp

## Local setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

For visible browser debugging:

```bash
HEADLESS=false python app.py
```

## Sample CSV

Use `sample_cacophinney.csv`.
