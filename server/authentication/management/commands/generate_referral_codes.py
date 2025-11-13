
from django.core.management.base import BaseCommand
from authentication.models import User
from authentication.utils import generate_referral_code


class Command(BaseCommand):
    help = 'Generate referral codes for users who don\'t have one'

    def handle(self, *args, **options):
        users_without_code = User.objects.filter(referral_code__isnull=True) | User.objects.filter(referral_code='')
        count = users_without_code.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('All users already have referral codes!'))
            return
        
        self.stdout.write(f'Found {count} users without referral codes. Generating...')
        
        updated = 0
        for user in users_without_code:
            user.referral_code = generate_referral_code()
            user.save(update_fields=['referral_code'])
            updated += 1
            self.stdout.write(f'  ? Generated code for {user.email}: {user.referral_code}')
        
        self.stdout.write(self.style.SUCCESS(f'\n? Successfully generated {updated} referral codes!'))
