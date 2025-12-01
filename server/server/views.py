from django.http import JsonResponse
from django.views import View


class HealthCheckView(View):
    """
    Simple health check endpoint that returns 200 OK
    No authentication required - useful for monitoring and load balancers
    """
    def get(self, request):
        return JsonResponse({
            'status': 'healthy',
            'message': 'Server is running'
        }, status=200)
