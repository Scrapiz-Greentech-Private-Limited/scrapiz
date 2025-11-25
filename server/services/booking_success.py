from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_booking_confirmation_email(booking):
    """
    Send booking confirmation email with meeting details to the user.
    
    Args:
        booking: ServiceBooking instance
    """
    try:
        # Check if meeting link exists (field may not exist if migration not run)
        meeting_link = getattr(booking, 'meeting_link', None)
        has_meeting = meeting_link and meeting_link.strip()
        
        subject = f'Booking Confirmed - {booking.service}'
        
        # Create HTML email content
        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }}
                .detail-row {{ margin: 15px 0; padding: 10px; background-color: white; border-radius: 4px; }}
                .label {{ font-weight: bold; color: #374151; }}
                .value {{ color: #111827; }}
                .meeting-link {{ display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Booking Confirmed!</h1>
                </div>
                <div class="content">
                    <p>Dear {booking.name},</p>
                    <p>Your service booking has been confirmed. Here are your booking details:</p>
                    
                    <div class="detail-row">
                        <span class="label">Service:</span>
                        <span class="value">{booking.service}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">Scheduled Time:</span>
                        <span class="value">{booking.preferred_datetime}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">Address:</span>
                        <span class="value">{booking.address}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">Contact:</span>
                        <span class="value">{booking.phone}</span>
                    </div>
                    
                    {f'''
                    <div class="detail-row">
                        <span class="label">Notes:</span>
                        <span class="value">{booking.notes}</span>
                    </div>
                    ''' if booking.notes else ''}
                    
                    {f'''
                    <div style="text-align: center; margin: 30px 0;">
                        <p><strong>Join your video inspection meeting:</strong></p>
                        <a href="{meeting_link}" class="meeting-link">Join Google Meet</a>
                        <p style="font-size: 12px; color: #6b7280;">Or copy this link: {meeting_link}</p>
                    </div>
                    ''' if has_meeting else ''}
                    
                    <p style="margin-top: 30px;">Our team will contact you shortly to confirm the details.</p>
                    
                    <div class="footer">
                        <p>Thank you for choosing Scrapiz!</p>
                        <p>If you have any questions, please contact us.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        plain_message = f"""
        Booking Confirmed!
        
        Dear {booking.name},
        
        Your service booking has been confirmed. Here are your booking details:
        
        Service: {booking.service}
        Scheduled Time: {booking.preferred_datetime}
        Address: {booking.address}
        Contact: {booking.phone}
        {f'Notes: {booking.notes}' if booking.notes else ''}
        
        {f'Join your video inspection meeting: {meeting_link}' if has_meeting else ''}
        
        Our team will contact you shortly to confirm the details.
        
        Thank you for choosing Scrapiz!
        """
        
        print(f" Sending email to: {booking.user.email}")
        print(f" From: {settings.EMAIL_HOST_USER}")
        print(f"Subject: {subject}")
        
        # Send email
        result = send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[booking.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        
        print(f"Email send result: {result}")
        return True
        
    except Exception as e:
        print(f"Failed to send booking confirmation email: {str(e)}")
        import traceback
        traceback.print_exc()
        return False  