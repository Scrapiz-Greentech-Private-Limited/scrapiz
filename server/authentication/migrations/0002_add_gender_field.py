# Generated migration for adding gender field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='gender',
            field=models.CharField(
                blank=True,
                choices=[
                    ('male', 'Male'),
                    ('female', 'Female'),
                    ('prefer_not_to_say', 'Prefer not to say')
                ],
                max_length=20,
                null=True
            ),
        ),
    ]
