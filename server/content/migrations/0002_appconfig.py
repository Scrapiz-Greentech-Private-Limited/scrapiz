# Generated migration for AppConfig model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('content', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AppConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('enforce_sell_screen_gate', models.BooleanField(default=True, help_text='If True, users must pass serviceability checks to access sell screen')),
                ('maintenance_mode', models.BooleanField(default=False, help_text='If True, app shows maintenance screen')),
                ('min_app_version', models.CharField(default='1.0.0', help_text="Minimum required app version (e.g., '1.2.0')", max_length=20)),
                ('enable_location_skip', models.BooleanField(default=False, help_text='If True, allows skipping location selection for testing')),
                ('force_update_url_android', models.URLField(default='https://play.google.com/store/apps/details?id=com.scrapiz.app', help_text='Play Store URL for Android app updates', max_length=500)),
                ('force_update_url_ios', models.URLField(default='https://apps.apple.com/app/scrapiz/id123456789', help_text='App Store URL for iOS app updates', max_length=500)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='app_config_updates', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'App Configuration',
                'verbose_name_plural': 'App Configuration',
            },
        ),
    ]
