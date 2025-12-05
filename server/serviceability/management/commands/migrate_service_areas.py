"""
Django management command to migrate hardcoded service area data to database.

This command migrates the SERVICE_CITIES constant from the frontend codebase
into the ServiceableCity and ServiceablePincode models.

Usage:
    python manage.py migrate_service_areas
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from serviceability.models import ServiceableCity, ServiceablePincode


class Command(BaseCommand):
    help = 'Migrate hardcoded SERVICE_CITIES data to database models'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before migration',
        )

    def handle(self, *args, **options):
        """Execute the migration"""
        
        self.stdout.write(self.style.NOTICE('Starting service area data migration...'))
        
        # Clear existing data if requested
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            ServiceablePincode.objects.all().delete()
            ServiceableCity.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Existing data cleared.'))
        
        # Hardcoded data from client/src/constants/serviceArea.tsx
        available_cities = [
            {
                'name': 'Mumbai',
                'state': 'Maharashtra',
                'latitude': 19.0760,
                'longitude': 72.8777,
                'radius': 50,  # 50 km radius from city center
                'pinCodes': [
                    '400001', '400002', '400003', '400004', '400005',
                    '400006', '400007', '400008', '400009', '400010',
                    '400011', '400012', '400013', '400014', '400015',
                    '400016', '400017', '400018', '400019', '400020',
                    '400021', '400022', '400023', '400024', '400025',
                    '400026', '400027', '400028', '400029', '400030',
                    '400031', '400032', '400033', '400034', '400035',
                    '400049', '400050', '400051', '400052', '400053',
                    '400054', '400055', '400056', '400057', '400058',
                    '400059', '400060', '400061', '400062', '400063',
                    '400064', '400065', '400066', '400067', '400068',
                    '400069', '400070', '400071', '400072', '400074',
                    '400075', '400076', '400077', '400078', '400079',
                    '400080', '400081', '400082', '400083', '400084',
                    '400085', '400086', '400087', '400088', '400089',
                    '400090', '400091', '400092', '400093', '400094',
                    '400095', '400096', '400097', '400098', '400099',
                    '400101', '400102', '400103', '400104', '400105',
                    '401107', '401106', '401108', '401101', '401105',
                    '401208', '401202', '401201', '401210', '401209', '401203'
                ]
            }
        ]
        
        coming_soon_cities = [
            {'name': 'Pune', 'state': 'Maharashtra'},
            {'name': 'Thane', 'state': 'Maharashtra'},
            {'name': 'Navi Mumbai', 'state': 'Maharashtra'},
            {'name': 'Delhi', 'state': 'Delhi'},
            {'name': 'Bangalore', 'state': 'Karnataka'},
            {'name': 'Hyderabad', 'state': 'Telangana'},
        ]
        
        try:
            with transaction.atomic():
                # Migrate available cities
                self.stdout.write(self.style.NOTICE('\nMigrating available cities...'))
                for city_data in available_cities:
                    city, created = ServiceableCity.objects.get_or_create(
                        name=city_data['name'],
                        state=city_data['state'],
                        defaults={
                            'latitude': city_data['latitude'],
                            'longitude': city_data['longitude'],
                            'radius_km': city_data['radius'],
                            'status': 'available'
                        }
                    )
                    
                    if created:
                        self.stdout.write(
                            self.style.SUCCESS(f'  ✓ Created city: {city.name}, {city.state}')
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(f'  ⚠ City already exists: {city.name}, {city.state}')
                        )
                    
                    # Migrate pincodes for this city
                    if 'pinCodes' in city_data:
                        self.stdout.write(
                            self.style.NOTICE(f'  Migrating {len(city_data["pinCodes"])} pincodes for {city.name}...')
                        )
                        
                        # Clean pincodes (remove whitespace)
                        cleaned_pincodes = [pc.strip() for pc in city_data['pinCodes']]
                        
                        # Bulk create pincodes
                        pincodes_to_create = []
                        existing_count = 0
                        invalid_count = 0
                        
                        for pincode in cleaned_pincodes:
                            # Skip if already exists
                            if ServiceablePincode.objects.filter(pincode=pincode).exists():
                                existing_count += 1
                                continue
                            
                            # Validate pincode format (6 digits, starts with 1-9)
                            if len(pincode) == 6 and pincode[0] in '123456789' and pincode.isdigit():
                                pincodes_to_create.append(
                                    ServiceablePincode(
                                        pincode=pincode,
                                        city=city
                                    )
                                )
                            else:
                                invalid_count += 1
                                self.stdout.write(
                                    self.style.ERROR(f'    ✗ Invalid pincode format: {pincode}')
                                )
                        
                        # Bulk create valid pincodes
                        if pincodes_to_create:
                            ServiceablePincode.objects.bulk_create(pincodes_to_create)
                            self.stdout.write(
                                self.style.SUCCESS(f'    ✓ Created {len(pincodes_to_create)} pincodes')
                            )
                        
                        if existing_count > 0:
                            self.stdout.write(
                                self.style.WARNING(f'    ⚠ Skipped {existing_count} existing pincodes')
                            )
                        
                        if invalid_count > 0:
                            self.stdout.write(
                                self.style.ERROR(f'    ✗ Skipped {invalid_count} invalid pincodes')
                            )
                
                # Migrate coming soon cities
                self.stdout.write(self.style.NOTICE('\nMigrating "coming soon" cities...'))
                for city_data in coming_soon_cities:
                    city, created = ServiceableCity.objects.get_or_create(
                        name=city_data['name'],
                        state=city_data['state'],
                        defaults={
                            'latitude': 0.0,  # Placeholder coordinates
                            'longitude': 0.0,
                            'radius_km': 0.0,
                            'status': 'coming_soon'
                        }
                    )
                    
                    if created:
                        self.stdout.write(
                            self.style.SUCCESS(f'  ✓ Created coming soon city: {city.name}, {city.state}')
                        )
                    else:
                        self.stdout.write(
                            self.style.WARNING(f'  ⚠ City already exists: {city.name}, {city.state}')
                        )
                
                # Print summary
                self.stdout.write(self.style.NOTICE('\n' + '='*60))
                self.stdout.write(self.style.SUCCESS('Migration completed successfully!'))
                self.stdout.write(self.style.NOTICE('='*60))
                
                total_cities = ServiceableCity.objects.count()
                available_count = ServiceableCity.objects.filter(status='available').count()
                coming_soon_count = ServiceableCity.objects.filter(status='coming_soon').count()
                total_pincodes = ServiceablePincode.objects.count()
                
                self.stdout.write(self.style.SUCCESS(f'\nTotal cities: {total_cities}'))
                self.stdout.write(self.style.SUCCESS(f'  - Available: {available_count}'))
                self.stdout.write(self.style.SUCCESS(f'  - Coming soon: {coming_soon_count}'))
                self.stdout.write(self.style.SUCCESS(f'Total pincodes: {total_pincodes}'))
                
                # Show breakdown by city
                self.stdout.write(self.style.NOTICE('\nPincodes by city:'))
                for city in ServiceableCity.objects.filter(status='available'):
                    pincode_count = city.pincodes.count()
                    self.stdout.write(
                        self.style.SUCCESS(f'  {city.name}: {pincode_count} pincodes')
                    )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'\n✗ Migration failed: {str(e)}')
            )
            raise
