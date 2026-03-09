import json
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

GUPSHUP_API_URL = "https://api.gupshup.io/wa/api/v1/msg"


class GupshupWhatsAppService:

    @staticmethod
    def send_otp(phone: str, otp: str) -> bool:
        api_key = settings.GUPSHUP_API_KEY
        app_name = settings.GUPSHUP_APP_NAME
        source_number = settings.GUPSHUP_SOURCE_NUMBER

        if not all([api_key, app_name, source_number]):
            logger.error("Gupshup configuration missing. Check GUPSHUP_API_KEY, GUPSHUP_APP_NAME, GUPSHUP_SOURCE_NUMBER")
            return False

        # Strip leading '+' from destination if present – Gupshup expects digits only
        destination = phone.lstrip('+')

        payload = {
            "channel": "whatsapp",
            "source": source_number,
            "destination": destination,
            "src.name": app_name,
            "message": json.dumps({
                "type": "text",
                "text": f"Your Scrapiz verification code is {otp}. Valid for 5 minutes. Do not share this code.",
            }),
        }
        headers = {
            "apikey": api_key,
            "Content-Type": "application/x-www-form-urlencoded",
        }

        try:
            response = requests.post(GUPSHUP_API_URL, data=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                logger.info(f"OTP sent via Gupshup to {phone}")
                return True
            else:
                logger.error(f"Gupshup API error {response.status_code}: {response.text}")
                return False
        except requests.RequestException as e:
            logger.error(f"Gupshup request failed for {phone}: {e}")
            return False
