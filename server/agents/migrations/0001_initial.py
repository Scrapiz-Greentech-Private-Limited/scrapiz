# Generated migration for agents app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('serviceability', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Agent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('agent_code', models.CharField(db_index=True, editable=False, help_text='Unique agent code in format AGT-XXXXXX', max_length=12, unique=True)),
                ('name', models.CharField(help_text='Full name of the agent', max_length=100)),
                ('phone', models.CharField(help_text="Agent's phone number", max_length=15, unique=True, validators=[django.core.validators.RegexValidator(message='Enter a valid phone number (10-15 digits)', regex='^\\+?[1-9]\\d{9,14}$')])),
                ('email', models.EmailField(help_text="Agent's email address", max_length=254, unique=True)),
                ('address', models.TextField(help_text="Agent's residential address")),
                ('profile_image_url', models.URLField(blank=True, help_text="URL to agent's profile image", max_length=500, null=True)),
                ('status', models.CharField(choices=[('onboarding', 'Onboarding'), ('active', 'Active'), ('inactive', 'Inactive'), ('suspended', 'Suspended')], db_index=True, default='onboarding', help_text='Current operational status of the agent', max_length=20)),
                ('kyc_status', models.CharField(choices=[('pending', 'Pending'), ('verified', 'Verified'), ('rejected', 'Rejected')], db_index=True, default='pending', help_text='KYC verification status', max_length=20)),
                ('availability', models.CharField(choices=[('available', 'Available'), ('on_duty', 'On Duty'), ('offline', 'Offline')], db_index=True, default='offline', help_text='Real-time availability status', max_length=20)),
                ('vehicle_number', models.CharField(blank=True, help_text='Vehicle registration number', max_length=20, null=True)),
                ('vehicle_type', models.CharField(blank=True, help_text='Type of vehicle (e.g., Tempo, Auto, Bike)', max_length=50, null=True)),
                ('vehicle_registration_url', models.URLField(blank=True, help_text='URL to vehicle registration document', max_length=500, null=True)),
                ('daily_capacity', models.PositiveIntegerField(default=10, help_text='Maximum orders the agent can handle per day', validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(100)])),
                ('current_day_orders', models.PositiveIntegerField(default=0, help_text='Number of orders assigned today')),
                ('last_order_reset', models.DateField(auto_now_add=True, help_text='Date when current_day_orders was last reset')),
                ('total_orders', models.PositiveIntegerField(default=0, help_text='Total orders ever assigned to this agent')),
                ('completed_orders', models.PositiveIntegerField(default=0, help_text='Total orders successfully completed')),
                ('total_weight_collected', models.DecimalField(decimal_places=2, default=0, help_text='Total weight of scrap collected in kg', max_digits=10, validators=[django.core.validators.MinValueValidator(0)])),
                ('average_rating', models.DecimalField(decimal_places=2, default=0, help_text='Average customer rating (0-5)', max_digits=3, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(5)])),
                ('rating_count', models.PositiveIntegerField(default=0, help_text='Number of ratings received')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('service_areas', models.ManyToManyField(blank=True, help_text='Pincodes where this agent can operate', related_name='agents', to='serviceability.serviceablepincode')),
            ],
            options={
                'verbose_name': 'Agent',
                'verbose_name_plural': 'Agents',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='AgentDocument',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('document_type', models.CharField(choices=[('aadhaar', 'Aadhaar Card'), ('pan', 'PAN Card'), ('driving_license', 'Driving License')], help_text='Type of document', max_length=20)),
                ('document_url', models.URLField(help_text='URL to the uploaded document', max_length=500)),
                ('verification_status', models.CharField(choices=[('pending', 'Pending'), ('verified', 'Verified'), ('rejected', 'Rejected')], db_index=True, default='pending', help_text='Current verification status', max_length=20)),
                ('rejection_reason', models.TextField(blank=True, help_text='Reason for rejection (if rejected)', null=True)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True, help_text='When the document was uploaded')),
                ('verified_at', models.DateTimeField(blank=True, help_text='When the document was verified/rejected', null=True)),
                ('agent', models.ForeignKey(help_text='The agent this document belongs to', on_delete=django.db.models.deletion.CASCADE, related_name='documents', to='agents.agent')),
                ('verified_by', models.ForeignKey(blank=True, help_text='Admin who verified/rejected the document', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='verified_agent_documents', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Agent Document',
                'verbose_name_plural': 'Agent Documents',
                'ordering': ['agent', 'document_type'],
                'unique_together': {('agent', 'document_type')},
            },
        ),
        migrations.CreateModel(
            name='AgentAuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[('created', 'Created'), ('updated', 'Updated'), ('status_changed', 'Status Changed'), ('kyc_updated', 'KYC Updated'), ('document_uploaded', 'Document Uploaded'), ('document_verified', 'Document Verified'), ('document_rejected', 'Document Rejected'), ('service_area_updated', 'Service Area Updated'), ('availability_changed', 'Availability Changed'), ('capacity_updated', 'Capacity Updated'), ('rating_updated', 'Rating Updated')], db_index=True, help_text='Type of action performed', max_length=30)),
                ('timestamp', models.DateTimeField(auto_now_add=True, db_index=True, help_text='When the action was performed')),
                ('previous_value', models.JSONField(blank=True, help_text='Previous state before the change', null=True)),
                ('new_value', models.JSONField(blank=True, help_text='New state after the change', null=True)),
                ('details', models.TextField(blank=True, help_text='Additional details about the action', null=True)),
                ('actor', models.ForeignKey(blank=True, help_text='User who performed the action', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='agent_audit_logs', to=settings.AUTH_USER_MODEL)),
                ('agent', models.ForeignKey(help_text='The agent this log entry relates to', on_delete=django.db.models.deletion.CASCADE, related_name='audit_logs', to='agents.agent')),
            ],
            options={
                'verbose_name': 'Agent Audit Log',
                'verbose_name_plural': 'Agent Audit Logs',
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='agent',
            index=models.Index(fields=['agent_code'], name='agents_agen_agent_c_7e2e3e_idx'),
        ),
        migrations.AddIndex(
            model_name='agent',
            index=models.Index(fields=['status', 'kyc_status'], name='agents_agen_status_5e8c3a_idx'),
        ),
        migrations.AddIndex(
            model_name='agent',
            index=models.Index(fields=['availability'], name='agents_agen_availab_c8e8f5_idx'),
        ),
        migrations.AddIndex(
            model_name='agent',
            index=models.Index(fields=['phone'], name='agents_agen_phone_e3f8c2_idx'),
        ),
        migrations.AddIndex(
            model_name='agent',
            index=models.Index(fields=['email'], name='agents_agen_email_a1b2c3_idx'),
        ),
        migrations.AddIndex(
            model_name='agentdocument',
            index=models.Index(fields=['verification_status'], name='agents_agen_verific_d4e5f6_idx'),
        ),
        migrations.AddIndex(
            model_name='agentdocument',
            index=models.Index(fields=['agent', 'document_type'], name='agents_agen_agent_i_g7h8i9_idx'),
        ),
        migrations.AddIndex(
            model_name='agentauditlog',
            index=models.Index(fields=['agent', 'action'], name='agents_agen_agent_i_j0k1l2_idx'),
        ),
        migrations.AddIndex(
            model_name='agentauditlog',
            index=models.Index(fields=['timestamp'], name='agents_agen_timesta_m3n4o5_idx'),
        ),
        migrations.AddIndex(
            model_name='agentauditlog',
            index=models.Index(fields=['actor'], name='agents_agen_actor_i_p6q7r8_idx'),
        ),
    ]
