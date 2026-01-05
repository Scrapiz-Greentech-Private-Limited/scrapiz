"""
Firebase Phone Authentication Service for handling phone number OTP verification.

This service provides secure Firebase ID token verification for phone authentication.
Firebase handles OTP generation, SMS delivery, and verification - this service only
verifies the resulting ID token and extracts user information.
"""

import os
import re
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


class FirebasePhoneAuthService:
    """Service for Firebase Phone Authentication token verification."""
    
    _firebase_app = None
    _initialized = False
    
    @classmethod
    def _initialize_firebase(cls) -> None:
        """
        Initialize Firebase Admin SDK if not already initialized.
        
        Uses service account credentials from FIREBASE_SERVICE_ACCOUNT_FILE
        environment variable or falls back to GOOGLE_APPLICATION_CREDENTIALS.
        """
        if cls._initialized:
            return
            
        import firebase_admin
        from firebase_admin import credentials
        
        # Check if already initialized by another part of the app
        try:
            cls._firebase_app = firebase_admin.get_app()
            cls._initialized = True
            return
        except ValueError:
            # No app exists, we need to initialize
            pass
        
        # Get credentials file path
        cred_file = os.getenv('FIREBASE_SERVICE_ACCOUNT_FILE') or os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        
        if not cred_file:
            # Try to use the existing service-credentials.json in server directory
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            default_cred_file = os.path.join(base_dir, 'service-credentials.json')
            if os.path.exists(default_cred_file):
                cred_file = default_cred_file
        
        if cred_file and os.path.exists(cred_file):
            cred = credentials.Certificate(cred_file)
            cls._firebase_app = firebase_admin.initialize_app(cred)
        else:
            # Initialize with default credentials (for GCP environments)
            cls._firebase_app = firebase_admin.initialize_app()
        
        cls._initialized = True
    
    @classmethod
    def verify_id_token(cls, id_token: str) -> dict:
        """
        Verify Firebase ID token and extract claims.
        
        This method performs comprehensive token validation:
        1. Initializes Firebase Admin SDK if needed
        2. Verifies JWT signature using Firebase's public keys
        3. Validates token has not expired
        4. Validates the token's audience matches the Firebase project ID
        5. Extracts phone number and Firebase UID from claims
        
        Args:
            id_token: Firebase ID token from client after successful OTP verification
            
        Returns:
            dict: Token claims including:
                - uid: Firebase unique user identifier
                - phone_number: Verified phone number in E.164 format
                - auth_time: Time of authentication
                - Additional claims from Firebase
                
        Raises:
            ValueError: If token is invalid, with specific error message:
                - "Firebase token is required" - Empty or None token
                - "Invalid or expired verification token" - Token verification failed
                - "Phone number not found in token" - Token doesn't contain phone claim
        """
        if not id_token:
            raise ValueError("Firebase token is required")
        
        # Ensure Firebase is initialized
        cls._initialize_firebase()
        
        from firebase_admin import auth
        
        try:
            # Verify the ID token
            decoded_token = auth.verify_id_token(id_token)
            
            # Extract phone number from claims
            phone_number = decoded_token.get('phone_number')
            
            if not phone_number:
                raise ValueError("Phone number not found in token")
            
            return {
                'uid': decoded_token.get('uid'),
                'phone_number': phone_number,
                'auth_time': decoded_token.get('auth_time'),
                'firebase_uid': decoded_token.get('uid'),
                # Include additional claims that might be useful
                'sign_in_provider': decoded_token.get('firebase', {}).get('sign_in_provider'),
            }
            
        except ValueError:
            # Re-raise ValueError as-is (our custom errors)
            raise
        except Exception as e:
            # Handle Firebase-specific exceptions
            error_message = str(e).lower()
            if 'expired' in error_message:
                raise ValueError("Invalid or expired verification token")
            elif 'invalid' in error_message or 'malformed' in error_message:
                raise ValueError("Invalid or expired verification token")
            elif 'revoked' in error_message:
                raise ValueError("Invalid or expired verification token")
            else:
                raise ValueError("Invalid or expired verification token")
    
    @staticmethod
    def extract_phone_number(token_claims: dict) -> str:
        """
        Extract and normalize phone number from token claims to E.164 format.
        
        Firebase already returns phone numbers in E.164 format, but this method
        ensures consistency and validates the format.
        
        Args:
            token_claims: Verified token claims from verify_id_token()
            
        Returns:
            str: Phone number in E.164 format (e.g., +919876543210)
            
        Raises:
            ValueError: If phone number is missing or invalid format
        """
        phone_number = token_claims.get('phone_number')
        
        if not phone_number:
            raise ValueError("Phone number not found in token claims")
        
        # Normalize the phone number to E.164 format
        normalized = FirebasePhoneAuthService.normalize_phone_number(phone_number)
        
        return normalized
    
    @staticmethod
    def normalize_phone_number(phone_number: str) -> str:
        """
        Normalize a phone number to E.164 format.
        
        E.164 format: +[country code][subscriber number]
        Example: +919876543210 (India)
        
        Args:
            phone_number: Phone number in various formats
            
        Returns:
            str: Phone number in E.164 format
            
        Raises:
            ValueError: If phone number cannot be normalized to valid E.164 format
        """
        if not phone_number:
            raise ValueError("Phone number is required")
        
        # Remove all whitespace and common separators
        cleaned = re.sub(r'[\s\-\.\(\)]', '', phone_number)
        
        # If already in E.164 format (starts with +), validate and return
        if cleaned.startswith('+'):
            if not FirebasePhoneAuthService.is_valid_e164(cleaned):
                raise ValueError(f"Invalid E.164 phone number format: {phone_number}")
            return cleaned
        
        # If starts with 00 (international prefix), replace with +
        if cleaned.startswith('00'):
            cleaned = '+' + cleaned[2:]
            if not FirebasePhoneAuthService.is_valid_e164(cleaned):
                raise ValueError(f"Invalid phone number format: {phone_number}")
            return cleaned
        
        # For numbers without country code, we cannot reliably determine the country
        # Firebase should always provide E.164 format, so this is a fallback
        raise ValueError(f"Phone number must be in E.164 format (e.g., +919876543210): {phone_number}")
    
    @staticmethod
    def is_valid_e164(phone_number: str) -> bool:
        """
        Validate if a phone number is in valid E.164 format.
        
        E.164 format requirements:
        - Starts with '+'
        - Followed by 1-15 digits (country code + subscriber number)
        - No spaces or other characters
        
        Args:
            phone_number: Phone number to validate
            
        Returns:
            bool: True if valid E.164 format, False otherwise
        """
        if not phone_number:
            return False
        
        # E.164 pattern: + followed by 1-15 digits
        # Minimum: +1 (1 digit country code + 0 subscriber - theoretical minimum)
        # Maximum: +123456789012345 (15 digits total)
        # Practical minimum is around 8 digits (e.g., +1234567)
        e164_pattern = r'^\+[1-9]\d{6,14}$'
        
        return bool(re.match(e164_pattern, phone_number))
