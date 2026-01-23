# Generated migration for AuditLog deletion feedback fields

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0011_alter_auditlog_action_apple_oauth'),
    ]

    operations = [
        migrations.AddField(
            model_name='auditlog',
            name='deleted_user_id',
            field=models.IntegerField(blank=True, help_text='Original user ID for deleted accounts', null=True),
        ),
        migrations.AddField(
            model_name='auditlog',
            name='deleted_user_email',
            field=models.EmailField(blank=True, help_text='Email at time of deletion', max_length=254, null=True),
        ),
        migrations.AddField(
            model_name='auditlog',
            name='deleted_user_name',
            field=models.CharField(blank=True, help_text='Name at time of deletion', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='auditlog',
            name='deletion_feedback',
            field=models.ForeignKey(
                blank=True,
                help_text='Link to deletion feedback if account was deleted',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='audit_logs',
                to='authentication.accountdeletionfeedback',
            ),
        ),
    ]
