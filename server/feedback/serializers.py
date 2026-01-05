from rest_framework import serializers
from .models import FeedbackQuestion, FeedbackSession, FeedbackResponse, OrderRating, RatingTag


class FeedbackQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedbackQuestion
        fields = [
            'id', 'question_text', 'question_type', 'context',
            'order', 'is_required', 'placeholder_text', 'options'
        ]


class FeedbackResponseSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(write_only=True)
    question = FeedbackQuestionSerializer(read_only=True)
    
    class Meta:
        model = FeedbackResponse
        fields = [
            'id', 'question_id', 'question', 'rating_value',
            'text_value', 'boolean_value', 'choice_value', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class FeedbackSessionSerializer(serializers.ModelSerializer):
    responses = FeedbackResponseSerializer(many=True, read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    class Meta:
        model = FeedbackSession
        fields = [
            'id', 'order', 'order_number', 'context',
            'completed', 'responses', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'completed']


class SubmitFeedbackSerializer(serializers.Serializer):
    """
    Serializer for submitting feedback in a single request.
    """
    order_id = serializers.IntegerField(required=False, allow_null=True)
    context = serializers.CharField(default='order_completion')
    responses = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
    def validate_responses(self, value):
        """Validate each response has required fields"""
        for response in value:
            if 'question_id' not in response:
                raise serializers.ValidationError(
                    "Each response must have a 'question_id'"
                )
            # At least one value field should be present
            value_fields = ['rating_value', 'text_value', 'boolean_value', 'choice_value']
            if not any(field in response for field in value_fields):
                raise serializers.ValidationError(
                    f"Response for question {response['question_id']} must have a value"
                )
        return value


class OrderRatingSerializer(serializers.ModelSerializer):
    """
    Serializer for OrderRating model.
    Handles rating submission with validation for tags.
    """
    agent_name = serializers.CharField(source='agent.name', read_only=True)
    order_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = OrderRating
        fields = [
            'id', 'order', 'order_id', 'rating', 'feedback', 
            'tags', 'agent_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'agent_name', 'order']
    
    def validate_tags(self, value):
        """Validate that all tags are valid RatingTag enum values."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Tags must be a list")
        
        valid_tags = [tag.value for tag in RatingTag]
        invalid_tags = [tag for tag in value if tag not in valid_tags]
        
        if invalid_tags:
            raise serializers.ValidationError(
                f"Invalid tag(s): {', '.join(invalid_tags)}. "
                f"Valid tags are: {', '.join(valid_tags)}"
            )
        
        return value
    
    def validate_rating(self, value):
        """Validate rating is between 1 and 5."""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


class PendingOrderSerializer(serializers.Serializer):
    """
    Serializer for pending orders eligible for rating.
    Returns order details with agent information.
    """
    order_id = serializers.IntegerField(source='id')
    order_number = serializers.CharField()
    agent_id = serializers.IntegerField(source='assigned_agent.id')
    agent_name = serializers.CharField(source='assigned_agent.name')
    completed_at = serializers.DateTimeField(source='created_at')
