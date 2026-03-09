import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from rest_framework.exceptions import AuthenticationFailed
from .models import FeedBackQuestion, FeedbackSession, FeedbackResponse,AppRatingPrompt,OrderRating
from .serializers import (
    FeedbackQuestionSerializer,
    FeedbackSessionSerializer,
    SubmitFeedbackSerializer,
    OrderRatingSerializer,
    PendingOrderSerializer
)
from django.utils import timezone
from .services import RatingPromptEligibilityService, update_agent_rating
from inventory.models import OrderNo, Status
from utils.usercheck import authenticate_request

logger = logging.getLogger(__name__)


class FeedbackQuestionsAPIView(APIView):

  def get(self,request):
    try:
      user = authenticate_request(request, need_user=True)
      context = request.GET.get('context', 'order_completion')
      questions = FeedBackQuestion.objects.filter(
        context=context,
        is_active=True,
      ).order_by('order')
      
      serializer = FeedbackQuestionSerializer(questions, many=True)
      
      return Response({
        'success': True,
        'questions': serializer.data
      })
    except Exception as e:
      return Response({
        'success': False,
        'error': str(e)
      }, status=status.HTTP_500_INTERNAL_SERVER)
      
class SubmitFeedbackAPIView(APIView):
  def post(self, request):
    try:
      user = authenticate_request(request, need_user=True)
      serializer = SubmitFeedbackSerializer(data=request.data)
      if not serializer.is_valid():
        return Response({
          'success': False,
          'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
      data= serializer.validated_data
      
      order_id = data.get('order_id')
      context = data.get('context', 'order_completion')
      responses_data = data.get('responses', [])
      
      if order_id:
        existing = FeedbackSession.objects.filter(
          user=user,
          order_id=order_id,
          completed=True
        ).exists()
        
        if existing:
          return Response({
            'success': False,
            'error': 'Feedback already submitted for this order'
          },status=status.HTTP_400_BAD_REQUEST)
      with transaction.atomic():
        session = FeedbackSession.objects.create(
          user=user,
          order_id=order_id,
          context=context,
          completed=True
        )
        
        for response_data in responses_data:
          question_id = response_data.get('question_id')
          try:
            question = FeedBackQuestion.objects.get(id=question_id)
          except FeedBackQuestion.DoesNotExist:
            continue
          FeedbackResponse.objects.create(
            session=session,
            question=question,
            rating_value=response_data.get('rating_value'),
            text_value=response_data.get('text_value'),
            boolean_value=response_data.get('boolean_value'),
            choice_value=response_data.get('choice_value')
          )
      return Response({
        'success':True,
        'message': 'Feedback submitted successfully',
        'session_id': session.id
      }, status=status.HTTP_201_CREATED)
    except Exception as e:
      logger.error(f"Error submitting feedback: {str(e)}", exc_info=True)
      return Response({
        'success': False,
        'error': str(e)
      }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
      
      
class UserFeedbackHistoryAPIView(APIView):
    """
    Get user's feedback history.
    """
    def get(self, request):
        try:
            user = authenticate_request(request, need_user=True)
            
            sessions = FeedbackSession.objects.filter(
                user=user,
                completed=True
            ).select_related('order').prefetch_related('responses__question')
            
            serializer = FeedbackSessionSerializer(sessions, many=True)
            return Response({
                'success': True,
                'feedback_history': serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error fetching feedback history: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)  
       

class CheckFeedbackStatusAPIView(APIView):
    """
    Check if feedback has been submitted for a specific order.
    """
    
    def get(self, request, order_id):
        try:
            user = authenticate_request(request, need_user=True)
            
            has_feedback = FeedbackSession.objects.filter(
                user=user,
                order_id=order_id,
                completed=True
            ).exists()
            
            return Response({
                'success': True,
                'has_feedback': has_feedback
            })
            
        except Exception as e:
            logger.error(f"Error checking feedback status: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            

class RatingPromptEligibilityAPIView(APIView):
    """
    Check if user is eligible for app rating prompt.
    GET /api/feedback/rating-prompt/eligibility/
    
    Returns all eligibility data in a single response for efficient client-side caching.
    Requirements: 4.4, 6.1
    """
    
    def get(self, request):
        try:
            user = authenticate_request(request, need_user=True)
            
            service = RatingPromptEligibilityService(user)
            eligibility_data = service.check_eligibility()
            
            return Response({
                'success': True,
                **eligibility_data
            })
            
        except AuthenticationFailed as auth_error:
            return Response({
                'success': False,
                'error': str(auth_error)
            }, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Error checking rating prompt eligibility: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': 'An error occurred while checking eligibility'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RatingPromptRecordActionAPIView(APIView):
    """
    Record user action on rating prompt.
    POST /api/feedback/rating-prompt/record-action/
    
    Handles actions: rated, reminded, opted_out
    Requirements: 4.1, 4.2, 4.3
    """
    
    VALID_ACTIONS = ['rated', 'reminded', 'opted_out']
    
    def post(self, request):
        try:
            user = authenticate_request(request, need_user=True)
            
            action = request.data.get('action')
            
            # Validate action
            if not action:
                return Response({
                    'success': False,
                    'error': 'Action is required',
                    'code': 'MISSING_ACTION'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if action not in self.VALID_ACTIONS:
                return Response({
                    'success': False,
                    'error': f'Invalid action. Must be one of: {", ".join(self.VALID_ACTIONS)}',
                    'code': 'INVALID_ACTION'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get or create the rating prompt record
            rating_prompt, created = AppRatingPrompt.objects.get_or_create(
                user=user
            )
            
            # Update based on action
            if action == 'rated':
                # User acknowledged rating request (Requirements 1.3, 4.2)
                rating_prompt.has_rated = True
                
            elif action == 'reminded':
                # User chose "Remind Me Later" or dismissed (Requirements 2.1, 2.2, 2.3)
                rating_prompt.prompt_count += 1
                rating_prompt.last_prompt_at = timezone.now()
                
            elif action == 'opted_out':
                # User chose "Never Ask Again" (Requirements 3.1, 4.3)
                rating_prompt.opted_out = True
            
            rating_prompt.save()
            
            return Response({
                'success': True,
                'message': f'Action "{action}" recorded successfully',
                'prompt_count': rating_prompt.prompt_count,
                'has_rated': rating_prompt.has_rated,
                'opted_out': rating_prompt.opted_out,
                'last_prompt_at': rating_prompt.last_prompt_at.isoformat() if rating_prompt.last_prompt_at else None
            })
            
        except AuthenticationFailed as auth_error:
            return Response({
                'success': False,
                'error': str(auth_error)
            }, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Error recording rating prompt action: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': 'An error occurred while recording the action'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            
            
class PendingRatingsAPIView(APIView):
  def get(self, request):
    try:
      user = authenticate_request(request, need_user=True)
      completed_status = Status.objects.filter(name__iexact='completed').first()
      if not completed_status:
        return Response({
          'success':True,
          'pending_orders':[]
        })
      pending_orders = OrderNo.objects.filter(
        user=user,
        status=completed_status,
        assigned_agent__isnull=False
      ).exclude(
        rating__isnull=False
      ).select_related('assigned_agent').order_by('-created_at')
      
      serializer = PendingOrderSerializer(pending_orders, many=True)
      return Response({
        'success': True,
        'pending_orders': serializer.data
      })
    except AuthenticationFailed as auth_error:
      return Response({
        'success': False,
        'error':str(auth_error)
      },status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
      logger.error(f"Error fetching pending ratings: {str(e)}", exc_info=True)
      return Response({
        'success': False,
        'error': 'An error occurred while fetching pending orders'
      },status=status.HTTP_500_INTERNAL_SERVER_ERROR)
      
class CheckRatingAPIView(APIView):
  def get(self, request, order_id):
    try:
      user = authenticate_request(request, need_user=True)
      try:
        order = OrderNo.objects.select_related('assigned_agent').get(id=order_id)
      except OrderNo.DoesNotExist:
        return Response({
          'success': False,
          'error': 'Order not found'
        },status=status.HTTP_404_NOT_FOUND)
      if order.user_id != user.id:
        return Response({
          'success':False,
          'error':'You can only check ratings for your own orders'
        },status=status.HTTP_403_FORBIDDEN)
      is_rated = OrderRating.objects.filter(order=order).exists()
      agent_name = order.assigned_agent.name if order.assigned_agent else None
      return Response({
        'success': True,
        'is_rated':is_rated,
        'agent_name': agent_name
      })
    except AuthenticationFailed as auth_error:
      return Response({
        'success': False,
        'error':str(auth_error)
      },status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
      logger.error(f"Error checking rating status: {str(e)}", exc_info=True)
      return Response({
        'success': False,
        'error': 'An error occurred while checking rating status'
      }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
      
      
class SubmitRatingAPIView(APIView):
  def post(self, request):
    try:
      user = authenticate_request(request, need_user=True)
      order_id = request.data.get('order_id')
      rating_value = request.data.get('rating')
      tags = request.data.get('tags', [])
      feedback = request.data.get('feedback')
      
      if not order_id:
        return Response({
          'success': False,
          'error': 'order_id is required'
        },status=status.HTTP_400_BAD_REQUEST)
        
      if rating_value is None:
        return Response({
          'success':False,
          'error': 'rating is required'
        },status=status.HTTP_400_BAD_REQUEST)
        #get the order
      try:
        order = OrderNo.objects.select_related('assigned_agent','status').get(id=order_id)
      except OrderNo.DoesNotExist:
        return Response({
          'success': False,
          'error': 'Order not found'
        },status=status.HTTP_404_NOT_FOUND)
      if order.user_id != user.id:
        return Response({
          'success':False,
          'error':'You can only rate your own orders'
        },status=status.HTTP_403_FORBIDDEN)
      if not order.status or order.status.name.lower() != 'completed':
        return Response({
          'success':False,
          'error': 'Order must be completed before rating'
        },status=status.HTTP_400_BAD_REQUEST)
        
      if not order.assigned_agent:
        return Response({
          'success':False,
          'error': 'Order has no assigned agent'
        },status=status.HTTP_400_BAD_REQUEST)
      if OrderRating.objects.filter(order=order).exists():
        return Response({
          'success':False,
          'error':'Order has already been rated'
        },status=status.HTTP_400_BAD_REQUEST)
        
      serializer = OrderRatingSerializer(data={
        'rating':rating_value,
        'tags': tags,
        'feedback': feedback
      })
      
      if not serializer.is_valid():
        return Response({
          'success': False,
          'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
      with transaction.atomic():
        order_rating = OrderRating.objects.create(
          order=order,
          user=user,
          agent=order.assigned_agent,
          rating=serializer.validated_data['rating'],
          feedback=serializer.validated_data.get('feedback'),
          tags=serializer.validated_data.get('tags', [])
        )
        
        update_agent_rating(order.assigned_agent, serializer.validated_data['rating'])
        
      return Response({
        'success': True,
        'message': 'Rating submitted successfully',
        'rating_id': order_rating.id
      },status=status.HTTP_201_CREATED)
    except AuthenticationFailed as auth_error:
      return Response({
        'success': False,
        'error': str(auth_error)
      }, status=status.HTTP_401_UNAUTHORIZED)
      
    except Exception  as e:
      logger.error(f"Error submitting rating: {str(e)}", exc_info=True)
      return Response({
        'success': False,
        'error': 'An error occurred while submitting the rating'
      }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
      
class AdminAllRatingsAPIView(APIView):
  def get(self,request):
    try:
      user = authenticate_request(request, need_user=True)
      if not user.is_staff:
        return Response({
          'success': False,
          'error': 'Admin access required'
        },status=status.HTTP_403_FORBIDDEN)
      agent_id = request.GET.get('agent_id')
      min_rating = request.GET.get('min_rating')
      max_rating = request.GET.get('max_rating')
      
      ratings = OrderRating.objects.select_related(
        'order', 'user', 'agent'
      ).order_by('-created_at')
      
      if agent_id:
        ratings = ratings.filter(agent_id=agent_id)
      if min_rating:
        ratings = ratings.filter(rating__gte=int(min_rating))
      if max_rating:
        ratings = ratings.filter(rating__lte=int(max_rating))
      ratings_data = []
      for rating in ratings:
        ratings_data.append({
          'id': rating.id,
          'order_id': rating.order.id,
          'order_number': rating.order.order_number,
          'user_id': rating.user.id,
          'user_name': rating.user.name if hasattr(rating.user, 'name') else rating.user.email,
          'user_email': rating.user.email,
          'agent_id': rating.agent.id,
          'agent_name': rating.agent.name,
          'agent_code': rating.agent.agent_code if hasattr(rating.agent, 'agent_code') else None,
          'rating': rating.rating,
          'feedback': rating.feedback,
          'tags': rating.tags,
          'created_at': rating.created_at.isoformat()
        
        })
      return Response({
        'success': True,
        'ratings': ratings_data,
        'count': len(ratings_data)
      })
    except AuthenticationFailed as auth_error:
      return Response({
        'success': False,
        'error': str(auth_error)
      }, status=status.HTTP_401_UNAUTHORIZED)
      
    except Exception as e:
      logger.error(f"Error fetching all ratings: {str(e)}", exc_info=True)
      return Response({
        'success': False,
        'error': 'An error occurred while fetching ratings'
      }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
      
      
class AdminRatingStatsAPIView(APIView):
    """
    Admin endpoint to get rating statistics.
    GET /api/feedback/ratings/stats/
    
    Returns aggregate statistics for ratings.
    """
    
    def get(self, request):
        try:
            user = authenticate_request(request, need_user=True)
            
            # Check if user is staff/admin
            if not user.is_staff:
                return Response({
                    'success': False,
                    'error': 'Admin access required'
                }, status=status.HTTP_403_FORBIDDEN)
            
            from django.db.models import Avg, Count
            from django.db.models.functions import TruncDate
            
            # Get overall stats
            total_ratings = OrderRating.objects.count()
            avg_rating = OrderRating.objects.aggregate(avg=Avg('rating'))['avg'] or 0
            
            # Rating distribution
            rating_distribution = OrderRating.objects.values('rating').annotate(
                count=Count('id')
            ).order_by('rating')
            
            # Tag frequency
            from collections import Counter
            all_tags = []
            for rating in OrderRating.objects.values_list('tags', flat=True):
                if rating:
                    all_tags.extend(rating)
            tag_counts = dict(Counter(all_tags))
            
            # Recent ratings count (last 7 days)
            from datetime import timedelta
            seven_days_ago = timezone.now() - timedelta(days=7)
            recent_count = OrderRating.objects.filter(created_at__gte=seven_days_ago).count()
            
            return Response({
                'success': True,
                'stats': {
                    'total_ratings': total_ratings,
                    'average_rating': round(avg_rating, 2),
                    'rating_distribution': {item['rating']: item['count'] for item in rating_distribution},
                    'tag_frequency': tag_counts,
                    'recent_ratings_7d': recent_count
                }
            })
            
        except AuthenticationFailed as auth_error:
            return Response({
                'success': False,
                'error': str(auth_error)
            }, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Error fetching rating stats: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'error': 'An error occurred while fetching statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)