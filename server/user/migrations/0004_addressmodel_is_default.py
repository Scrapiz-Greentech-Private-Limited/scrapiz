from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0003_pushtoken'),
    ]

    operations = [
        migrations.AddField(
            model_name='addressmodel',
            name='is_default',
            field=models.BooleanField(default=False, help_text="Whether this is the user's default address"),
        ),
    ]
