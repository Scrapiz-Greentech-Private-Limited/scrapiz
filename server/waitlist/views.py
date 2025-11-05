from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import WaitlistSerializer


class WaitlistCreateView(APIView):
    """
    API endpoint for creating waitlist entries
    No authentication required (public endpoint)
    """
    
    def post(self, request):
        """
        Create a new waitlist entry
        
        Request body:
        {
            "email": "user@example.com",  # Optional
            "phone_number": "9876543210",  # Optional
            "city": "Delhi"                # Required
        }
        """
        serializer = WaitlistSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Thank you for your interest! We'll notify you when we launch in your area.",
                    "city": serializer.validated_data.get('city')
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            {
                "error": "Invalid data provided",
                "details": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
