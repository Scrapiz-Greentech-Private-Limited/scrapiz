# Generated migration for adding images field to OrderNo model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='orderno',
            name='images',
            field=models.JSONField(blank=True, default=list, null=True),
        ),
    ]
