# Generated migration for phone authentication fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0011_alter_auditlog_action_apple_oauth'),
    ]

    operations = [
        # Update phone_number field to be unique, indexed, and with proper max_length
        migrations.AlterField(
            model_name='user',
            name='phone_number',
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text='Phone number in E.164 format (e.g., +919876543210)',
                max_length=20,
                null=True,
                unique=True,
            ),
        ),
        # Add firebase_uid field for Firebase phone authentication
        migrations.AddField(
            model_name='user',
            name='firebase_uid',
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text='Firebase unique user identifier for phone authentication',
                max_length=128,
                null=True,
                unique=True,
            ),
        ),
    ]
