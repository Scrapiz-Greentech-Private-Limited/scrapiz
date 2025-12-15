# Generated migration for Apple OAuth audit log action

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0010_user_apple_user_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='auditlog',
            name='action',
            field=models.CharField(
                blank=True,
                choices=[
                    ('password_reset', 'Password Reset'),
                    ('login', 'Login'),
                    ('logout', 'Logout'),
                    ('oauth_login', 'OAuth Login'),
                    ('apple_oauth_login', 'Apple OAuth Login'),
                    ('account_deleted', 'Account Deleted'),
                ],
                max_length=50,
                null=True,
            ),
        ),
    ]
