from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from .models import ServiceableCity, ServiceablePincode
from .admin import ServiceableCityAdmin, ServiceablePincodeAdmin
from django.contrib.admin.sites import AdminSite
import io
import csv

User = get_user_model()


class AdminConfigurationTests(TestCase):
    """Tests for Django Admin configuration"""
    
    def setUp(self):
        """Set up test data"""
        # Create superuser
        self.superuser = User.objects.create_superuser(
            email='admin@test.com',
            password='testpass123',
            name='Admin User'
        )
        
        # Create test city
        self.city = ServiceableCity.objects.create(
            name='Mumbai',
            state='Maharashtra',
            latitude=19.0760,
            longitude=72.8777,
            radius_km=50.0,
            status='available'
        )
        
        # Create test pincodes
        self.pincode1 = ServiceablePincode.objects.create(
            pincode='400001',
            city=self.city,
            area_name='Fort'
        )
        self.pincode2 = ServiceablePincode.objects.create(
            pincode='400002',
            city=self.city,
            area_name='Kalbadevi'
        )
        
        # Set up client and login
        self.client = Client()
        self.client.force_login(self.superuser)
        
        # Set up admin instances
        self.site = AdminSite()
        self.city_admin = ServiceableCityAdmin(ServiceableCity, self.site)
        self.pincode_admin = ServiceablePincodeAdmin(ServiceablePincode, self.site)
    
    def test_city_admin_list_display(self):
        """Test that city admin displays correct fields"""
        expected_fields = [
            'name_with_icon',
            'state',
            'status_badge',
            'pincode_count_display',
            'coordinates_display',
            'radius_km',
            'updated_at'
        ]
        self.assertEqual(list(self.city_admin.list_display), expected_fields)
    
    def test_city_admin_filters(self):
        """Test that city admin has correct filters"""
        expected_filters = ('status', 'state', 'created_at', 'updated_at')
        self.assertEqual(self.city_admin.list_filter, expected_filters)
    
    def test_city_admin_search_fields(self):
        """Test that city admin has correct search fields"""
        expected_search = ('name', 'state')
        self.assertEqual(self.city_admin.search_fields, expected_search)
    
    def test_city_admin_has_inline(self):
        """Test that city admin has pincode inline"""
        self.assertEqual(len(self.city_admin.inlines), 1)
        self.assertEqual(self.city_admin.inlines[0].model, ServiceablePincode)
    
    def test_pincode_admin_list_display(self):
        """Test that pincode admin displays correct fields"""
        expected_fields = [
            'pincode',
            'city_link',
            'area_name',
            'city_status',
            'created_at'
        ]
        self.assertEqual(list(self.pincode_admin.list_display), expected_fields)
    
    def test_pincode_admin_filters(self):
        """Test that pincode admin has correct filters"""
        expected_filters = ('city__status', 'city__state', 'city', 'created_at')
        self.assertEqual(self.pincode_admin.list_filter, expected_filters)
    
    def test_pincode_admin_search_fields(self):
        """Test that pincode admin has correct search fields"""
        expected_search = ('pincode', 'area_name', 'city__name', 'city__state')
        self.assertEqual(self.pincode_admin.search_fields, expected_search)
    
    def test_city_admin_actions_exist(self):
        """Test that city admin has bulk actions"""
        actions = self.city_admin.actions
        self.assertIn('mark_as_available', actions)
        self.assertIn('mark_as_coming_soon', actions)
        self.assertIn('export_cities_csv', actions)
    
    def test_pincode_admin_actions_exist(self):
        """Test that pincode admin has export action"""
        actions = self.pincode_admin.actions
        self.assertIn('export_pincodes_csv', actions)
    
    def test_city_admin_changelist_accessible(self):
        """Test that city admin changelist page is accessible"""
        url = reverse('admin:serviceability_serviceablecity_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
    
    def test_pincode_admin_changelist_accessible(self):
        """Test that pincode admin changelist page is accessible"""
        url = reverse('admin:serviceability_serviceablepincode_changelist')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
    
    def test_city_admin_add_page_accessible(self):
        """Test that city admin add page is accessible"""
        url = reverse('admin:serviceability_serviceablecity_add')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
    
    def test_city_admin_change_page_accessible(self):
        """Test that city admin change page is accessible"""
        url = reverse('admin:serviceability_serviceablecity_change', args=[self.city.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
    
    def test_pincode_count_display(self):
        """Test that pincode count is displayed correctly"""
        from django.test import RequestFactory
        request = RequestFactory().get('/')
        
        count_display = self.city_admin.pincode_count_display(self.city)
        self.assertIn('2 pincodes', count_display)
    
    def test_coordinates_display(self):
        """Test that coordinates are displayed correctly"""
        coords = self.city_admin.coordinates_display(self.city)
        self.assertIn('19.0760', coords)
        self.assertIn('72.8777', coords)
    
    def test_export_cities_csv_action(self):
        """Test CSV export for cities"""
        from django.test import RequestFactory
        from django.contrib.messages.storage.fallback import FallbackStorage
        
        request = RequestFactory().post('/')
        request.user = self.superuser
        
        # Add messages middleware
        setattr(request, 'session', 'session')
        messages = FallbackStorage(request)
        setattr(request, '_messages', messages)
        
        queryset = ServiceableCity.objects.filter(id=self.city.id)
        response = self.city_admin.export_cities_csv(request, queryset)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment', response['Content-Disposition'])
        
        # Verify CSV content
        content = response.content.decode('utf-8')
        self.assertIn('Mumbai', content)
        self.assertIn('Maharashtra', content)
    
    def test_export_pincodes_csv_action(self):
        """Test CSV export for pincodes"""
        from django.test import RequestFactory
        from django.contrib.messages.storage.fallback import FallbackStorage
        
        request = RequestFactory().post('/')
        request.user = self.superuser
        
        # Add messages middleware
        setattr(request, 'session', 'session')
        messages = FallbackStorage(request)
        setattr(request, '_messages', messages)
        
        queryset = ServiceablePincode.objects.filter(city=self.city)
        response = self.pincode_admin.export_pincodes_csv(request, queryset)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')
        
        # Verify CSV content
        content = response.content.decode('utf-8')
        self.assertIn('400001', content)
        self.assertIn('400002', content)
        self.assertIn('Fort', content)
    
    def test_mark_as_available_action(self):
        """Test bulk action to mark cities as available"""
        from django.test import RequestFactory
        from django.contrib.messages.storage.fallback import FallbackStorage
        
        # Create a coming soon city
        coming_soon_city = ServiceableCity.objects.create(
            name='Delhi',
            state='Delhi',
            latitude=28.6139,
            longitude=77.2090,
            radius_km=40.0,
            status='coming_soon'
        )
        
        request = RequestFactory().post('/')
        request.user = self.superuser
        
        # Add messages middleware
        setattr(request, 'session', 'session')
        messages = FallbackStorage(request)
        setattr(request, '_messages', messages)
        
        queryset = ServiceableCity.objects.filter(id=coming_soon_city.id)
        self.city_admin.mark_as_available(request, queryset)
        
        # Verify status changed
        coming_soon_city.refresh_from_db()
        self.assertEqual(coming_soon_city.status, 'available')
    
    def test_mark_as_coming_soon_action(self):
        """Test bulk action to mark cities as coming soon"""
        from django.test import RequestFactory
        from django.contrib.messages.storage.fallback import FallbackStorage
        
        request = RequestFactory().post('/')
        request.user = self.superuser
        
        # Add messages middleware
        setattr(request, 'session', 'session')
        messages = FallbackStorage(request)
        setattr(request, '_messages', messages)
        
        queryset = ServiceableCity.objects.filter(id=self.city.id)
        self.city_admin.mark_as_coming_soon(request, queryset)
        
        # Verify status changed
        self.city.refresh_from_db()
        self.assertEqual(self.city.status, 'coming_soon')
    
    def test_dashboard_view_accessible(self):
        """Test that custom dashboard is accessible"""
        url = reverse('admin:serviceability_dashboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        
        # Verify context data
        self.assertIn('total_cities', response.context)
        self.assertIn('available_cities', response.context)
        self.assertIn('coming_soon_cities', response.context)
        self.assertIn('total_pincodes', response.context)
    
    def test_import_pincodes_view_accessible(self):
        """Test that import pincodes page is accessible"""
        url = reverse('admin:serviceability_import_pincodes')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('cities', response.context)


# Tests will be implemented in subsequent tasks
