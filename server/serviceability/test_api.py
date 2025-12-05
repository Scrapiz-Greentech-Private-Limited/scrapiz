"""
API endpoint tests for serviceability management.

Tests the REST API endpoints for checking serviceability by pincode
and coordinates, as well as listing cities and pincodes.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from .models import ServiceableCity, ServiceablePincode


class ServiceabilityAPITests(TestCase):
    """Tests for serviceability API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        # Create test cities
        self.mumbai = ServiceableCity.objects.create(
            name='Mumbai',
            state='Maharashtra',
            latitude=19.0760,
            longitude=72.8777,
            radius_km=50.0,
            status='available'
        )
        
        self.delhi = ServiceableCity.objects.create(
            name='Delhi',
            state='Delhi',
            latitude=28.6139,
            longitude=77.2090,
            radius_km=40.0,
            status='coming_soon'
        )
        
        # Create test pincodes
        self.pincode1 = ServiceablePincode.objects.create(
            pincode='400001',
            city=self.mumbai,
            area_name='Fort'
        )
        self.pincode2 = ServiceablePincode.objects.create(
            pincode='400002',
            city=self.mumbai,
            area_name='Kalbadevi'
        )
        self.pincode3 = ServiceablePincode.objects.create(
            pincode='110001',
            city=self.delhi,
            area_name='Connaught Place'
        )
        
        # Set up API client
        self.client = APIClient()
    
    def test_list_cities(self):
        """Test GET /api/serviceability/cities/"""
        url = reverse('serviceable-city-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Verify city data structure
        city_data = response.data[0]
        self.assertIn('id', city_data)
        self.assertIn('name', city_data)
        self.assertIn('state', city_data)
        self.assertIn('latitude', city_data)
        self.assertIn('longitude', city_data)
        self.assertIn('radius_km', city_data)
        self.assertIn('status', city_data)
        self.assertIn('pincode_count', city_data)
    
    def test_list_cities_filter_by_status(self):
        """Test filtering cities by status"""
        url = reverse('serviceable-city-list')
        
        # Filter for available cities
        response = self.client.get(url, {'status': 'available'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Mumbai')
        
        # Filter for coming soon cities
        response = self.client.get(url, {'status': 'coming_soon'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Delhi')
    
    def test_list_pincodes(self):
        """Test GET /api/serviceability/pincodes/"""
        url = reverse('serviceable-pincode-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        
        # Verify pincode data structure
        pincode_data = response.data[0]
        self.assertIn('id', pincode_data)
        self.assertIn('pincode', pincode_data)
        self.assertIn('city', pincode_data)
        self.assertIn('city_name', pincode_data)
        self.assertIn('city_state', pincode_data)
        self.assertIn('city_status', pincode_data)
        self.assertIn('area_name', pincode_data)
    
    def test_list_pincodes_filter_by_city(self):
        """Test filtering pincodes by city"""
        url = reverse('serviceable-pincode-list')
        response = self.client.get(url, {'city': self.mumbai.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Verify all pincodes belong to Mumbai
        for pincode_data in response.data:
            self.assertEqual(pincode_data['city_name'], 'Mumbai')
    
    def test_list_pincodes_search(self):
        """Test searching pincodes"""
        url = reverse('serviceable-pincode-list')
        response = self.client.get(url, {'search': '4000'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Verify all pincodes start with 4000
        for pincode_data in response.data:
            self.assertTrue(pincode_data['pincode'].startswith('4000'))
    
    def test_check_pincode_serviceable(self):
        """Test checking a serviceable pincode"""
        url = reverse('check-pincode')
        data = {'pincode': '400001'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['serviceable'])
        self.assertEqual(response.data['status'], 'available')
        self.assertIn('city', response.data)
        self.assertEqual(response.data['city']['name'], 'Mumbai')
        self.assertIn('message', response.data)
    
    def test_check_pincode_coming_soon(self):
        """Test checking a coming soon pincode"""
        url = reverse('check-pincode')
        data = {'pincode': '110001'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['serviceable'])
        self.assertEqual(response.data['status'], 'coming_soon')
        self.assertIn('city', response.data)
        self.assertEqual(response.data['city']['name'], 'Delhi')
        self.assertIn('coming soon', response.data['message'].lower())
    
    def test_check_pincode_not_serviceable(self):
        """Test checking a non-serviceable pincode"""
        url = reverse('check-pincode')
        data = {'pincode': '560001'}  # Bangalore pincode (not in database)
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['serviceable'])
        self.assertIn('message', response.data)
    
    def test_check_pincode_invalid_format(self):
        """Test checking pincode with invalid format"""
        url = reverse('check-pincode')
        
        # Test with invalid length
        data = {'pincode': '12345'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test with starting with 0
        data = {'pincode': '012345'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test with non-numeric
        data = {'pincode': 'ABCDEF'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_check_pincode_missing_parameter(self):
        """Test checking pincode without providing pincode parameter"""
        url = reverse('check-pincode')
        data = {}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_check_coordinates_serviceable(self):
        """Test checking serviceable coordinates"""
        url = reverse('check-coordinates')
        # Coordinates near Mumbai center
        data = {
            'latitude': 19.0760,
            'longitude': 72.8777
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['serviceable'])
        self.assertIn('city', response.data)
        self.assertEqual(response.data['city']['name'], 'Mumbai')
        self.assertIn('distance_km', response.data)
        self.assertLess(response.data['distance_km'], 1.0)  # Very close to center
    
    def test_check_coordinates_not_serviceable(self):
        """Test checking non-serviceable coordinates"""
        url = reverse('check-coordinates')
        # Coordinates in Bangalore (not serviceable)
        data = {
            'latitude': 12.9716,
            'longitude': 77.5946
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['serviceable'])
        self.assertIn('nearest_city', response.data)
        self.assertIn('message', response.data)
    
    def test_check_coordinates_invalid_latitude(self):
        """Test checking coordinates with invalid latitude"""
        url = reverse('check-coordinates')
        
        # Latitude too high
        data = {'latitude': 91.0, 'longitude': 72.8777}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Latitude too low
        data = {'latitude': -91.0, 'longitude': 72.8777}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_check_coordinates_invalid_longitude(self):
        """Test checking coordinates with invalid longitude"""
        url = reverse('check-coordinates')
        
        # Longitude too high
        data = {'latitude': 19.0760, 'longitude': 181.0}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Longitude too low
        data = {'latitude': 19.0760, 'longitude': -181.0}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_check_coordinates_missing_parameters(self):
        """Test checking coordinates without required parameters"""
        url = reverse('check-coordinates')
        
        # Missing latitude
        data = {'longitude': 72.8777}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Missing longitude
        data = {'latitude': 19.0760}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Missing both
        data = {}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_check_coordinates_within_radius(self):
        """Test that coordinates within radius are serviceable"""
        url = reverse('check-coordinates')
        # Coordinates about 30km from Mumbai center (within 50km radius)
        data = {
            'latitude': 19.2000,
            'longitude': 72.9500
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['serviceable'])
        self.assertEqual(response.data['city']['name'], 'Mumbai')
        self.assertLess(response.data['distance_km'], 50.0)
    
    def test_check_coordinates_outside_radius(self):
        """Test that coordinates outside radius are not serviceable"""
        url = reverse('check-coordinates')
        # Coordinates far from any serviceable city
        data = {
            'latitude': 13.0827,
            'longitude': 80.2707  # Chennai
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['serviceable'])
        self.assertIn('nearest_city', response.data)
