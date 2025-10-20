from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0004_user_session_id'),
        ('user', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='NotificationPreference',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('push_notifications', models.BooleanField(default=True)),
                ('pickup_reminders', models.BooleanField(default=True)),
                ('order_updates', models.BooleanField(default=True)),
                ('payment_alerts', models.BooleanField(default=True)),
                ('promotional_offers', models.BooleanField(default=False)),
                ('weekly_reports', models.BooleanField(default=True)),
                ('email_notifications', models.BooleanField(default=True)),
                ('sms_notifications', models.BooleanField(default=False)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='notification_preferences', to='authentication.user')),
            ],
        ),
    ]
