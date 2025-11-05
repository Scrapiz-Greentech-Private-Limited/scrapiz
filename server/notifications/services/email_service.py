"""
Email notification service
Handles formatting and sending email notifications to administrators
"""
import logging
from typing import List, Dict, Optional
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


class EmailNotificationService:
    """Handle email notification delivery"""
    
    def __init__(self):
        self.from_email = getattr(settings, 'EMAIL_FROM_ADDRESS', settings.EMAIL_HOST_USER)
        self.from_name = getattr(settings, 'EMAIL_FROM_NAME', 'Scrapiz Order System')
    
    def send_order_email(self, order_no, recipients: List[str]) -> bool:
        """
        Send formatted email to recipients
        
        Args:
            order_no: OrderNo model instance
            recipients: List of email addresses
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if not recipients:
            logger.warning("No recipients provided for email notification")
            return False
        
        try:
            # Get email context
            context = self._get_email_context(order_no)
            
            # Render HTML template
            html_content = render_to_string(
                'email/new_order_notification.html',
                context
            )
            
            # Create email
            subject = f"🛒 New Order #{order_no.order_number}"
            from_address = f"{self.from_name} <{self.from_email}>"
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=self._format_plain_text(context),
                from_email=from_address,
                to=recipients
            )
            email.attach_alternative(html_content, "text/html")
            
            # Send email
            email.send(fail_silently=False)
            
            logger.info(f"Email sent successfully for order {order_no.order_number} to {len(recipients)} recipients")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email for order {order_no.order_number}: {str(e)}", exc_info=True)
            return False
    
    def _get_email_context(self, order_no) -> Dict:
        """
        Extract order data for email template
        
        Args:
            order_no: OrderNo model instance
            
        Returns:
            Dictionary with template context
        """
        # Get order items
        order_items = []
        for order in order_no.orders.all():
            order_items.append({
                'product_name': order.product.name,
                'quantity': order.quantity,
                'unit': order.product.unit,
                'category': order.product.category.name if order.product.category else 'N/A'
            })
        
        # Get address details
        address_dict = None
        if order_no.address:
            address_dict = {
                'name': order_no.address.name,
                'street': order_no.address.street,
                'area': order_no.address.area,
                'city': order_no.address.city,
                'state': order_no.address.state,
                'pincode': order_no.address.pincode,
                'phone': order_no.address.phone,
            }
        
        # Admin dashboard URL (configure based on your setup)
        admin_dashboard_url = getattr(
            settings,
            'ADMIN_DASHBOARD_URL',
            f"http://13.204.50.150/admin/inventory/orderno/{order_no.id}/change/"
        )
        
        return {
            'order_number': order_no.order_number,
            'customer_email': order_no.user.email,
            'customer_name': order_no.user.name if hasattr(order_no.user, 'name') else order_no.user.email,
            'created_at': order_no.created_at.strftime('%B %d, %Y at %I:%M %p'),
            'status': order_no.status.name if order_no.status else 'Pending',
            'address': address_dict,
            'order_items': order_items,
            'items_count': len(order_items),
            'images': order_no.images if order_no.images else [],
            'admin_dashboard_url': admin_dashboard_url,
            'current_year': timezone.now().year,
        }
    
    def _format_plain_text(self, context: Dict) -> str:
        """
        Generate plain text email body as fallback
        
        Args:
            context: Email context dictionary
            
        Returns:
            Plain text email content
        """
        lines = [
            f"New Order Alert - #{context['order_number']}",
            "",
            f"Customer: {context['customer_name']} ({context['customer_email']})",
            f"Order Date: {context['created_at']}",
            f"Status: {context['status']}",
            "",
            "Order Items:",
        ]
        
        for item in context['order_items']:
            lines.append(f"  - {item['product_name']}: {item['quantity']} {item['unit']}")
        
        if context['address']:
            addr = context['address']
            lines.extend([
                "",
                "Delivery Address:",
                f"  {addr['name']}",
                f"  {addr['street']}, {addr['area']}",
                f"  {addr['city']}, {addr['state']} - {addr['pincode']}",
                f"  Phone: {addr['phone']}",
            ])
        
        if context['images']:
            lines.extend([
                "",
                f"Images: {len(context['images'])} attached",
            ])
        
        lines.extend([
            "",
            f"View order details: {context['admin_dashboard_url']}",
            "",
            "---",
            "Scrapiz Order Management System",
        ])
        
        return "\n".join(lines)
