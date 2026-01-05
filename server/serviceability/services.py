
from typing import Dict, Optional, Tuple
from decimal import Decimal
import math

from .models import ServiceableCity, ServiceablePincode


class ServiceabilityService:
    """
    Service class for handling serviceability checks.
    
    This class provides methods to check if a location is serviceable
    based on pincode or geographic coordinates.
    """
    
    @staticmethod
    def check_pincode(pincode: str) -> Dict:
        """
        Check if a pincode is serviceable.
        
        Args:
            pincode: A 6-digit Indian postal code string
            
        Returns:
            Dictionary containing:
                - serviceable (bool): Whether the pincode is serviceable
                - city (dict): City details if serviceable
                - status (str): Service status ('available' or 'coming_soon')
                - message (str): User-friendly message
                
        Example:
            >>> ServiceabilityService.check_pincode("400001")
            {
                'serviceable': True,
                'city': {'id': 1, 'name': 'Mumbai', ...},
                'status': 'available',
                'message': 'Service available in Mumbai'
            }
        """
        # Validate pincode format
        if not pincode or not isinstance(pincode, str):
            return {
                'serviceable': False,
                'message': 'Invalid pincode format'
            }
        
        # Clean the pincode
        pincode = pincode.strip()
        
        # Check if pincode exists in database
        try:
            pincode_obj = ServiceablePincode.objects.select_related('city').get(
                pincode=pincode
            )
            
            city = pincode_obj.city
            
            # Check city status
            if city.status == 'available':
                return {
                    'serviceable': True,
                    'city': {
                        'id': city.id,
                        'name': city.name,
                        'state': city.state,
                        'latitude': float(city.latitude),
                        'longitude': float(city.longitude),
                        'radius_km': float(city.radius_km),
                        'status': city.status,
                    },
                    'status': 'available',
                    'message': f'Service available in {city.name}'
                }
            else:  # coming_soon
                return {
                    'serviceable': False,
                    'city': {
                        'id': city.id,
                        'name': city.name,
                        'state': city.state,
                        'latitude': float(city.latitude),
                        'longitude': float(city.longitude),
                        'radius_km': float(city.radius_km),
                        'status': city.status,
                    },
                    'status': 'coming_soon',
                    'message': f'Service coming soon to {city.name}'
                }
                
        except ServiceablePincode.DoesNotExist:
            return {
                'serviceable': False,
                'message': 'Service not available in your area yet'
            }
    
    @staticmethod
    def check_coordinates(latitude: float, longitude: float) -> Dict:
        """
        Check if coordinates are within a serviceable area.
        
        Uses the haversine formula to calculate distance from city centers
        and determines if the location falls within any city's service radius.
        
        Args:
            latitude: Latitude coordinate (-90 to 90)
            longitude: Longitude coordinate (-180 to 180)
            
        Returns:
            Dictionary containing:
                - serviceable (bool): Whether the location is serviceable
                - city (dict): Nearest serviceable city details if within radius
                - distance_km (float): Distance to the city center
                - nearest_city (dict): Nearest city info even if not serviceable
                - message (str): User-friendly message
                
        Example:
            >>> ServiceabilityService.check_coordinates(19.0760, 72.8777)
            {
                'serviceable': True,
                'city': {'id': 1, 'name': 'Mumbai', ...},
                'distance_km': 5.2,
                'message': 'Service available in Mumbai'
            }
        """
        # Validate coordinates
        if not isinstance(latitude, (int, float, Decimal)) or \
           not isinstance(longitude, (int, float, Decimal)):
            return {
                'serviceable': False,
                'message': 'Invalid coordinates'
            }
        
        latitude = float(latitude)
        longitude = float(longitude)
        
        if latitude < -90 or latitude > 90:
            return {
                'serviceable': False,
                'message': 'Latitude must be between -90 and 90'
            }
        
        if longitude < -180 or longitude > 180:
            return {
                'serviceable': False,
                'message': 'Longitude must be between -180 and 180'
            }
        
        # Get all cities (both available and coming_soon)
        all_cities = ServiceableCity.objects.all()
        available_cities = ServiceableCity.objects.filter(status='available')
        
        if not all_cities.exists():
            return {
                'serviceable': False,
                'message': 'Service not available in any area yet'
            }
        
        # Find the nearest city and check if within radius
        nearest_city = None
        nearest_distance = float('inf')
        serviceable_city = None
        serviceable_distance = None
        coming_soon_city = None
        coming_soon_distance = None
        
        # First check available cities
        for city in available_cities:
            distance = ServiceabilityService.calculate_distance(
                latitude, longitude,
                float(city.latitude), float(city.longitude)
            )
            
            # Track nearest available city
            if distance < nearest_distance:
                nearest_distance = distance
                nearest_city = city
            
            # Check if within service radius
            if distance <= float(city.radius_km):
                if serviceable_city is None or distance < serviceable_distance:
                    serviceable_city = city
                    serviceable_distance = distance
        
        # If not serviceable, check coming_soon cities
        if not serviceable_city:
            coming_soon_cities = ServiceableCity.objects.filter(status='coming_soon')
            for city in coming_soon_cities:
                distance = ServiceabilityService.calculate_distance(
                    latitude, longitude,
                    float(city.latitude), float(city.longitude)
                )
                
                # Check if within coming soon city's radius
                if distance <= float(city.radius_km):
                    if coming_soon_city is None or distance < coming_soon_distance:
                        coming_soon_city = city
                        coming_soon_distance = distance
        
        # Build response
        if serviceable_city:
            return {
                'serviceable': True,
                'city': {
                    'id': serviceable_city.id,
                    'name': serviceable_city.name,
                    'state': serviceable_city.state,
                    'latitude': float(serviceable_city.latitude),
                    'longitude': float(serviceable_city.longitude),
                    'radius_km': float(serviceable_city.radius_km),
                    'status': serviceable_city.status,
                },
                'status': 'available',
                'distance_km': round(serviceable_distance, 2),
                'message': f'Service available in {serviceable_city.name}'
            }
        elif coming_soon_city:
            # Location is within a coming soon city
            return {
                'serviceable': False,
                'city': {
                    'id': coming_soon_city.id,
                    'name': coming_soon_city.name,
                    'state': coming_soon_city.state,
                    'latitude': float(coming_soon_city.latitude),
                    'longitude': float(coming_soon_city.longitude),
                    'radius_km': float(coming_soon_city.radius_km),
                    'status': coming_soon_city.status,
                },
                'status': 'coming_soon',
                'distance_km': round(coming_soon_distance, 2),
                'message': f'Service coming soon to {coming_soon_city.name}'
            }
        else:
            # Not serviceable, but provide nearest city info
            response = {
                'serviceable': False,
                'message': 'Service not available in your area yet'
            }
            
            if nearest_city:
                response['nearest_city'] = {
                    'name': nearest_city.name,
                    'state': nearest_city.state,
                    'distance_km': round(nearest_distance, 2)
                }
                response['message'] = f'Service not available. Nearest city: {nearest_city.name} ({round(nearest_distance, 2)} km away)'
            
            return response
    
    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate the great-circle distance between two points on Earth.
        
        Uses the Haversine formula to calculate the distance between two
        points on a sphere given their longitudes and latitudes.
        
        Args:
            lat1: Latitude of first point in degrees
            lon1: Longitude of first point in degrees
            lat2: Latitude of second point in degrees
            lon2: Longitude of second point in degrees
            
        Returns:
            Distance in kilometers
            
        Example:
            >>> ServiceabilityService.calculate_distance(19.0760, 72.8777, 19.1136, 72.8697)
            4.23
            
        References:
            https://en.wikipedia.org/wiki/Haversine_formula
        """
        # Earth's radius in kilometers
        R = 6371.0
        
        # Convert degrees to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Differences
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        # Haversine formula
        a = math.sin(dlat / 2)**2 + \
            math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Distance in kilometers
        distance = R * c
        
        return distance
    
    @staticmethod
    def get_nearest_city(latitude: float, longitude: float) -> Optional[Tuple[ServiceableCity, float]]:
        """
        Find the nearest serviceable city to given coordinates.
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            
        Returns:
            Tuple of (ServiceableCity, distance_km) or None if no cities exist
            
        Example:
            >>> city, distance = ServiceabilityService.get_nearest_city(19.0760, 72.8777)
            >>> print(f"{city.name} is {distance:.2f} km away")
            Mumbai is 5.23 km away
        """
        # Validate coordinates
        if not isinstance(latitude, (int, float, Decimal)) or \
           not isinstance(longitude, (int, float, Decimal)):
            return None
        
        latitude = float(latitude)
        longitude = float(longitude)
        
        if latitude < -90 or latitude > 90 or longitude < -180 or longitude > 180:
            return None
        
        # Get all cities (including coming_soon)
        cities = ServiceableCity.objects.all()
        
        if not cities.exists():
            return None
        
        nearest_city = None
        nearest_distance = float('inf')
        
        for city in cities:
            distance = ServiceabilityService.calculate_distance(
                latitude, longitude,
                float(city.latitude), float(city.longitude)
            )
            
            if distance < nearest_distance:
                nearest_distance = distance
                nearest_city = city
        
        if nearest_city:
            return (nearest_city, nearest_distance)
        
        return None
