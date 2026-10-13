
import os
import json
from pathlib import Path

import requests
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]

load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("DATA_GOV_API_KEY")
RESOURCE_ID = os.getenv("DATA_GOV_RESOURCE_ID")

if not API_KEY or not RESOURCE_ID:
    raise RuntimeError(
        "Missing DATA_GOV_API_KEY or "
        "DATA_GOV_RESOURCE_ID in .env"
    )

URL = (
    f"https://api.data.gov.in/resource/"
    f"{RESOURCE_ID}"
)

params = {
    "api-key": API_KEY,
    "format": "json",
    "limit": 5,
    "offset": 0,
    "filters[state]": "Bihar",
}

print("Connecting to government data API...")

try:
    response = requests.get(
        URL,
        params=params,
        timeout=30,
    )

    print("HTTP status:", response.status_code)

    response.raise_for_status()

    data = response.json()

    if not isinstance(data, dict):
        raise ValueError(
            "Expected a JSON object from the API"
        )

    print("\nResponse keys:")
    print(list(data.keys()))

    records = data.get("records", [])

    if not isinstance(records, list):
        raise ValueError(
            "Expected records to be a list"
        )

    print("\nRecords received:", len(records))

    if records:
        print("\nFirst record:")
        print(
            json.dumps(
                records[0],
                indent=2,
                ensure_ascii=False,
            )
        )
    else:
        print(
            "\nNo records returned. Check the "
            "resource ID, filter, and availability."
        )

except requests.RequestException as error:
    print("API request failed:", error)

except (ValueError, json.JSONDecodeError) as error:
    print("Invalid API response:", error)
