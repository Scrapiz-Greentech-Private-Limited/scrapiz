from django.urls import path
from .views import (
    FeedbackQuestionsAPIView,
    SubmitFeedbackAPIView,
    UserFeedbackHistoryAPIView,
    CheckFeedbackStatusAPIView,
    RatingPromptEligibilityAPIView,
    RatingPromptRecordActionAPIView,
    PendingRatingsAPIView,
    CheckRatingAPIView,
    SubmitRatingAPIView,
    AdminAllRatingsAPIView,
    AdminRatingStatsAPIView
)

urlpatterns = [
    path('questions/', FeedbackQuestionsAPIView.as_view(), name='feedback-questions'),
    path('submit/', SubmitFeedbackAPIView.as_view(), name='submit-feedback'),
    path('history/', UserFeedbackHistoryAPIView.as_view(), name='feedback-history'),
    path('status/<int:order_id>/', CheckFeedbackStatusAPIView.as_view(), name='feedback-status'),
    # Rating prompt endpoints (Requirements 4.4)
    path('rating-prompt/eligibility/', RatingPromptEligibilityAPIView.as_view(), name='rating-prompt-eligibility'),
    path('rating-prompt/record-action/', RatingPromptRecordActionAPIView.as_view(), name='rating-prompt-record-action'),
    # Order rating endpoints (Requirements 6.1, 6.2, 6.3)
    path('ratings/pending/', PendingRatingsAPIView.as_view(), name='pending-ratings'),
    path('ratings/check/<int:order_id>/', CheckRatingAPIView.as_view(), name='check-rating'),
    path('ratings/submit/', SubmitRatingAPIView.as_view(), name='submit-rating'),
    # Admin rating endpoints
    path('ratings/all/', AdminAllRatingsAPIView.as_view(), name='admin-all-ratings'),
    path('ratings/stats/', AdminRatingStatsAPIView.as_view(), name='admin-rating-stats'),
]
