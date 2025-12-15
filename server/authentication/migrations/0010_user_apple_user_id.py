# Generated migration for Apple OAuth authentication

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0009_merge_20251105_0942'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='apple_user_id',
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text="Apple's unique user identifier (sub claim)",
                max_length=255,
                null=True,
                unique=True,
            ),
        ),
    ]
