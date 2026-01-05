"""
Management command to initialize admin roles and page permissions.

Usage:
    python manage.py setup_admin_permissions
    python manage.py setup_admin_permissions --create-superadmin admin@example.com "Admin Name" password123
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from authentication.models_admin import AdminRole, PagePermission, RolePermission, AdminUser


class Command(BaseCommand):
    help = 'Initialize admin roles and page permissions for the dashboard'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-superadmin',
            nargs=3,
            metavar=('EMAIL', 'NAME', 'PASSWORD'),
            help='Create a superadmin user with the given email, name, and password'
        )

    def handle(self, *args, **options):
        self.stdout.write('Setting up admin permissions...\n')

        with transaction.atomic():
            # Create roles
            self.setup_roles()
            
            # Create page permissions
            self.setup_pages()
            
            # Setup default role permissions
            self.setup_role_permissions()
            
            # Create superadmin if requested
            if options['create_superadmin']:
                email, name, password = options['create_superadmin']
                self.create_superadmin(email, name, password)

        self.stdout.write(self.style.SUCCESS('\nAdmin permissions setup complete!'))

    def setup_roles(self):
        """Create admin and staff roles"""
        roles = [
            {'name': 'admin', 'description': 'Full access to all dashboard features'},
            {'name': 'staff', 'description': 'Limited access based on assigned permissions'},
        ]

        for role_data in roles:
            role, created = AdminRole.objects.get_or_create(
                name=role_data['name'],
                defaults={'description': role_data['description']}
            )
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f'  Role "{role.name}": {status}')

    def setup_pages(self):
        """Create page permissions for all dashboard modules"""
        pages = [
            {'page_key': 'dashboard', 'display_name': 'Dashboard', 'route': '/dashboard', 'order': 1},
            {'page_key': 'analytics', 'display_name': 'Analytics', 'route': '/dashboard/analytics', 'order': 2},
            {'page_key': 'agents', 'display_name': 'Agents', 'route': '/dashboard/agents', 'order': 3},
            {'page_key': 'carousel', 'display_name': 'Carousel', 'route': '/dashboard/carousel', 'order': 4},
            {'page_key': 'catalog', 'display_name': 'Catalog', 'route': '/dashboard/catalog', 'order': 5},
            {'page_key': 'notifications', 'display_name': 'Notifications', 'route': '/dashboard/notifications', 'order': 6},
            {'page_key': 'orders', 'display_name': 'Orders', 'route': '/dashboard/orders', 'order': 7},
            {'page_key': 'referrals', 'display_name': 'Referrals', 'route': '/dashboard/referrals', 'order': 8},
            {'page_key': 'service-orders', 'display_name': 'Service Orders', 'route': '/dashboard/service-orders', 'order': 9},
            {'page_key': 'users', 'display_name': 'Users', 'route': '/dashboard/users', 'order': 10},
            {'page_key': 'authentication', 'display_name': 'Authentication', 'route': '/dashboard/authentication', 'order': 11},
            {'page_key': 'settings', 'display_name': 'Settings', 'route': '/dashboard/settings', 'order': 12},
        ]

        self.stdout.write('\n  Setting up pages:')
        for page_data in pages:
            page, created = PagePermission.objects.get_or_create(
                page_key=page_data['page_key'],
                defaults={
                    'display_name': page_data['display_name'],
                    'route': page_data['route'],
                    'order': page_data['order'],
                }
            )
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f'    {page.display_name}: {status}')

    def setup_role_permissions(self):
        """Setup default permissions for each role"""
        admin_role = AdminRole.objects.get(name='admin')
        staff_role = AdminRole.objects.get(name='staff')
        pages = PagePermission.objects.all()

        self.stdout.write('\n  Setting up role permissions:')

        # Admin gets full access to everything
        for page in pages:
            perm, created = RolePermission.objects.get_or_create(
                role=admin_role,
                page=page,
                defaults={
                    'can_view': True,
                    'can_create': True,
                    'can_edit': True,
                    'can_delete': True,
                }
            )
            if not created:
                # Update existing to ensure full access
                perm.can_view = True
                perm.can_create = True
                perm.can_edit = True
                perm.can_delete = True
                perm.save()

        self.stdout.write(f'    Admin role: Full access to all {pages.count()} pages')

        # Staff gets view-only access by default (can be customized later)
        staff_defaults = {
            'dashboard': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
            'orders': {'can_view': True, 'can_create': False, 'can_edit': True, 'can_delete': False},
            'service-orders': {'can_view': True, 'can_create': False, 'can_edit': True, 'can_delete': False},
            'users': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
            'catalog': {'can_view': True, 'can_create': False, 'can_edit': False, 'can_delete': False},
        }

        for page in pages:
            defaults = staff_defaults.get(page.page_key, {
                'can_view': False,
                'can_create': False,
                'can_edit': False,
                'can_delete': False,
            })
            
            perm, created = RolePermission.objects.get_or_create(
                role=staff_role,
                page=page,
                defaults=defaults
            )

        self.stdout.write(f'    Staff role: Default permissions set for {pages.count()} pages')

    def create_superadmin(self, email, name, password):
        """Create a superadmin user"""
        self.stdout.write(f'\n  Creating superadmin user: {email}')
        
        admin_role = AdminRole.objects.get(name='admin')
        
        if AdminUser.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'    User {email} already exists'))
            return

        admin_user = AdminUser(
            email=email.lower(),
            name=name,
            role=admin_role,
            is_active=True,
            is_email_verified=True,
        )
        admin_user.set_password(password)
        admin_user.save()

        self.stdout.write(self.style.SUCCESS(f'    Superadmin {email} created successfully'))
