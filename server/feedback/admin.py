from django.contrib import admin
from .models import FeedbackQuestion, FeedbackSession, FeedbackResponse, AppRatingPrompt, OrderRating, RatingTag


@admin.register(OrderRating)
class OrderRatingAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'user', 'agent', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('order__order_number', 'user__email', 'agent__name', 'feedback')
    readonly_fields = ('order', 'user', 'agent', 'rating', 'feedback', 'tags', 'created_at')
    date_hierarchy = 'created_at'
    
    def get_tags_display(self, obj):
        return ', '.join(obj.tags) if obj.tags else '-'
    get_tags_display.short_description = 'Tags'


@admin.register(FeedbackQuestion)
class FeedbackQuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'question_text', 'question_type', 'context', 'order', 'is_required', 'is_active')
    list_filter = ('question_type', 'context', 'is_active', 'is_required')
    search_fields = ('question_text',)
    ordering = ('context', 'order')
    list_editable = ('order', 'is_active', 'is_required')


class FeedbackResponseInline(admin.TabularInline):
    model = FeedbackResponse
    extra = 0
    readonly_fields = ('question', 'rating_value', 'text_value', 'boolean_value', 'choice_value', 'created_at')
    can_delete = False


@admin.register(FeedbackSession)
class FeedbackSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'order', 'context', 'completed', 'created_at')
    list_filter = ('context', 'completed', 'created_at')
    search_fields = ('user__email', 'order__order_number')
    readonly_fields = ('user', 'order', 'context', 'completed', 'created_at', 'updated_at')
    inlines = [FeedbackResponseInline]
    date_hierarchy = 'created_at'


@admin.register(FeedbackResponse)
class FeedbackResponseAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'question', 'rating_value', 'text_value', 'created_at')
    list_filter = ('question__question_type', 'created_at')
    search_fields = ('session__user__email', 'text_value')
    readonly_fields = ('session', 'question', 'rating_value', 'text_value', 'boolean_value', 'choice_value', 'created_at')


@admin.register(AppRatingPrompt)
class AppRatingPromptAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'prompt_count', 'last_prompt_at', 'has_rated', 'opted_out', 'created_at')
    list_filter = ('has_rated', 'opted_out', 'created_at')
    search_fields = ('user__email',)
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
