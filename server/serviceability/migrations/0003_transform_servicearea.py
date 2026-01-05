# Migration to transform ServiceArea from city-based to pincode-based

from django.db import migrations, models
import django.db.models.deletion
import django.core.validators
from django.utils import timezone


def link_areas_to_pincodes(apps, schema_editor):
    """
    Data migration: Link existing ServiceArea records to pincodes.
    Since old ServiceArea had city FK, we'll link to the first pincode of that city.
    """
    ServiceArea = apps.get_model('serviceability', 'ServiceArea')
    ServiceablePincode = apps.get_model('serviceability', 'ServiceablePincode')
    
    for area in ServiceArea.objects.all():
        # Try to find a pincode in the same city (if city_id still exists)
        if hasattr(area, 'city_id') and area.city_id:
            pincode = ServiceablePincode.objects.filter(city_id=area.city_id).first()
            if pincode:
                area.pincode = pincode
                area.save()


def reverse_link(apps, schema_editor):
    """Reverse migration - no-op since we're removing the field"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('serviceability', '0002_servicearea_serviceablepincode_service_area'),
    ]

    operations = [
        # Step 1: Remove the service_area field from ServiceablePincode (FK from pincode to area)
        migrations.RemoveField(
            model_name='serviceablepincode',
            name='service_area',
        ),
        
        # Step 2: Add new pincode FK field to ServiceArea FIRST (nullable initially)
        migrations.AddField(
            model_name='servicearea',
            name='pincode',
            field=models.ForeignKey(
                help_text='The pincode this area belongs to',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='areas',
                to='serviceability.serviceablepincode',
                null=True,
                blank=True,
            ),
        ),
        
        # Step 3: Add other new fields
        migrations.AddField(
            model_name='servicearea',
            name='latitude',
            field=models.DecimalField(
                blank=True,
                decimal_places=6,
                help_text='Optional: Latitude coordinate of the area center',
                max_digits=9,
                null=True,
                validators=[
                    django.core.validators.MinValueValidator(-90.0),
                    django.core.validators.MaxValueValidator(90.0)
                ]
            ),
        ),
        migrations.AddField(
            model_name='servicearea',
            name='longitude',
            field=models.DecimalField(
                blank=True,
                decimal_places=6,
                help_text='Optional: Longitude coordinate of the area center',
                max_digits=9,
                null=True,
                validators=[
                    django.core.validators.MinValueValidator(-180.0),
                    django.core.validators.MaxValueValidator(180.0)
                ]
            ),
        ),
        migrations.AddField(
            model_name='servicearea',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='servicearea',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        
        # Step 4: Run data migration to link areas to pincodes
        migrations.RunPython(link_areas_to_pincodes, reverse_link),
        
        # Step 5: Now remove old fields (city, zone)
        migrations.RemoveField(
            model_name='servicearea',
            name='city',
        ),
        migrations.RemoveField(
            model_name='servicearea',
            name='zone',
        ),
        
        # Step 6: Update field definitions
        migrations.AlterField(
            model_name='servicearea',
            name='name',
            field=models.CharField(
                help_text="Name of the area/locality (e.g., 'Adarsh Nagar', 'DN Nagar')",
                max_length=200
            ),
        ),
        migrations.AlterField(
            model_name='servicearea',
            name='is_active',
            field=models.BooleanField(
                default=True,
                help_text='Whether this area is currently serviceable'
            ),
        ),
        
        # Step 7: Update Meta options (without unique_together yet)
        migrations.AlterModelOptions(
            name='servicearea',
            options={
                'ordering': ['pincode', 'name'],
                'verbose_name': 'Service Area',
                'verbose_name_plural': 'Service Areas'
            },
        ),
        
        # Step 8: Now add unique_together (after pincode field exists)
        migrations.AlterUniqueTogether(
            name='servicearea',
            unique_together={('pincode', 'name')},
        ),
        
        # Step 9: Add indexes
        migrations.AddIndex(
            model_name='servicearea',
            index=models.Index(fields=['pincode', 'is_active'], name='serviceabil_pincode_e9b05f_idx'),
        ),
        migrations.AddIndex(
            model_name='servicearea',
            index=models.Index(fields=['name'], name='serviceabil_name_1ff933_idx'),
        ),
    ]
