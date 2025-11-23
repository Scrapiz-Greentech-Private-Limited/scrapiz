from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings

from utils.usercheck import authenticate_request
from .models import ServiceBooking
from .serializers import ServiceBookingSerializer
from .meeting_service import GoogleMeetService
from .email_service import send_booking_confirmation_email


class ServiceBookingAPIView(APIView):
    def get(self, request):
        user = authenticate_request(request, need_user=True)
        bookings = ServiceBooking.objects.filter(user=user)
        serializer = ServiceBookingSerializer(bookings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = authenticate_request(request, need_user=True)
        serializer = ServiceBookingSerializer(data=request.data)

        if serializer.is_valid():
            booking = serializer.save(user=user)
            print(f"✅ Booking created: ID={booking.id}, Service={booking.service}")
            
            # Create Google Meet link if configured and fields exist
            meeting_created = False
            try:
                print(f"🔍 Checking Google Meet configuration...")
                print(f"   - Has GOOGLE_SERVICE_ACCOUNT_FILE setting: {hasattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE')}")
                print(f"   - GOOGLE_SERVICE_ACCOUNT_FILE value: {getattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE', None)}")
                print(f"   - Booking has meeting_link field: {hasattr(booking, 'meeting_link')}")
                
                if (hasattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE') and 
                    settings.GOOGLE_SERVICE_ACCOUNT_FILE and
                    hasattr(booking, 'meeting_link')):
                    
                    print(f"📅 Creating Google Meet for booking {booking.id}...")
                    meet_service = GoogleMeetService()
                    meeting_info = meet_service.create_meeting(
                        summary=f"Scrap Inspection: {booking.service} - {booking.name}",
                        start_time_iso=booking.preferred_datetime,
                        duration_minutes=30,
                        attendee_email=user.email,
                        description=f"Service: {booking.service}\nAddress: {booking.address}\nPhone: {booking.phone}"
                    )
                    
                    # Save meeting details
                    booking.meeting_link = meeting_info['meeting_url']
                    booking.meeting_event_id = meeting_info['event_id']
                    booking.save()
                    meeting_created = True
                    print(f"✅ Google Meet created: {meeting_info['meeting_url']}")
                else:
                    print(f"⚠️  Google Meet not configured or migration not run")
                    
            except Exception as e:
                print(f"❌ Failed to create Google Meet: {str(e)}")
                import traceback
                traceback.print_exc()
                # Continue without meeting link - don't fail the booking
            
            # Send confirmation email
            email_sent = False
            try:
                print(f"📧 Sending confirmation email to {user.email}...")
                result = send_booking_confirmation_email(booking)
                email_sent = result
                if result:
                    print(f"✅ Email sent successfully")
                else:
                    print(f"⚠️  Email sending returned False")
            except Exception as e:
                print(f"❌ Failed to send confirmation email: {str(e)}")
                import traceback
                traceback.print_exc()
                # Continue - don't fail the booking
            
            print(f"📊 Booking Summary:")
            print(f"   - Booking ID: {booking.id}")
            print(f"   - Meeting Created: {meeting_created}")
            print(f"   - Email Sent: {email_sent}")
            
            response_data = ServiceBookingSerializer(booking).data
            return Response(
                {
                    'message': 'Service booking submitted successfully',
                    'booking': response_data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
