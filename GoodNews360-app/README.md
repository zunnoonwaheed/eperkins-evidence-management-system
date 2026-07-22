# Savings Check America / GoodNews360 Survey Automation

Automates the survey at `https://thegoodnews360.com`, records the browser session, converts the video to MP4, and optionally uploads the MP4 to GCS if the environment variables are configured.

## CSV columns

Required:

```csv
First Name,Last Name,Mobile Phone,Email,ZIP Code
```

Supported optional columns:

```csv
Age Range,Home Status,Household Income,Owe Back Taxes,Monthly Bill Reduction,Contact Consent,IP Address,Receipt Date
```

Example:

```csv
First Name,Last Name,Mobile Phone,Email,ZIP Code,Age Range,Home Status,Household Income,Owe Back Taxes,Monthly Bill Reduction,Contact Consent,IP Address,Receipt Date
Jane,Smith,(672) 208-3077,jane.smith@example.com,08833,40 – 54,Rent,"$60,000 – $99,999",I'm not sure,"Insurance (health, auto, home)",yes,24.85.132.44,2026-07-04
```

## Supported survey answers

Age Range:
- Under 40
- 40 – 54
- 55 – 64
- 65 or older

Home Status:
- Own
- Rent
- Other / living with family

Household Income:
- Under $30,000
- $30,000 – $59,999
- $60,000 – $99,999
- $100,000 or more

Owe Back Taxes:
- Yes — more than $10,000
- Yes — less than $10,000
- I'm not sure
- No

Monthly Bill Reduction:
- Credit cards & loans
- Insurance (health, auto, home)
- Utilities & phone
- None of these

## Local run

```bash
pip install -r requirements.txt
playwright install chromium
python app.py
```

For visible Chromium locally:

```bash
HEADLESS=false python app.py
```

Open:

```text
http://127.0.0.1:5000
```

## IP/date behavior

If `IP Address` is provided, the automation intercepts browser IP lookup calls and sets matching IP fields. If `Receipt Date` is provided, the visible consent footer's `Signed:` date is changed while keeping the site's generated time portion.
