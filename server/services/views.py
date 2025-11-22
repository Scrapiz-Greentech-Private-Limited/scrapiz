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
            
            # Create Google Meet link if configured
            try:
                if hasattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE') and settings.GOOGLE_SERVICE_ACCOUNT_FILE:
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
            except Exception as e:
                print(f"Failed to create Google Meet: {str(e)}")
                # Continue without meeting link - don't fail the booking
            
            # Send confirmation email
            try:
                send_booking_confirmation_email(booking)
            except Exception as e:
                print(f"Failed to send confirmation email: {str(e)}")
                # Continue - don't fail the booking
            
            response_data = ServiceBookingSerializer(booking).data
            return Response(
                {
                    'message': 'Service booking submitted successfully',
                    'booking': response_data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
