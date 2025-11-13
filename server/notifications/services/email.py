import logging
from typing import List, Dict, Optional
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.template import engines
from django.utils import timezone
from django.template import Template, Context

logger = logging.getLogger(__name__)


class EmailNotificationService():
    
    def __init__(self):
        self.from_email = getattr(settings, 'EMAIL_HOST_USER')
        self.from_name = "Scrapiz"
    
    def send_order_email(self, order_no, recipients: List[str]) -> bool:
        if not recipients:
            logger.warning("No recipients provided for email notification")
            return False
        
        try:
            context = self._get_email_context(order_no)
            engine = engines['django']
            with open(engine.engine.get_template('email/new_order_notification.html').origin.name, 'r', encoding='utf-8', errors='replace') as f:
              template_string = f.read()
            template = Template(template_string)
            html_content = template.render(Context(context))
            subject = f"New Order #{order_no.order_number}"
            from_address = f"{self.from_name} <{self.from_email}>"
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=self._format_plain_text(context),
                from_email=from_address,
                to=recipients  # Fixed: was 'recipient', should be 'recipients'
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            
            logger.info(f"Email sent successfully for order {order_no.order_number} to {len(recipients)} recipients")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email for order {order_no.order_number}: {str(e)}", exc_info=True)
            return False
    
    def _get_email_context(self, order_no) -> Dict:
        order_items = []
        for order in order_no.orders.all():
            order_items.append({
                'product_name': order.product.name,
                'quantity': order.quantity,
                'unit': order.product.unit,
                'category': order.product.category.name if order.product.category else 'N/A'
            })
        
        address_dict = None
        if order_no.address:
            address_dict = {
                'name': order_no.address.name,
                'street': order_no.address.street,
                'area': order_no.address.area,
                'city': order_no.address.city,
                'state': order_no.address.state,
                'pincode': order_no.address.pincode,
                'phone': order_no.address.phone_number,
            }
        
        admin_dashboard_url = getattr(
            settings,
            'ADMIN_DASHBOARD_URL',
            f"http://api.scrapiz.in/admin/inventory/orderno/{order_no.id}/change/"
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
    def send_user_confirmation_email(self, order_no) -> bool:
      try:
        user_email = order_no.user.email
        if not user_email:
          logger.warning(f"No email found for user in order {order_no.order_number}")
          return False
        context = self._get_user_email_context(order_no)
        html_content = render_to_string(
          'email/order_confirmation_user.html',
          context,
        )
        subject = f"? Order Confirmed - #{order_no.order_number}"
        from_address = f"{self.from_name} <{self.from_email}>"
        email = EmailMultiAlternatives(
          subject=subject,
          body=self._format_user_plain_text(context),
          from_email = from_address,
          to=[user_email]
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)
        logger.info(f"User confirmation email sent successfully for order {order_no.order_number} to {user_email}")
        return True
      except Exception as e:
        logger.error(f"Failed to send user confirmation email for order {order_no.order_number}: {str(e)}", exc_info=True)
        return False
    def _get_user_email_context(self, order_no) -> Dict:
      order_items = []
      for order in order_no.orders.all():
        order_items.append({
          'product_name': order.product.name,
          'quantity': order.quantity,
          'unit':order.product.unit,
          'category': order.product.category.name if order.product.category else 'N/A'
        })
        address_dict = None
        if order_no.address:
          address_dict = {
            'name': order_no.address.name,
            'street': order_no.address.street,
            'area': order_no.address.area,
            'city': order_no.address.city,
            'state':order_no.address.state,
            'pincode': order_no.address.pincode,
            'phone': order_no.address.phone_number,
          }
        estimated_value = None
        if hasattr(order_no, 'estimated_order_value') and order_no.estimated_order_value:
          estimated_value = f"{float(order_no.estimated_order_value):.2f}"
        return {
          'order_number': order_no.order_number,
          'customer_email': order_no.user.email,
          'customer_name': order_no.user.name if hasattr(order_no.user, 'name') else order_no.user.email.split('@')[0],
          'created_at': order_no.created_at.strftime('%B %d, %Y at %I:%M %p'),
          'status': order_no.status.name if order_no.status else 'Pending',
          'address': address_dict,
          'order_items': order_items,
          'items_count': len(order_items),
          'estimated_value': estimated_value,
          'current_year': timezone.now().year,
        }
        
    def _format_user_plain_text(self, context: Dict) -> str:
      lines = [
      
        f"Order Confirmation - #{context['order_number']}",
        "",
        f"Hi {context['customer_name']},",
        "",
        "Thank you for your order! We've received your scrap pickup request.",
        "",
        f"Order Date: {context['created_at']}",
        f"Status: {context['status']}",
        f"Total Items: {context['items_count']}",
      ]
      if context.get('estimated_value'):
        lines.append(f"Estimated Value: ?{context['estimated_value']}")
      lines.extend([
        "",
        "Order Items:",
      ])
      for item in context['order_items']:
        lines.append(f"  - {item['product_name']}: {item['quantity']} {item['unit']} ({item['category']})")
      if context['address']:
        addr = context['address']
        lines.extend([
          "",
          "Pickup Address:",
          f"  {addr['name']}",
          f"  {addr['street']}, {addr['area']}",
          f"  {addr['city']}, {addr['state']} - {addr['pincode']}",
          f"  Phone: {addr['phone']}",
          
        ])
        lines.extend([
        
          "",
          "What's Next?",
          "  1. Our team will review your order",
          "  2. We'll contact you to schedule pickup",
          "  3. Our team will collect the scrap",
          "  4. You'll receive payment after verification",
          "",
          "Need help? Reply to this email with your order number.",
          "",
          "---",
          "Scrapiz - Sell Scrap , Get Cash",
        ])
        return "\n".join(lines)
        
    def _format_plain_text(self, context: Dict) -> str:
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
