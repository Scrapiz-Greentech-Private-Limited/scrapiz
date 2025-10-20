from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from utils.usercheck import authenticate_request
from .models import ServiceBooking
from .serializers import ServiceBookingSerializer


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
            response_data = ServiceBookingSerializer(booking).data
            return Response(
                {
                    'message': 'Service booking submitted successfully',
                    'booking': response_data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
