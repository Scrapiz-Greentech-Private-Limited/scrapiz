import os
from google.oauth2 import id_token
from google.auth.transport import requests

from dotenv import load_dotenv



class GoogleOAuthService():
      @staticmethod
      def get_google_client():
        client_ids = []
        ios_client_id = os.getenv('GOOGLE_IOS_CLIENT_ID')
        if ios_client_id:
          client_ids.append(ios_client_id)
        android_client_id = os.getenv('GOOGLE_ANDROID_CLIENT_ID')
        if android_client_id:
          client_ids.append(android_client_id)
        if not client_ids:
          raise ValueError("No Google Client IDs configured. Set GOOGLE_IOS_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID")
        return client_ids
      
      
      @staticmethod
      def verify_id_token(token):
          try:
             client_ids = GoogleOAuthService.get_google_client()
             idinfo = None
             last_error = None
             for client_id in client_ids:
               try:
                 idinfo = id_token.verify_oauth2_token(
                   token,
                   requests.Request(),
                   client_id
                 )
                 if idinfo:
                   break
               except ValueError as e:
                 last_error =e
                 continue
             if not idinfo:
               raise ValueError(f'Token verification failed with all client IDs: {str(last_error)}')
             if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
               raise ValueError('Invalid token issuer')
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
                 