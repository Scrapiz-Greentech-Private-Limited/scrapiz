# Generated migration for feedback models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('inventory', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='FeedbackQuestion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('question_text', models.CharField(max_length=500)),
                ('question_type', models.CharField(choices=[('rating', 'Rating (1-5)'), ('text', 'Text Input'), ('multiple_choice', 'Multiple Choice'), ('boolean', 'Yes/No')], max_length=20)),
                ('context', models.CharField(choices=[('order_completion', 'After Order Completion'), ('app_general', 'General App Feedback'), ('support', 'Support Feedback'), ('agent', 'Agent Feedback')], default='order_completion', max_length=30)),
                ('order', models.PositiveIntegerField(default=0, help_text='Display order of the question')),
                ('is_required', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=True)),
                ('placeholder_text', models.CharField(blank=True, max_length=200, null=True)),
                ('options', models.JSONField(blank=True, help_text='Options for multiple choice questions', null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Feedback Question',
                'verbose_name_plural': 'Feedback Questions',
                'db_table': 'feedback_questions',
                'ordering': ['context', 'order'],
            },
        ),
        migrations.CreateModel(
            name='FeedbackSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('context', models.CharField(default='order_completion', max_length=30)),
                ('completed', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('order', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='feedback_sessions', to='inventory.orderno')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='feedback_sessions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Feedback Session',
                'verbose_name_plural': 'Feedback Sessions',
                'db_table': 'feedback_sessions',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='FeedbackResponse',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating_value', models.PositiveIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('text_value', models.TextField(blank=True, null=True)),
                ('boolean_value', models.BooleanField(blank=True, null=True)),
                ('choice_value', models.CharField(blank=True, max_length=200, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('question', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='responses', to='feedback.feedbackquestion')),
                ('session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='responses', to='feedback.feedbacksession')),
            ],
            options={
                'verbose_name': 'Feedback Response',
                'verbose_name_plural': 'Feedback Responses',
                'db_table': 'feedback_responses',
                'ordering': ['session', 'question__order'],
                'unique_together': {('session', 'question')},
            },
        ),
    ]
