# Generated migration for adding Google Meet fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='servicebooking',
            name='meeting_link',
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='servicebooking',
            name='meeting_event_id',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
