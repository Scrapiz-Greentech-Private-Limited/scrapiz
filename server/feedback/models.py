from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class RatingTag(models.TextChoices):
    """
    Predefined feedback tags for order ratings.
    """
    POLITE = 'POLITE', 'Agent was polite'
    ON_TIME = 'ON_TIME', 'On time'
    ACCURATE_WEIGHT = 'ACCURATE_WEIGHT', 'Accurate weight'
    GOOD_PRICE = 'GOOD_PRICE', 'Good Price'
    PROFESSIONAL = 'PROFESSIONAL', 'Professional'
    NEEDS_IMPROVEMENT = 'NEEDS_IMPROVEMENT', 'Needs improvement'


class OrderRating(models.Model):
    """
    Stores user ratings for completed orders.
    Each order can only have one rating (OneToOne relationship).
    """
    order = models.OneToOneField(
        'inventory.OrderNo',
        on_delete=models.CASCADE,
        related_name='rating',
        help_text="The order being rated"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='order_ratings',
        help_text="User who submitted the rating"
    )
    agent = models.ForeignKey(
        'agents.Agent',
        on_delete=models.CASCADE,
        related_name='order_ratings',
        help_text="Agent who handled the order"
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating value from 1 to 5 stars"
    )
    feedback = models.TextField(
        null=True,
        blank=True,
        help_text="Optional text feedback from user"
    )
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="JSON array of RatingTag enum values"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'order_ratings'
        verbose_name = 'Order Rating'
        verbose_name_plural = 'Order Ratings'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['agent']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Rating {self.rating}/5 for Order #{self.order.order_number}"


class FeedbackQuestion(models.Model):
    """
    Scalable model for feedback questions.
    Allows adding new questions without code changes.
    """
    QUESTION_TYPES = [
        ('rating', 'Rating (1-5)'),
        ('text', 'Text Input'),
        ('multiple_choice', 'Multiple Choice'),
        ('boolean', 'Yes/No'),
    ]
    
    CONTEXTS = [
        ('order_completion', 'After Order Completion'),
        ('app_general', 'General App Feedback'),
        ('support', 'Support Feedback'),
        ('agent', 'Agent Feedback'),
    ]
    
    question_text = models.CharField(max_length=500)
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    context = models.CharField(max_length=30, choices=CONTEXTS, default='order_completion')
    order = models.PositiveIntegerField(default=0, help_text="Display order of the question")
    is_required = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    placeholder_text = models.CharField(max_length=200, blank=True, null=True)
    options = models.JSONField(
        null=True, 
        blank=True, 
        help_text="Options for multiple choice questions"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'feedback_questions'
        ordering = ['context', 'order']
        verbose_name = 'Feedback Question'
        verbose_name_plural = 'Feedback Questions'
    
    def __str__(self):
        return f"{self.context}: {self.question_text[:50]}"


class FeedbackSession(models.Model):
    """
    Groups feedback responses for a single feedback submission.
    Can be linked to an order or standalone.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feedback_sessions'
    )
    order = models.ForeignKey(
        'inventory.OrderNo',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedback_sessions'
    )
    context = models.CharField(max_length=30, default='order_completion')
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'feedback_sessions'
        ordering = ['-created_at']
        verbose_name = 'Feedback Session'
        verbose_name_plural = 'Feedback Sessions'
    
    def __str__(self):
        order_info = f" for Order #{self.order.order_number}" if self.order else ""
        return f"Feedback from {self.user.email}{order_info}"


class FeedbackResponse(models.Model):
    """
    Individual response to a feedback question.
    """
    session = models.ForeignKey(
        FeedbackSession,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    question = models.ForeignKey(
        FeedbackQuestion,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    rating_value = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    text_value = models.TextField(null=True, blank=True)
    boolean_value = models.BooleanField(null=True, blank=True)
    choice_value = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'feedback_responses'
        ordering = ['session', 'question__order']
        verbose_name = 'Feedback Response'
        verbose_name_plural = 'Feedback Responses'
        unique_together = ['session', 'question']
    
    def __str__(self):
        return f"Response to '{self.question.question_text[:30]}'"
    
    @property
    def value(self):
        """Returns the appropriate value based on question type"""
        if self.question.question_type == 'rating':
            return self.rating_value
        elif self.question.question_type == 'text':
            return self.text_value
        elif self.question.question_type == 'boolean':
            return self.boolean_value
        elif self.question.question_type == 'multiple_choice':
            return self.choice_value
        return None


class AppRatingPrompt(models.Model):
    """
    Tracks when a user was prompted to rate the app, their response, and prompt count.
    Used to determine eligibility for showing the in-app review prompt.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='app_rating_prompt'
    )
    prompt_count = models.PositiveIntegerField(default=0)
    last_prompt_at = models.DateTimeField(null=True, blank=True)
    has_rated = models.BooleanField(default=False)  # User_Acknowledged_Rating_Request
    opted_out = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'app_rating_prompts'
        verbose_name = 'App Rating Prompt'
        verbose_name_plural = 'App Rating Prompts'
    
    def __str__(self):
        return f"Rating Prompt for {self.user.email} (count: {self.prompt_count})"
