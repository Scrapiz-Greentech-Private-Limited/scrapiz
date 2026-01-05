"""
Rating Prompt Eligibility Service

This service determines whether a user is eligible to be shown the in-app
rating prompt based on various conditions including completed orders,
order ratings, timing, and user preferences.
"""

from datetime import timedelta
from typing import Optional
from django.utils import timezone
from django.db.models import Q

from .models import AppRatingPrompt, FeedbackSession, FeedbackResponse
from inventory.models import OrderNo, Status


class RatingPromptEligibilityService:
    """
    Service to check user eligibility for app rating prompts.
    
    Eligibility conditions (all must be met):
    - completed_orders >= 2
    - last_order_rating >= 4
    - has_rated == false
    - opted_out == false
    - days_since_last_prompt >= 7 (or null/never prompted)
    - prompt_count < 2
    - days_since_low_rating >= 30 (or no low rating exists)
    """
    
    # Configuration constants
    MIN_COMPLETED_ORDERS = 2
    MIN_RATING_THRESHOLD = 4
    MAX_PROMPT_COUNT = 2
    DAYS_BETWEEN_PROMPTS = 7
    DAYS_AFTER_LOW_RATING = 30
    
    def __init__(self, user):
        self.user = user
        self._rating_prompt = None
    
    def _get_or_create_rating_prompt(self) -> AppRatingPrompt:
        """Get or create the AppRatingPrompt record for the user."""
        if self._rating_prompt is None:
            self._rating_prompt, _ = AppRatingPrompt.objects.get_or_create(
                user=self.user
            )
        return self._rating_prompt
    
    def _get_completed_orders_count(self) -> int:
        """Get the count of completed orders for the user."""
        completed_status = Status.objects.filter(name__iexact='completed').first()
        if not completed_status:
            return 0
        
        return OrderNo.objects.filter(
            user=self.user,
            status=completed_status
        ).count()
    
    def _get_last_order_rating(self) -> Optional[int]:
        """
        Get the rating from the user's most recent completed order feedback.
        Returns None if no feedback exists.
        """
        completed_status = Status.objects.filter(name__iexact='completed').first()
        if not completed_status:
            return None
        
        # Get the most recent completed order with feedback
        last_feedback_session = FeedbackSession.objects.filter(
            user=self.user,
            order__status=completed_status,
            completed=True,
            context='order_completion'
        ).select_related('order').order_by('-created_at').first()
        
        if not last_feedback_session:
            return None
        
        # Get the rating response from this session
        rating_response = FeedbackResponse.objects.filter(
            session=last_feedback_session,
            question__question_type='rating',
            rating_value__isnull=False
        ).first()
        
        return rating_response.rating_value if rating_response else None
    
    def _get_last_low_rating_date(self):
        """
        Get the date of the user's most recent low rating (< 4).
        Returns None if no low rating exists.
        """
        low_rating_response = FeedbackResponse.objects.filter(
            session__user=self.user,
            session__completed=True,
            session__context='order_completion',
            question__question_type='rating',
            rating_value__lt=self.MIN_RATING_THRESHOLD
        ).order_by('-created_at').first()
        
        return low_rating_response.created_at if low_rating_response else None
    
    def _calculate_days_since(self, date) -> Optional[int]:
        """Calculate days since a given date. Returns None if date is None."""
        if date is None:
            return None
        delta = timezone.now() - date
        return delta.days
    
    def check_eligibility(self) -> dict:
        """
        Check if the user is eligible for a rating prompt.
        
        Returns a dict with eligibility status and all relevant data.
        """
        rating_prompt = self._get_or_create_rating_prompt()
        
        # Gather all data
        completed_orders_count = self._get_completed_orders_count()
        last_order_rating = self._get_last_order_rating()
        last_low_rating_date = self._get_last_low_rating_date()
        
        days_since_last_prompt = self._calculate_days_since(rating_prompt.last_prompt_at)
        days_since_low_rating = self._calculate_days_since(last_low_rating_date)
        
        # Check all eligibility conditions
        is_eligible = self._evaluate_eligibility(
            completed_orders_count=completed_orders_count,
            last_order_rating=last_order_rating,
            has_rated=rating_prompt.has_rated,
            opted_out=rating_prompt.opted_out,
            days_since_last_prompt=days_since_last_prompt,
            prompt_count=rating_prompt.prompt_count,
            days_since_low_rating=days_since_low_rating
        )
        
        return {
            'is_eligible': is_eligible,
            'completed_orders_count': completed_orders_count,
            'last_order_rating': last_order_rating,
            'prompt_count': rating_prompt.prompt_count,
            'last_prompt_at': rating_prompt.last_prompt_at.isoformat() if rating_prompt.last_prompt_at else None,
            'has_rated': rating_prompt.has_rated,
            'opted_out': rating_prompt.opted_out,
            'days_since_last_prompt': days_since_last_prompt,
            'days_since_low_rating': days_since_low_rating
        }
    
    def _evaluate_eligibility(
        self,
        completed_orders_count: int,
        last_order_rating: Optional[int],
        has_rated: bool,
        opted_out: bool,
        days_since_last_prompt: Optional[int],
        prompt_count: int,
        days_since_low_rating: Optional[int]
    ) -> bool:
        """
        Evaluate all eligibility conditions.
        
        All conditions must be met for eligibility:
        1. completed_orders >= 2
        2. last_order_rating >= 4
        3. has_rated == false
        4. opted_out == false
        5. days_since_last_prompt >= 7 (or null/never prompted)
        6. prompt_count < 2
        7. days_since_low_rating >= 30 (or no low rating exists)
        """
        # Condition 1: Minimum completed orders
        if completed_orders_count < self.MIN_COMPLETED_ORDERS:
            return False
        
        # Condition 2: Last order rating must be >= 4
        if last_order_rating is None or last_order_rating < self.MIN_RATING_THRESHOLD:
            return False
        
        # Condition 3: User has not already rated
        if has_rated:
            return False
        
        # Condition 4: User has not opted out
        if opted_out:
            return False
        
        # Condition 5: Enough days since last prompt (or never prompted)
        if days_since_last_prompt is not None and days_since_last_prompt < self.DAYS_BETWEEN_PROMPTS:
            return False
        
        # Condition 6: Prompt count under limit
        if prompt_count >= self.MAX_PROMPT_COUNT:
            return False
        
        # Condition 7: Enough days since low rating (or no low rating)
        if days_since_low_rating is not None and days_since_low_rating < self.DAYS_AFTER_LOW_RATING:
            return False
        
        return True


def update_agent_rating(agent, new_rating: int) -> None:
    """
    Update agent's average rating and rating count after a new rating is submitted.
    
    Uses the formula: (old_avg * old_count + new_rating) / (old_count + 1)
    
    Args:
        agent: The Agent instance to update
        new_rating: The new rating value (1-5)
    
    Requirements: 7.1, 7.2, 7.3
    """
    from decimal import Decimal
    
    old_avg = agent.average_rating or Decimal('0')
    old_count = agent.rating_count or 0
    
    # Calculate new average: (old_avg * old_count + new_rating) / (old_count + 1)
    new_count = old_count + 1
    new_avg = (old_avg * old_count + Decimal(str(new_rating))) / new_count
    
    # Update agent fields
    agent.average_rating = round(new_avg, 2)
    agent.rating_count = new_count
    agent.save(update_fields=['average_rating', 'rating_count', 'updated_at'])
