from django.core.management.base import BaseCommand
from inventory.models import Product

# Default environmental impact values by product name keywords
IMPACT_VALUES = {
    # Paper products
    'newspaper': {'trees': 0.17, 'co2': 2.5},
    'paper': {'trees': 0.15, 'co2': 2.2},
    'cardboard': {'trees': 0.15, 'co2': 2.0},
    'carton': {'trees': 0.14, 'co2': 1.8},
    'magazine': {'trees': 0.16, 'co2': 2.3},
    'book': {'trees': 0.18, 'co2': 2.6},
    
    # Plastic products
    'plastic': {'trees': 0.05, 'co2': 3.0},
    'pet': {'trees': 0.05, 'co2': 3.0},
    'bottle': {'trees': 0.04, 'co2': 2.8},
    'hdpe': {'trees': 0.06, 'co2': 3.2},
    
    # Metal products
    'iron': {'trees': 0.02, 'co2': 4.5},
    'steel': {'trees': 0.02, 'co2': 4.5},
    'copper': {'trees': 0.03, 'co2': 5.0},
    'aluminium': {'trees': 0.04, 'co2': 9.0},
    'aluminum': {'trees': 0.04, 'co2': 9.0},
    'brass': {'trees': 0.03, 'co2': 4.8},
    'metal': {'trees': 0.02, 'co2': 4.0},
    
    # Glass products
    'glass': {'trees': 0.01, 'co2': 0.3},
    
    # E-waste
    'electronic': {'trees': 0.01, 'co2': 6.0},
    'e-waste': {'trees': 0.01, 'co2': 6.0},
    'battery': {'trees': 0.01, 'co2': 5.0},
    
    # Textile
    'cloth': {'trees': 0.08, 'co2': 3.5},
    'textile': {'trees': 0.08, 'co2': 3.5},
    'fabric': {'trees': 0.08, 'co2': 3.5},
}

class Command(BaseCommand):
    help = 'Set environmental impact values for products based on their names'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        products = Product.objects.all()
        updated_count = 0
        
        self.stdout.write(f"Processing {products.count()} products...\n")
        
        for product in products:
            if not product.name:
                continue
                
            product_name_lower = product.name.lower()
            matched = False
            
            # Find matching impact values based on product name
            for keyword, values in IMPACT_VALUES.items():
                if keyword in product_name_lower:
                    if dry_run:
                        self.stdout.write(
                            f"  [DRY RUN] Would update '{product.name}': "
                            f"trees={values['trees']}, co2={values['co2']}"
                        )
                    else:
                        product.trees_saved_per_unit = values['trees']
                        product.co2_reduced_per_unit = values['co2']
                        product.save(update_fields=['trees_saved_per_unit', 'co2_reduced_per_unit'])
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"  Updated '{product.name}': "
                                f"trees={values['trees']}, co2={values['co2']}"
                            )
                        )
                    updated_count += 1
                    matched = True
                    break
            
            if not matched:
                self.stdout.write(
                    self.style.WARNING(f"  No match for '{product.name}' - using defaults (0.1, 2.0)")
                )
                if not dry_run:
                    # Set default values for unmatched products
                    product.trees_saved_per_unit = 0.1
                    product.co2_reduced_per_unit = 2.0
                    product.save(update_fields=['trees_saved_per_unit', 'co2_reduced_per_unit'])
                updated_count += 1
        
        if dry_run:
            self.stdout.write(f"\n[DRY RUN] Would update {updated_count} products")
        else:
            self.stdout.write(self.style.SUCCESS(f"\nUpdated {updated_count} products"))
