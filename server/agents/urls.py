"""
URL routing for Agent Management System.

Provides the following endpoints:
- /api/agents/ - Agent CRUD operations (list, create)
- /api/agents/{id}/ - Agent detail operations (retrieve, update, delete)
- /api/agents/stats/ - Agent statistics
- /api/agents/eligible/ - Eligible agents for dispatch
- /api/agents/{id}/documents/ - Document upload and list
- /api/agents/{id}/documents/{doc_id}/verify/ - Document verification
- /api/agents/{id}/audit-logs/ - Agent audit logs

Requirements: 11.1
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AgentViewSet,
    AgentStatsAPIView,
    EligibleAgentsAPIView,
    AgentDocumentUploadAPIView,
    AgentDocumentVerifyAPIView,
    AgentDocumentListAPIView,
    AgentAuditLogsAPIView,
    AgentRatingUpdateAPIView,
)

# Create router for ViewSet
router = DefaultRouter()
router.register(r'', AgentViewSet, basename='agent')

urlpatterns = [
    # Statistics endpoint (must be before router to avoid conflict with {id})
    path('stats/', AgentStatsAPIView.as_view(), name='agent-stats'),
    
    # Eligible agents endpoint
    path('eligible/', EligibleAgentsAPIView.as_view(), name='agent-eligible'),
    
    # Document endpoints
    path('<int:agent_id>/documents/', AgentDocumentListAPIView.as_view(), name='agent-document-list'),
    path('<int:agent_id>/documents/upload/', AgentDocumentUploadAPIView.as_view(), name='agent-document-upload'),
    path('<int:agent_id>/documents/<int:document_id>/verify/', AgentDocumentVerifyAPIView.as_view(), name='agent-document-verify'),
    
    # Audit logs endpoint
    path('<int:agent_id>/audit-logs/', AgentAuditLogsAPIView.as_view(), name='agent-audit-logs'),
    
    # Rating update endpoint
    path('<int:agent_id>/rating/', AgentRatingUpdateAPIView.as_view(), name='agent-rating-update'),
    
    # Router URLs (CRUD operations)
    path('', include(router.urls)),
]
