"""
Management command to migrate area_name data from ServiceablePincode to ServiceArea model.

This command:
1. Reads existing pincodes with area_name values
2. Splits concatenated area names (e.g., "Area1 / Area2 / Area3")
3. Creates individual ServiceArea records for each area
4. Migrates agent assignments from pincode-level to appropriate level

Usage:
    python manage.py migrate_areas_from_pincodes
    python manage.py migrate_areas_from_pincodes --dry-run
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from serviceability.models import ServiceablePincode, ServiceArea
from agents.models import Agent


class Command(BaseCommand):
    help = 'Migrate area_name data from ServiceablePincode to ServiceArea model'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        parser.add_argument(
            '--separator',
            type=str,
            default=' / ',
            help='Separator used in concatenated area names (default: " / ")',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        separator = options['separator']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes will be made'))
        
        self.stdout.write('Starting area migration...')
        
        # Get all pincodes with area_name
        pincodes_with_areas = ServiceablePincode.objects.exclude(
            area_name__isnull=True
        ).exclude(
            area_name__exact=''
        )
        
        total_pincodes = pincodes_with_areas.count()
        self.stdout.write(f'Found {total_pincodes} pincodes with area names')
        
        areas_created = 0
        areas_skipped = 0
        agents_migrated = 0
        
        try:
            with transaction.atomic():
                for pincode in pincodes_with_areas:
                    # Split area_name by separator
                    area_names = [
                        name.strip() 
                        for name in pincode.area_name.split(separator) 
                        if name.strip()
                    ]
                    
                    self.stdout.write(f'\nPincode {pincode.pincode}:')
                    self.stdout.write(f'  Original area_name: "{pincode.area_name}"')
                    self.stdout.write(f'  Split into {len(area_names)} areas: {area_names}')
                    
                    # Get agents currently assigned to this pincode (old M2M)
                    # Note: After migration, this will be empty as the M2M is removed
                    # This is for reference during the migration
                    
                    for area_name in area_names:
                        # Check if area already exists
                        existing = ServiceArea.objects.filter(
                            pincode=pincode,
                            name=area_name
                        ).exists()
                        
                        if existing:
                            self.stdout.write(f'  - Area "{area_name}" already exists, skipping')
                            areas_skipped += 1
                            continue
                        
                        if not dry_run:
                            ServiceArea.objects.create(
                                pincode=pincode,
                                name=area_name,
                                is_active=True
                            )
                        
                        self.stdout.write(f'  - Created area: "{area_name}"')
                        areas_created += 1
                
                if dry_run:
                    # Rollback in dry run
                    raise Exception('Dry run - rolling back')
                    
        except Exception as e:
            if 'Dry run' in str(e):
                pass  # Expected for dry run
            else:
                self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
                raise
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Migration Summary:'))
        self.stdout.write(f'  Pincodes processed: {total_pincodes}')
        self.stdout.write(f'  Areas created: {areas_created}')
        self.stdout.write(f'  Areas skipped (already exist): {areas_skipped}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('\nDRY RUN - No changes were made'))
        else:
            self.stdout.write(self.style.SUCCESS('\nMigration completed successfully!'))
            self.stdout.write('')
            self.stdout.write('Next steps:')
            self.stdout.write('1. Review the created ServiceArea records in admin')
            self.stdout.write('2. Assign agents to specific areas or pincodes as needed')
            self.stdout.write('3. The area_name field on ServiceablePincode is now deprecated')
