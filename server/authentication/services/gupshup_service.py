import requests
import json
from django.conf import settings

GUPSHUP_API_URL = "https://api.gupshup.io/wa/api/v1/template/msg"


def send_whatsapp_otp(phone_number: str, otp: str):
    payload = {
        "channel": "whatsapp",
        "source": settings.GUPSHUP_SOURCE_NUMBER,
        "destination": phone_number,
        "src.name": "Scrapiz",
        "template": json.dumps({
            "id": settings.GUPSHUP_TEMPLATE_ID,
            "params": [otp, otp]
        })
    }

    headers = {
        "apikey": settings.GUPSHUP_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache"
    }

    response = requests.post(
        GUPSHUP_API_URL,
        headers=headers,
        data=payload
    )

    return response.json()
