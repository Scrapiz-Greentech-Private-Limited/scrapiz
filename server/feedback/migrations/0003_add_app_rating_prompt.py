# Generated migration for AppRatingPrompt model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('feedback', '0002_seed_initial_questions'),
    ]

    operations = [
        migrations.CreateModel(
            name='AppRatingPrompt',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('prompt_count', models.PositiveIntegerField(default=0)),
                ('last_prompt_at', models.DateTimeField(blank=True, null=True)),
                ('has_rated', models.BooleanField(default=False)),
                ('opted_out', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='app_rating_prompt', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'App Rating Prompt',
                'verbose_name_plural': 'App Rating Prompts',
                'db_table': 'app_rating_prompts',
            },
        ),
    ]
