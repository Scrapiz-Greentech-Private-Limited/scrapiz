import logging
import requests
from typing import List, Dict, Optional, Tuple
from django.conf import settings
from django.utils import timezone
from django.db.models import Q


logger = logging.getLogger(__name__)

class PushNotificationService:

  EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
  def __init__(self):
    self.access_token = getattr(settings, 'EXPO_ACCESS_TOKEN', None)
    self.batch_size = getattr(settings, 'PUSH_NOTIFICATION_BATCH_SIZE', 100)
    
    if not self.access_token:
      logger.warning("EXPO_ACCESS_TOKEN not configured. Using Expo free tier (limited to 600 notifications/day)")
  def validate_token_format(self, token: str) -> bool:
    if not token or not isinstance(token, str):
      return False
    return token.startswith('ExponentPushToken[') and token.endswith(']')
  def invalidate_token(self, token: str) -> bool:
    try:
      from user.models import PushToken
      updated_count = PushToken.objects.filter(
        token=token,
        is_active=True
      ).update(is_active=False)
      
      if updated_count > 0:
        logger.info(f"Invalidated push token: {token[:30]}...")
        return True
      else:
        logger.warning(f"Token not found or already inactive: {token[:30]}...")
        return False
        
    except Exception as e:
      logger.error(f"Error invalidating token: {str(e)}", exc_info=True)
      return False
  def validate_notification_image(self, image_url: str) -> Tuple[bool, Optional[str]]:
    if not image_url or not isinstance(image_url, str):
      return False, "Image URL is empty or invalid"
    if not (image_url.startswith('http://') or image_url.startswith('https://')):
      return False, "Image URL must start with http:// or https://"
    if len(image_url) > 2048:
      return False, "Image URL is too long (max 2048 characters)"
    
    try:
        response = requests.head(image_url, timeout=5, allow_redirects=True)
        if response.status_code != 200:
          return False, f"Image URL returned status code {response.status_code}"
        content_type = response.headers.get('Content-Type', '').lower()
        valid_content_types = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
        if not any(ct in content_type for ct in valid_content_types):
          return False, f"Invalid image format. Expected PNG, JPG, JPEG, GIF, or WebP, got: {content_type}"
        content_length = response.headers.get('Content-Length')
        if content_length:
          try:
            size_mb = int(content_length) / (1024 * 1024)
            max_size_mb = 10
            if size_mb > max_size_mb:
              return False, f"Image file size ({size_mb:.2f} MB) exceeds maximum allowed size ({max_size_mb} MB)"
          except (ValueError, TypeError):
            logger.debug(f"Could not parse Content-Length header: {content_length}")
        logger.info(f"Image URL validated successfully: {image_url}")
        return True , None
    except requests.exceptions.Timeout:
      return False, "Image URL request timed out (5 seconds)"
    except requests.exceptions.ConnectionError:
      return False, "Could not connect to image URL"
    except requests.exceptions.TooManyRedirects:
      return False, "Image URL has too many redirects"
    except requests.exceptions.RequestException as e:
      return False, f"Error accessing image URL: {str(e)}"
    except Exception as e:
      logger.error(f"Unexpected error validating image URL: {str(e)}", exc_info=True)
      return False, f"Unexpected error validating image: {str(e)}"
  def _get_eligible_tokens(self, category: str, user_ids: Optional[List[int]] = None) -> List['PushToken']:
    try:
      from user.models import PushToken
      from authentication.models import User
      query = PushToken.objects.filter(is_active=True)
      if user_ids:
        query = query.filter(user_id__in=user_ids)
      user_filter = Q(user__push_notification_enabled=True)
      category_field_map = {
        'order_updates': 'notify_order_updates',
        'promotions': 'notify_promotions',
        'announcements': 'notify_announcements',
        'general': 'notify_general'
      }
      if category in category_field_map:
        field_name = category_field_map[category]
        user_filter &= Q(**{f'user__{field_name}': True})
      query = query.filter(user_filter)
      tokens = list(query.select_related('user'))
      logger.info(f"Found {len(tokens)} eligible tokens for category '{category}'")
      return tokens
    except Exception as e:
      logger.error(f"Error getting eligible tokens: {str(e)}", exc_info=True)
      return []
  def _build_expo_messages(self , tokens: List['PushToken'], title:str, message:str,deep_link_data: Optional[Dict],image_url: Optional[str]) -> List[Dict]:
    messages = []
    validated_image_url = None
    if image_url:
      is_valid, error_message = self.validate_notification_image(image_url)
      if is_valid:
        validated_image_url = image_url
        logger.info(f"Image URL validated and will be included in notifications: {image_url}")
      else:
        logger.warning(
          f"Image URL validation failed, sending notifications without image. "
          f"Error: {error_message}"
        )
    for token in tokens:
      expo_message = {
        "to": token.token,
        "title": title,
        "body": message,
        "sound": "default",
        "priority": "high",
        "channelId": "default"
      }
      if deep_link_data:
        expo_message["data"] = deep_link_data
      else:
        expo_message["data"] = {}
        
      if validated_image_url:
        expo_message["image"] = validated_image_url
        expo_message["data"]["image"] = validated_image_url
        
      messages.append(expo_message)
    logger.info(f"Built {len(messages)} Expo messages")
    return messages
    
  def _send_to_expo(self, messages: List[Dict]) -> Dict:
    if not self.access_token:
      logger.warning("EXPO_ACCESS_TOKEN not configured. Using Expo free tier (limited to 600 notifications/day)")
    all_responses = []
    for i in range(0, len(messages), self.batch_size):
      batch = messages[i:i + self.batch_size]
      try:
        logger.info(f"Sending batch of {len(batch)} messages to Expo (batch {i//self.batch_size + 1})")
        headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          
        }
        if self.access_token:
          headers["Authorization"] = f'Bearer {self.access_token}'
        response = requests.post(
          self.EXPO_PUSH_URL,
          json=batch,
          headers=headers,
          timeout=30
        )
        if response.status_code == 200:
          response_data = response.json()
          all_responses.extend(response_data.get('data', []))
          logger.info(f"Batch sent successfully: {len(response_data.get('data', []))} responses")
        else:
          logger.error(f"Expo API error: {response.status_code} - {response.text}")
          all_responses.extend([{
            'status': 'error',
            'message': f'HTTP {response.status_code}: {response.text}'
          }]* len(batch))
      except requests.exceptions.Timeout:
        logger.error(f"Timeout sending batch to Expo API")
        all_responses.extend([{
          'status': 'error',
          'message': 'Request timeout'
        }] * len(batch))
        
      except requests.exceptions.RequestException as e:
        logger.error(f"Network error sending to Expo API: {str(e)}", exc_info=True)
        all_responses.extend([{
          'status': 'error',
          'message': f'Network error: {str(e)}'
        }] * len(batch))
      except Exception as e:
        logger.error(f"Unexpected error sending to Expo API: {str(e)}", exc_info=True)
        all_responses.extend([{
          'status': 'error',
          'message': f'Unexpected error: {str(e)}'
          
        }]* len(batch))
    return {
      'success': True,
      'data': all_responses
    }
  def _handle_expo_response(self, response_data: Dict, tokens: List['PushToken']) -> Tuple[int, int, int]:
    successful_count = 0
    failed_count = 0
    invalid_token_count = 0
    responses = response_data.get('data', [])
    for idx, response in enumerate(responses):
      if idx >= len(tokens):
        logger.warning(f"Response index {idx} exceeds token list length")
        break
      token = tokens[idx]
      status = response.get('status', 'unknown')
      if status == 'ok':
        successful_count += 1
        try:
          token.last_used_at = timezone.now()
          token.save(update_fields=['last_used_at'])
        except Exception as e:
          logger.warning(f"Failed to update last_used_at for token: {str(e)}")
      elif status == 'error':
        failed_count += 1
        error_details = response.get('details', {})
        error_type = error_details.get('error', 'unknown')
        error_message = response.get('message', 'Unknown error')
        logger.warning(
          f"Push notification failed for token {token.token[:30]}...: "
          f"{error_type} - {error_message}"
        )
        if error_type == 'DeviceNotRegistered':
          if self.invalidate_token(token.token):
            invalid_token_count += 1
            logger.info(f"Invalidated unregistered token: {token.token[:30]}...")
      else:
        failed_count += 1
        logger.warning(f"Unknown response status '{status}' for token {token.token[:30]}...")
    logger.info(
      f"Push notification results: {successful_count} successful, "
      f"{failed_count} failed, {invalid_token_count} invalid tokens removed"
    )
    
    return successful_count, failed_count, invalid_token_count
    
  def send_push_notification(
    self, 
    title:str, 
    message:str, 
    category:str, 
    deep_link_data:Optional[Dict]=None, 
    image_url: Optional[str] = None, 
    user_ids: Optional[List[int]] = None
  ) -> Dict[str,any]:
    try:
      logger.info(
        f"Starting push notification send: title='{title}', "
        f"category='{category}', user_ids={user_ids}"
      )
      if not title or not message:
        return {
          'success': False,
          'error': 'Title and message are required',
          'sent_count': 0,
          'failed_count': 0,
          'invalid_token_count': 0
          
        }
      tokens = self._get_eligible_tokens(category, user_ids)
      if not tokens:
        logger.warning(f"No eligible tokens found for category '{category}'")
        return {
          'success': True,
          'message': 'No eligible recipients found',
          'sent_count': 0,
          'failed_count': 0,
          'invalid_token_count': 0
        }
      expo_messages = self._build_expo_messages(
        tokens=tokens,
        title=title,
        message=message,
        deep_link_data=deep_link_data,
        image_url=image_url
      )
      response_data = self._send_to_expo(expo_messages)
      if not response_data.get('success'):
        return {
          'success': False,
          'error': response_data.get('error', 'Failed to send to Expo API'),
          'sent_count': 0,
          'failed_count': len(tokens),
          'invalid_token_count': 0
        }
      sent_count, failed_count, invalid_token_count = self._handle_expo_response(
        response_data,
        tokens
      )
      return {
        'success': True,
        'sent_count': sent_count,
        'failed_count': failed_count,
        'invalid_token_count':invalid_token_count,
        'total_tokens':len(tokens)
      
      }
    except Exception as e:
      logger.error(f"Error in send_push_notification: {str(e)}", exc_info=True)
      return {
        'success': False,
        'error': str(e),
        'sent_count':0,
        'failed_count':0,
        'invalid_token_count':0
      }
    
               
        
            
      
      
           