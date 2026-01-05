# Data migration to seed initial feedback questions

from django.db import migrations


def seed_questions(apps, schema_editor):
    FeedbackQuestion = apps.get_model('feedback', 'FeedbackQuestion')
    
    # Order completion feedback questions
    questions = [
        {
            'question_text': 'How easy was it to use our app?',
            'question_type': 'rating',
            'context': 'order_completion',
            'order': 1,
            'is_required': True,
            'placeholder_text': None,
            'options': None,
        },
        {
            'question_text': 'What can we do better to enhance your experience?',
            'question_type': 'text',
            'context': 'order_completion',
            'order': 2,
            'is_required': False,
            'placeholder_text': 'Share your suggestions with us...',
            'options': None,
        },
    ]
    
    for q in questions:
        FeedbackQuestion.objects.create(**q)


def reverse_seed(apps, schema_editor):
    FeedbackQuestion = apps.get_model('feedback', 'FeedbackQuestion')
    FeedbackQuestion.objects.filter(context='order_completion').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('feedback', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_questions, reverse_seed),
    ]
