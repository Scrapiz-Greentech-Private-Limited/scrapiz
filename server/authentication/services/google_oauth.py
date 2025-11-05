import os
from google.oauth2 import id_token
from google.auth.transport import requests
from dotenv import load_dotenv

load_dotenv()


class GoogleOAuthService:
    """Service for handling Google OAuth authentication"""
    
    @staticmethod
    def get_google_client_ids():
        """
        Get all Google OAuth client IDs from environment variables
        For native apps, we need to accept both iOS and Android client IDs
        
        Returns:
            list: List of valid client IDs
        """
        client_ids = []
        
        # iOS Client ID
        ios_client_id = os.getenv('GOOGLE_IOS_CLIENT_ID')
        if ios_client_id:
            client_ids.append(ios_client_id)
        
        # Android Client ID
        android_client_id = os.getenv('GOOGLE_ANDROID_CLIENT_ID')
        if android_client_id:
            client_ids.append(android_client_id)
        
        # Web Client ID (for Expo Go or web builds)
        web_client_id = os.getenv('GOOGLE_CLIENT_ID')
        if web_client_id:
            client_ids.append(web_client_id)
        
        if not client_ids:
            raise ValueError("No Google Client IDs configured. Set GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, or GOOGLE_CLIENT_ID")
        
        return client_ids
    
    @staticmethod
    def verify_id_token(token):
        """
        Verify Google ID token and extract user information
        Accepts tokens from iOS, Android, or Web clients
        
        Args:
            token (str): Google ID token to verify
            
        Returns:
            dict: User information from verified token containing:
                - email: User's email address
                - name: User's full name
                - sub: Google user ID
                - picture: User's profile picture URL
                
        Raises:
            ValueError: If token is invalid, expired, or audience doesn't match
        """
        try:
            client_ids = GoogleOAuthService.get_google_client_ids()
            
            # Try to verify with each client ID
            idinfo = None
            last_error = None
            
            for client_id in client_ids:
                try:
                    # Verify the token using Google's public keys
                    idinfo = id_token.verify_oauth2_token(
                        token, 
                        requests.Request(), 
                        client_id
                    )
                    
                    # If verification succeeds, break the loop
                    if idinfo:
                        break
                        
                except ValueError as e:
                    last_error = e
                    continue
            
            # If no client ID worked, raise the last error
            if not idinfo:
                raise ValueError(f'Token verification failed with all client IDs: {str(last_error)}')
            
            # Verify the token issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Invalid token issuer')
            
            # Extract user claims
            user_data = {
                'email': idinfo.get('email'),
                'name': idinfo.get('name'),
                'sub': idinfo.get('sub'),
                'picture': idinfo.get('picture')
            }
            
            if not user_data['email']:
                raise ValueError('Email not found in token')
            
            return user_data
            
        except ValueError as e:
            raise ValueError(f'Invalid token: {str(e)}')
        except Exception as e:
            raise ValueError(f'Token verification failed: {str(e)}')
