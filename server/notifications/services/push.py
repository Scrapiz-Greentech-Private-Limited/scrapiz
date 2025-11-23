import logging
import requests
from typing import List, Dict, Optional, Tuple
from django.conf import settings
from django.utils import timezone
from django.db.models import Q

logger = logging.getLogger(__name__)


class PushNotificationService:
    """Handle push notification delivery via Expo Push Service"""
    
    EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
    
    def __init__(self):
        """Initialize the Push Notification Service with settings"""
        self.access_token = getattr(settings, 'EXPO_ACCESS_TOKEN', None)
        self.batch_size = getattr(settings, 'PUSH_NOTIFICATION_BATCH_SIZE', 100)
        
        if not self.access_token:
            logger.warning("EXPO_ACCESS_TOKEN not configured. Using Expo free tier (limited to 600 notifications/day)")
    
    def validate_token_format(self, token: str) -> bool:
        """
        Validate Expo Push Token format
        
        Args:
            token: The Expo push token to validate
            
        Returns:
            bool: True if token format is valid, False otherwise
        """
        if not token or not isinstance(token, str):
            return False
        
        return token.startswith('ExponentPushToken[') and token.endswith(']')
    
    def invalidate_token(self, token: str) -> bool:
        """
        Mark a push token as inactive
        
        Args:
            token: The Expo push token to invalidate
            
        Returns:
            bool: True if token was found and invalidated, False otherwise
        """
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
        """
        Validate notification image URL
        
        Checks:
        1. URL format (http/https)
        2. Image accessibility (HEAD request)
        3. Content type (image/png, image/jpeg, image/jpg)
        4. File size (optional, if Content-Length header is present)
        
        Args:
            image_url: The image URL to validate
            
        Returns:
            Tuple of (is_valid: bool, error_message: Optional[str])
            - (True, None) if valid
            - (False, error_message) if invalid
        """
        if not image_url or not isinstance(image_url, str):
            return False, "Image URL is empty or invalid"
        
        # Check URL format
        if not (image_url.startswith('http://') or image_url.startswith('https://')):
            return False, "Image URL must start with http:// or https://"
        
        # Validate URL length
        if len(image_url) > 2048:
            return False, "Image URL is too long (max 2048 characters)"
        
        try:
            # Make HEAD request to check if image is accessible
            response = requests.head(image_url, timeout=5, allow_redirects=True)
            
            # Check if request was successful
            if response.status_code != 200:
                return False, f"Image URL returned status code {response.status_code}"
            
            # Check content type
            content_type = response.headers.get('Content-Type', '').lower()
            valid_content_types = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
            
            if not any(ct in content_type for ct in valid_content_types):
                return False, f"Invalid image format. Expected PNG, JPG, JPEG, GIF, or WebP, got: {content_type}"
            
            # Check file size if Content-Length header is present (optional)
            content_length = response.headers.get('Content-Length')
            if content_length:
                try:
                    size_mb = int(content_length) / (1024 * 1024)
                    max_size_mb = 10  # 10 MB limit
                    if size_mb > max_size_mb:
                        return False, f"Image file size ({size_mb:.2f} MB) exceeds maximum allowed size ({max_size_mb} MB)"
                except (ValueError, TypeError):
                    # If we can't parse content length, just log and continue
                    logger.debug(f"Could not parse Content-Length header: {content_length}")
            
            logger.info(f"Image URL validated successfully: {image_url}")
            return True, None
            
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
        """
        Get active push tokens for users who have enabled this notification category
        
        Args:
            category: Notification category (order_updates, promotions, announcements, general)
            user_ids: Optional list of specific user IDs to target
            
        Returns:
            List of PushToken objects for eligible users
        """
        try:
            from user.models import PushToken
            from authentication.models import User
            
            # Start with active tokens
            query = PushToken.objects.filter(is_active=True)
            
            # Filter by specific user IDs if provided
            if user_ids:
                query = query.filter(user_id__in=user_ids)
            
            # Build user filter based on category and preferences
            # Note: These fields are on the User model, so we use user__ prefix
            user_filter = Q(user__push_notification_enabled=True)
            
            # Map category to user preference field
            category_field_map = {
                'order_updates': 'notify_order_updates',
                'promotions': 'notify_promotions',
                'announcements': 'notify_announcements',
                'general': 'notify_general'
            }
            
            # Add category-specific filter
            if category in category_field_map:
                field_name = category_field_map[category]
                user_filter &= Q(**{f'user__{field_name}': True})
            
            # Apply user preference filters
            query = query.filter(user_filter)
            
            # Select related user to avoid N+1 queries
            tokens = list(query.select_related('user'))
            
            logger.info(f"Found {len(tokens)} eligible tokens for category '{category}'")
            return tokens
            
        except Exception as e:
            logger.error(f"Error getting eligible tokens: {str(e)}", exc_info=True)
            return []
    
    def _build_expo_messages(
        self,
        tokens: List['PushToken'],
        title: str,
        message: str,
        deep_link_data: Optional[Dict],
        image_url: Optional[str]
    ) -> List[Dict]:
        """
        Build Expo Push API message payloads
        
        Args:
            tokens: List of PushToken objects
            title: Notification title
            message: Notification body
            deep_link_data: Optional deep link data for navigation
            image_url: Optional image URL for rich notifications
            
        Returns:
            List of message dictionaries formatted for Expo API
        """
        messages = []
        
        # Validate image URL once before building messages
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
            # Base message structure
            expo_message = {
                "to": token.token,
                "title": title,
                "body": message,
                "sound": "default",
                "priority": "high",
                "channelId": "default"
            }
            
            # Add deep link data if provided
            if deep_link_data:
                expo_message["data"] = deep_link_data
            else:
                expo_message["data"] = {}
            
            # Add validated image if available
            if validated_image_url:
                # Store in data for custom handling
                expo_message["data"]["image"] = validated_image_url
                
                # For Android: Use FCM's image field (big picture style)
                expo_message["android"] = {
                    "imageUrl": validated_image_url,
                    "priority": "high",
                    "sound": "default",
                    "channelId": "default"
                }
                
                # For iOS: Use attachments
                expo_message["ios"] = {
                    "sound": "default",
                    "attachments": [{
                        "url": validated_image_url
                    }]
                }
            
            messages.append(expo_message)
        
        logger.info(f"Built {len(messages)} Expo messages")
        return messages

    def _send_to_expo(self, messages: List[Dict]) -> Dict:
        """
        Send messages to Expo Push API in batches
        
        Args:
            messages: List of message dictionaries formatted for Expo API
            
        Returns:
            Dict with response data from Expo API
        """
        if not self.access_token:
            logger.warning("EXPO_ACCESS_TOKEN not configured. Using Expo free tier (limited to 600 notifications/day)")
            # Expo allows sending without token for free tier
            # Continue without returning error
        
        all_responses = []
        
        # Send in batches
        for i in range(0, len(messages), self.batch_size):
            batch = messages[i:i + self.batch_size]
            
            try:
                logger.info(f"Sending batch of {len(batch)} messages to Expo (batch {i//self.batch_size + 1})")
                
                headers = {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
                
                # Add authorization header only if token is available
                if self.access_token:
                    headers['Authorization'] = f'Bearer {self.access_token}'
                
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
                    }] * len(batch))
                    
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
                }] * len(batch))
        
        return {
            'success': True,
            'data': all_responses
        }
    
    def _handle_expo_response(self, response_data: Dict, tokens: List['PushToken']) -> Tuple[int, int, int]:
        """
        Process Expo API response and handle invalid tokens
        
        Args:
            response_data: Response data from Expo API
            tokens: List of PushToken objects that were sent to
            
        Returns:
            Tuple of (successful_count, failed_count, invalid_token_count)
        """
        successful_count = 0
        failed_count = 0
        invalid_token_count = 0
        
        responses = response_data.get('data', [])
        
        # Process each response
        for idx, response in enumerate(responses):
            if idx >= len(tokens):
                logger.warning(f"Response index {idx} exceeds token list length")
                break
            
            token = tokens[idx]
            status = response.get('status', 'unknown')
            
            if status == 'ok':
                successful_count += 1
                # Update last_used_at timestamp
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
                
                # Handle DeviceNotRegistered error by invalidating token
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
        title: str,
        message: str,
        category: str,
        deep_link_data: Optional[Dict] = None,
        image_url: Optional[str] = None,
        user_ids: Optional[List[int]] = None
    ) -> Dict[str, any]:
        """
        Send push notification to users based on their preferences
        
        Args:
            title: Notification title (max 50 characters)
            message: Notification body (max 200 characters)
            category: Notification category (order_updates, promotions, announcements, general)
            deep_link_data: Optional deep link data for navigation
            image_url: Optional image URL for rich notifications
            user_ids: Optional list of specific user IDs (if None, sends to all eligible users)
        
        Returns:
            Dict with success status, sent count, failed count, and invalid token count
        """
        try:
            logger.info(
                f"Starting push notification send: title='{title}', "
                f"category='{category}', user_ids={user_ids}"
            )
            
            # Validate inputs
            if not title or not message:
                return {
                    'success': False,
                    'error': 'Title and message are required',
                    'sent_count': 0,
                    'failed_count': 0,
                    'invalid_token_count': 0
                }
            
            # Get eligible tokens based on category and preferences
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
            
            # Build Expo messages
            expo_messages = self._build_expo_messages(
                tokens=tokens,
                title=title,
                message=message,
                deep_link_data=deep_link_data,
                image_url=image_url
            )
            
            # Send to Expo API
            response_data = self._send_to_expo(expo_messages)
            
            if not response_data.get('success'):
                return {
                    'success': False,
                    'error': response_data.get('error', 'Failed to send to Expo API'),
                    'sent_count': 0,
                    'failed_count': len(tokens),
                    'invalid_token_count': 0
                }
            
            # Handle responses and update token status
            sent_count, failed_count, invalid_token_count = self._handle_expo_response(
                response_data,
                tokens
            )
            
            return {
                'success': True,
                'sent_count': sent_count,
                'failed_count': failed_count,
                'invalid_token_count': invalid_token_count,
                'total_tokens': len(tokens)
            }
            
        except Exception as e:
            logger.error(f"Error in send_push_notification: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'sent_count': 0,
                'failed_count': 0,
                'invalid_token_count': 0
            }
