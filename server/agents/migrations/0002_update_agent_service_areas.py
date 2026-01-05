# Migration to update Agent service areas relationships

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('agents', '0001_initial'),
        ('serviceability', '0003_transform_servicearea'),
    ]

    operations = [
        # Remove old service_areas M2M (was pointing to ServiceablePincode)
        migrations.RemoveField(
            model_name='agent',
            name='service_areas',
        ),
        
        # Add new service_areas M2M pointing to ServiceArea
        migrations.AddField(
            model_name='agent',
            name='service_areas',
            field=models.ManyToManyField(
                blank=True,
                help_text='Specific areas where this agent can operate (area-wise assignment)',
                related_name='agents',
                to='serviceability.servicearea'
            ),
        ),
        
        # Add service_pincodes M2M for pincode-level assignment
        migrations.AddField(
            model_name='agent',
            name='service_pincodes',
            field=models.ManyToManyField(
                blank=True,
                help_text='Pincodes where this agent covers all areas (pincode-wise assignment)',
                related_name='pincode_agents',
                to='serviceability.serviceablepincode'
            ),
        ),
    ]
