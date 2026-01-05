from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import AuthenticationFailed, NotFound, ValidationError as DRFValidationError
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.utils import timezone
from django.core.exceptions import ValidationError
import logging

from .models import Agent, AgentDocument, AgentAuditLog
from .serializers import (
    AgentSerializer,
    AgentListSerializer,
    AgentCreateSerializer,
    AgentDocumentSerializer,
    DocumentUploadSerializer,
    DocumentVerifySerializer,
    AgentAuditLogSerializer,
    AgentStatsSerializer,
)
from .services import AgentService
from utils.usercheck import authenticate_request

logger = logging.getLogger(__name__)





class AgentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Agent CRUD operations.
    """
    queryset = Agent.objects.all().prefetch_related('service_areas', 'documents')
    pagination_class = None
    def get_serializer_class(self):
      if self.action == 'list':
        return AgentListSerializer
      if self.action == 'create':
        return AgentCreateSerializer
      if self.action in ['retrieve', 'update', 'partial_update']:
        return AgentSerializer
      return AgentSerializer
    
    
    def get_queryset(self):
        """
        Filter queryset based on query parameters.

        """
        queryset = super().get_queryset()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by KYC status
        kyc_status = self.request.query_params.get('kyc_status')
        if kyc_status:
            queryset = queryset.filter(kyc_status=kyc_status)
        
        # Filter by availability
        availability = self.request.query_params.get('availability')
        if availability:
            queryset = queryset.filter(availability=availability)
        
        # Filter by service area (pincode ID)
        service_area = self.request.query_params.get('service_area')
        if service_area:
            queryset = queryset.filter(service_areas__id=service_area)
        
        # Search by name, phone, email, or agent_code
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search) |
                Q(email__icontains=search) |
                Q(agent_code__icontains=search)
            )
        
        return queryset.distinct()
    
    def _get_authenticated_user(self):
        """Authenticate request and return user."""
        try:
            return authenticate_request(self.request, need_user=True)
        except AuthenticationFailed as e:
            raise e
    
    def _check_admin_privileges(self, user):
        """Check if user has admin privileges."""
        if not user.is_staff and not user.is_superuser:
            raise AuthenticationFailed('Admin privileges required')
    
    def list(self, request, *args, **kwargs):
        """
        List all agents with pagination and filtering.
        
        GET /api/agents/
        """
        try:
            user = self._get_authenticated_user()
            self._check_admin_privileges(user)
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            return Response({
              'count': queryset.count(),
              'results': serializer.data
            },status=status.HTTP_200_OK)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Error listing agents: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve agents'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):

        try:
            user = self._get_authenticated_user()
            self._check_admin_privileges(user)
            
            serializer = AgentCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Use AgentService for creation with audit logging
            agent = AgentService.create_agent(
                name=serializer.validated_data['name'],
                phone=serializer.validated_data['phone'],
                email=serializer.validated_data['email'],
                address=serializer.validated_data['address'],
                actor=user,
                profile_image_url=serializer.validated_data.get('profile_image_url'),
                vehicle_number=serializer.validated_data.get('vehicle_number'),
                vehicle_type=serializer.validated_data.get('vehicle_type'),
                vehicle_registration_url=serializer.validated_data.get('vehicle_registration_url'),
                daily_capacity=serializer.validated_data.get('daily_capacity', 10),
                service_area_ids=serializer.validated_data.get('service_area_ids', []),
                service_pincode_ids=serializer.validated_data.get('service_pincode_ids', []),
                coverage_location=serializer.validated_data.get('coverage_location'),
            )
            
            # Return full agent data
            
            return Response(AgentSerializer(agent).data, status=status.HTTP_201_CREATED)
            
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating agent: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to create agent: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def retrieve(self, request, *args, **kwargs):
        """
        Get agent details.    
        GET /api/agents/{id}/
        
        """
        try:
            user = self._get_authenticated_user()
            self._check_admin_privileges(user)
            return super().retrieve(request, *args, **kwargs)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Error retrieving agent: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve agent'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """
        Full update of agent.    
        PUT /api/agents/{id}/
        """
        try:
            user = self._get_authenticated_user()
            self._check_admin_privileges(user)
            
            instance = self.get_object()
            old_data = AgentSerializer(instance).data
            
            response = super().update(request, *args, **kwargs)
            
            # Log the update
            AgentService.log_agent_action(
                agent=instance,
                action='updated',
                actor=user,
                previous_value={'status': old_data.get('status'), 'availability': old_data.get('availability')},
                new_value={'status': instance.status, 'availability': instance.availability},
                details='Agent updated via API'
            )
            
            return response
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Error updating agent: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to update agent: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def partial_update(self, request, *args, **kwargs):
        """
        Partial update of agent.
        PATCH /api/agents/{id}/
        """
        try:
            user = self._get_authenticated_user()
            self._check_admin_privileges(user)
            
            instance = self.get_object()
            old_status = instance.status
            old_availability = instance.availability
            
            response = super().partial_update(request, *args, **kwargs)
            
            # Refresh instance
            instance.refresh_from_db()
            
            # Log status change if changed
            if 'status' in request.data and old_status != instance.status:
                AgentService.log_agent_action(
                    agent=instance,
                    action='status_changed',
                    actor=user,
                    previous_value={'status': old_status},
                    new_value={'status': instance.status},
                    details=f'Status changed from {old_status} to {instance.status}'
                )
            
            # Log availability change if changed
            if 'availability' in request.data and old_availability != instance.availability:
                AgentService.log_agent_action(
                    agent=instance,
                    action='availability_changed',
                    actor=user,
                    previous_value={'availability': old_availability},
                    new_value={'availability': instance.availability},
                    details=f'Availability changed from {old_availability} to {instance.availability}'
                )
            
            # Handle service area updates
            if 'service_area_ids' in request.data:
                AgentService.update_service_areas(
                  instance,
                  request.data.get('service_area_ids', []),
                  actor=user
                )
            if 'service_pincode_ids' in request.data:
              AgentService.update_service_pincodes(
                instance,
                request.data.get('service_pincode_ids', []),
                actor=user
              )
            instance.refresh_from_db()
            response.data = AgentSerializer(instance).data
            
            return response
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Error updating agent: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to update agent: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete agent.      
        DELETE /api/agents/{id}/
        """
        try:
            user = self._get_authenticated_user()
            self._check_admin_privileges(user)
            
            instance = self.get_object()
            agent_code = instance.agent_code
            
            # Log deletion before deleting
            logger.info(f"Agent {agent_code} deleted by {user.email}")
            
            return super().destroy(request, *args, **kwargs)
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Error deleting agent: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to delete agent'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class AgentStatsAPIView(APIView):
    """
    API endpoint for agent statistics.
    
    GET /api/agents/stats/
    
    Returns:
    - total: Total number of agents
    - active: Number of active agents (status=active AND kyc_status=verified)
    - inactive: Number of inactive/suspended agents
    - total_orders: Total orders completed by all agents
    - average_rating: Average rating across all agents
    
    Requirements: 13.1, 13.2, 13.3, 13.4, 13.5
    """
    
    def get(self, request):
        try:
            user = authenticate_request(request, need_user=True)
            
            # Check admin privileges
            if not user.is_staff and not user.is_superuser:
                return Response(
                    {'error': 'Admin privileges required'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            stats = AgentService.get_agent_statistics()
            serializer = AgentStatsSerializer(stats)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Error getting agent stats: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve agent statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EligibleAgentsAPIView(APIView):
    """
    API endpoint for querying eligible agents for order dispatch.
    
    GET /api/agents/eligible/
    
    Query Parameters:
    - pincode: Filter by service area pincode (optional)
    - include_onboarding: Include onboarding agents (optional, default: false)
    - include_unassigned: Include agents without service areas (optional, default: false)
    
    Returns agents that are:
    - status = 'active' (or 'onboarding' if include_onboarding=true)
    - kyc_status != 'rejected'
    - Have at least one service area assigned (unless include_unassigned=true)
    - current_day_orders < daily_capacity
    - (Optional) Serve the specified pincode
    
    Requirements: 4.1, 4.4
    """
    
    def get(self, request):
        try:
            user = authenticate_request(request, need_user=True)
            
            # Check admin privileges
            if not user.is_staff and not user.is_superuser:
                return Response(
                    {'error': 'Admin privileges required'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            pincode = request.query_params.get('pincode')
            include_onboarding = request.query_params.get('include_onboarding', 'false').lower() == 'true'
            include_unassigned = request.query_params.get('include_unassigned', 'false').lower() == 'true'
            
            eligible_agents = AgentService.get_eligible_agents(
                pincode=pincode,
                exclude_at_capacity=True,
                include_onboarding=include_onboarding,
                include_unassigned=include_unassigned
            )
            
            serializer = AgentListSerializer(eligible_agents, many=True)
            return Response({
                'count': eligible_agents.count(),
                'results': serializer.data
            }, status=status.HTTP_200_OK)
            
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Error getting eligible agents: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve eligible agents'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AgentDocumentUploadAPIView(APIView):
    """
    API endpoint for uploading agent documents.
    
    POST /api/agents/{agent_id}/documents/
    
    Request Body:
    - document_type: Type of document (aadhaar, pan, driving_license)
    - document_url: URL to the uploaded document
    
    Requirements: 2.1
    """
    
    def post(self, request, agent_id):
        try:
            user = authenticate_request(request, need_user=True)
            
            # Check admin privileges
            if not user.is_staff and not user.is_superuser:
                return Response(
                    {'error': 'Admin privileges required'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get agent
            try:
                agent = Agent.objects.get(id=agent_id)
            except Agent.DoesNotExist:
                return Response(
                    {'error': 'Agent not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = DocumentUploadSerializer(
                data=request.data,
                context={'agent': agent}
            )
            serializer.is_valid(raise_exception=True)
            
            # Use service for document upload with audit logging
            document = AgentService.upload_document(
                agent=agent,
                document_type=serializer.validated_data['document_type'],
                document_url=serializer.validated_data['document_url'],
                actor=user
            )
            
            response_serializer = AgentDocumentSerializer(document)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error uploading document: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to upload document: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AgentDocumentVerifyAPIView(APIView):
    """
    API endpoint for verifying/rejecting agent documents.
    PATCH /api/agents/{agent_id}/documents/{document_id}/verify/
    Request Body:
    - action: 'verify' or 'reject'
    - rejection_reason: Reason for rejection (required if action is 'reject')
    """
    
    def patch(self, request, agent_id, document_id):
        try:
            user = authenticate_request(request, need_user=True)
            
            # Check admin privileges
            if not user.is_staff and not user.is_superuser:
                return Response(
                    {'error': 'Admin privileges required'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get agent
            try:
                agent = Agent.objects.get(id=agent_id)
            except Agent.DoesNotExist:
                return Response(
                    {'error': 'Agent not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get document
            try:
                document = AgentDocument.objects.get(id=document_id, agent=agent)
            except AgentDocument.DoesNotExist:
                return Response(
                    {'error': 'Document not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            serializer = DocumentVerifySerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            action = serializer.validated_data['action']
            rejection_reason = serializer.validated_data.get('rejection_reason', '')
            
            if action == 'verify':
                document = AgentService.verify_document(
                    document=document,
                    verified_by=user
                )
            else:  # reject
                document = AgentService.reject_document(
                    document=document,
                    verified_by=user,
                    rejection_reason=rejection_reason
                )
            
            response_serializer = AgentDocumentSerializer(document)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
            
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error verifying document: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to verify document: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class AgentAuditLogsAPIView(APIView):
    """
    API endpoint for retrieving agent audit logs.
    
    GET /api/agents/{agent_id}/audit-logs/
    
    Query Parameters:
    - action: Filter by action type (optional)
    - start_date: Filter by start date (YYYY-MM-DD) (optional)
    - end_date: Filter by end date (YYYY-MM-DD) (optional)
    
    Requirements: 7.4, 7.5
    """
    
    def get(self, request, agent_id):
        try:
            user = authenticate_request(request, need_user=True)
            
            # Check admin privileges
            if not user.is_staff and not user.is_superuser:
                return Response(
                    {'error': 'Admin privileges required'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get agent
            try:
                agent = Agent.objects.get(id=agent_id)
            except Agent.DoesNotExist:
                return Response(
                    {'error': 'Agent not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get audit logs
            audit_logs = AgentAuditLog.objects.filter(agent=agent)
            
            # Filter by action type
            action_filter = request.query_params.get('action')
            if action_filter:
                audit_logs = audit_logs.filter(action=action_filter)
            
            # Filter by date range
            start_date = request.query_params.get('start_date')
            if start_date:
                audit_logs = audit_logs.filter(timestamp__date__gte=start_date)
            
            end_date = request.query_params.get('end_date')
            if end_date:
                audit_logs = audit_logs.filter(timestamp__date__lte=end_date)
            
            # Order by timestamp descending
            audit_logs = audit_logs.order_by('-timestamp')
            
            serializer = AgentAuditLogSerializer(audit_logs, many=True)
            return Response({
                'count': audit_logs.count(),
                'results': serializer.data
            }, status=status.HTTP_200_OK)
            
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Error getting audit logs: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve audit logs'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class AgentDocumentListAPIView(APIView):
    """
    API endpoint for listing agent documents.   
    GET /api/agents/{agent_id}/documents/
    """
    
    def get(self, request, agent_id):
        try:
            user = authenticate_request(request, need_user=True)
            
            # Check admin privileges
            if not user.is_staff and not user.is_superuser:
                return Response(
                    {'error': 'Admin privileges required'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get agent
            try:
                agent = Agent.objects.get(id=agent_id)
            except Agent.DoesNotExist:
                return Response(
                    {'error': 'Agent not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            documents = agent.documents.all()
            serializer = AgentDocumentSerializer(documents, many=True)
            return Response({
                'count': documents.count(),
                'results': serializer.data
            }, status=status.HTTP_200_OK)
            
        except AuthenticationFailed as e:
            return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Error getting documents: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve documents'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class AgentRatingUpdateAPIView(APIView):
  """
  API endpoint for updating agent ratings.
  POST /api/agents/{agent_id}/rating/
  """
  def post(self, request, agent_id):
    try:
      user = authenticate_request(request, need_user=True)
      if not user.is_staff and not user.is_superuser:
        return Response(
          {'error': 'Admin privileges required'},
          status=status.HTTP_403_FORBIDDEN
        )
      try:
        agent = Agent.objects.get(id=agent_id)
      except Agent.DoesNotExist:
        return Response(
          {'error': 'Agent not found'},
          status=status.HTTP_404_NOT_FOUND
        )
      rating = request.data.get('rating')
      if rating is None:
        return Response(
          {'error': 'Rating is required'},
          status=status.HTTP_400_BAD_REQUEST 
        )
      try:
        rating = float(rating)
      except (ValueError, TypeError):
        return Response(
          {'error': 'Rating must be a number'},
          status=status.HTTP_400_BAD_REQUEST
        )
      if not 0 <= rating <= 5:
        return Response(
          {'error': 'Rating must be between 0 and 5'},
          status=status.HTTP_400_BAD_REQUEST
        )
      new_average = AgentService.update_rating(
        agent=agent,
        new_rating=rating,
        actor=user
      )
      agent.refresh_from_db()
      return Response({
        'message': 'Rating updated successfully',
        'average_rating': str(agent.average_rating),
        'rating_count': agent.rating_count,
      },status=status.HTTP_200_OK)
    except AuthenticationFailed as e:
      return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)
    except ValidationError as e:
      return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
      logger.error(f"Error updating rating: {str(e)}", exc_info=True)
      return Response(
        {'error': f'Failed to update rating: {str(e)}'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
      )