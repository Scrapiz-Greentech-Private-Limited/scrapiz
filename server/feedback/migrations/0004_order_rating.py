# Generated migration for OrderRating model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('feedback', '0003_add_app_rating_prompt'),
        ('inventory', '0001_initial'),
        ('agents', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='OrderRating',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.PositiveSmallIntegerField(
                    help_text='Rating value from 1 to 5 stars',
                    validators=[
                        django.core.validators.MinValueValidator(1),
                        django.core.validators.MaxValueValidator(5)
                    ]
                )),
                ('feedback', models.TextField(blank=True, help_text='Optional text feedback from user', null=True)),
                ('tags', models.JSONField(blank=True, default=list, help_text='JSON array of RatingTag enum values')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('order', models.OneToOneField(
                    help_text='The order being rated',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='rating',
                    to='inventory.orderno'
                )),
                ('user', models.ForeignKey(
                    help_text='User who submitted the rating',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='order_ratings',
                    to=settings.AUTH_USER_MODEL
                )),
                ('agent', models.ForeignKey(
                    help_text='Agent who handled the order',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='order_ratings',
                    to='agents.agent'
                )),
            ],
            options={
                'verbose_name': 'Order Rating',
                'verbose_name_plural': 'Order Ratings',
                'db_table': 'order_ratings',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='orderrating',
            index=models.Index(fields=['user'], name='order_ratin_user_id_a1b2c3_idx'),
        ),
        migrations.AddIndex(
            model_name='orderrating',
            index=models.Index(fields=['agent'], name='order_ratin_agent_i_d4e5f6_idx'),
        ),
        migrations.AddIndex(
            model_name='orderrating',
            index=models.Index(fields=['created_at'], name='order_ratin_created_g7h8i9_idx'),
        ),
    ]
